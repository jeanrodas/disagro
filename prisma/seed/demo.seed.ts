import type { TipoItem } from '../../src/domain/descuentos';
import { prisma } from '../../src/lib/prisma';
import { confirmacionSchema } from '../../src/schemas/confirmacion.schema';
import { canjearCodigo } from '../../src/services/codigos.service';
import { confirmarAsistencia } from '../../src/services/confirmacion.service';
import { CLIENTES_DEMO, type ClienteDemo } from './demo.data';

/**
 * Siembra los clientes de demostración.
 *
 * NO reimplementa ninguna regla: cada cliente pasa por el MISMO camino que una
 * confirmación real (POST /api/confirmar):
 *   - confirmacionSchema     valida y normaliza los datos, como el endpoint
 *   - confirmarAsistencia()  toma los precios de la BD, calcula los descuentos con
 *                            calcularDescuentos, genera los códigos con el generador
 *                            criptográfico y lo guarda todo en una transacción
 *   - canjearCodigo()        el UPDATE atómico del endpoint de canje
 *
 * Idempotente y sin interferencias: un cliente de demo solo se crea si su email NO
 * existe. Si ya existe (porque se sembró antes, o porque alguien confirmó de verdad
 * con ese correo) no se toca. Y nunca se lee, modifica ni borra ningún otro cliente.
 */

/**
 * 'ocupado' = el email del cliente de demo ya lo usa otra persona (alguien confirmó
 * de verdad con ese correo). Tampoco se toca, pero se distingue en el log para que no
 * parezca que el cliente de demo sigue ahí.
 */
export type ResultadoSeedDemo = 'creado' | 'ya existía' | 'ocupado';

export interface CodigoResumen {
  codigo: string;
  tipo: TipoItem;
  porcentaje: number;
  estado: 'EMITIDO' | 'CANJEADO';
}

export interface ResumenClienteDemo {
  email: string;
  nombre: string;
  resultado: ResultadoSeedDemo;
  codigos: CodigoResumen[];
}

const ZONA_HORARIA_FERIA = 'America/Guatemala';
const MS_POR_DIA = 86_400_000;

/** AAAA-MM-DD de hoy en Guatemala más `dias`: el mismo formato que envía el formulario. */
function fechaEnGuatemala(dias: number): string {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA_FERIA }).format(new Date());
  return new Date(Date.parse(`${hoy}T00:00:00Z`) + dias * MS_POR_DIA).toISOString().slice(0, 10);
}

const existeCliente = async (email: string) =>
  (await prisma.cliente.findUnique({ where: { email }, select: { id: true } })) !== null;

const codigosDe = (email: string): Promise<CodigoResumen[]> =>
  prisma.codigoDescuento.findMany({
    where: { cliente: { email } },
    select: { codigo: true, tipo: true, porcentaje: true, estado: true },
    orderBy: { tipo: 'asc' },
  });

export async function sembrarClientesDemo(): Promise<ResumenClienteDemo[]> {
  const items = await prisma.item.findMany({ select: { id: true, nombre: true } });
  const idPorNombre = new Map(items.map((item) => [item.nombre, item.id]));

  const resumen: ResumenClienteDemo[] = [];
  // En serie, no en paralelo: son pocos y así el orden del log es el del fichero
  for (const demo of CLIENTES_DEMO) resumen.push(await sembrarClienteDemo(demo, idPorNombre));
  return resumen;
}

async function sembrarClienteDemo(demo: ClienteDemo, idPorNombre: Map<string, string>): Promise<ResumenClienteDemo> {
  const nombre = `${demo.nombre} ${demo.apellidos}`;
  // El resumen muestra a quien de verdad está en la base, no el nombre del fichero
  const yaExistia = async (): Promise<ResumenClienteDemo> => {
    const existente = await prisma.cliente.findUniqueOrThrow({
      where: { email: demo.email },
      select: { nombre: true, apellidos: true },
    });
    const nombreReal = `${existente.nombre} ${existente.apellidos}`;
    return {
      email: demo.email,
      nombre: nombreReal,
      resultado: nombreReal === nombre ? 'ya existía' : 'ocupado',
      codigos: await codigosDe(demo.email),
    };
  };

  // 1) Si el email ya está, no se duplica ni se pisa
  if (await existeCliente(demo.email)) return yaExistia();

  // 2) El mismo camino que una confirmación real
  const itemIds = demo.items.map((nombreItem) => {
    const id = idPorNombre.get(nombreItem);
    if (!id) throw new Error(`El cliente de demo ${demo.email} usa "${nombreItem}", que no está en el catálogo`);
    return id;
  });

  const datos = confirmacionSchema.parse({
    nombre: demo.nombre,
    apellidos: demo.apellidos,
    email: demo.email,
    fechaEvento: fechaEnGuatemala(demo.diasHastaEvento),
    itemIds,
  });

  try {
    await confirmarAsistencia(datos);
  } catch (error) {
    // Otro proceso lo creó entre la comprobación y la inserción: tampoco se toca
    if (await existeCliente(demo.email)) return yaExistia();
    throw error;
  }

  // 3) Fecha de confirmación escalonada hacia atrás. Es solo presentación: sin esto
  //    los seis clientes aparecerían confirmados en el mismo segundo. No toca
  //    importes, porcentajes ni códigos, que ya calculó el servicio.
  const confirmadoEn = new Date(Date.now() - demo.diasDesdeConfirmacion * MS_POR_DIA);
  await prisma.$transaction([
    prisma.cliente.update({ where: { email: demo.email }, data: { confirmadoEn } }),
    prisma.codigoDescuento.updateMany({ where: { cliente: { email: demo.email } }, data: { creadoEn: confirmadoEn } }),
  ]);

  // 4) Canje con el servicio real. Solo códigos que este cliente sí obtuvo.
  for (const tipo of demo.canjear ?? []) {
    const codigo = await prisma.codigoDescuento.findFirst({
      where: { cliente: { email: demo.email }, tipo },
      select: { codigo: true },
    });
    if (!codigo) throw new Error(`${demo.email} no obtuvo código de ${tipo}: no hay nada que canjear`);
    await canjearCodigo(codigo.codigo);
  }

  return { email: demo.email, nombre, resultado: 'creado', codigos: await codigosDe(demo.email) };
}
