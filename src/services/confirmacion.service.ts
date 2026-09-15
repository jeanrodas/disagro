import { env } from '../config/env';
import { generarCodigoDescuento } from '../domain/codigos';
import { calcularDescuentos, type PorcentajeDescuento, type TipoItem } from '../domain/descuentos';
import { prisma } from '../lib/prisma';
import { generarTokenSesion, hashTokenSesion } from '../lib/sesion';
import type { DatosConfirmacion } from '../schemas/confirmacion.schema';
import { HttpError } from '../utils/http-error';
import { restriccionUnicaViolada } from '../utils/prisma-errores';
import { obtenerPortafolio, type PortafolioDto } from './portafolio.service';

/**
 * Confirmación de asistencia: el flujo principal de la feria.
 *
 *   1. Verifica que los items existan y toma sus precios REALES de la BD.
 *   2. Rechaza con 409 si el correo ya confirmó.
 *   3. Calcula los descuentos con la función de dominio (Fase 3).
 *   4. En UNA transacción crea el cliente, sus selecciones y sus códigos.
 *      Si un código o el token colisionan con uno existente, reintenta con
 *      valores nuevos; cualquier otro error hace rollback completo.
 *   5. Devuelve el token de sesión (para la cookie) y el portafolio.
 */

export const MAX_INTENTOS_CONFIRMACION = 5;

/** Generadores inyectables: en producción son aleatorios; en pruebas se fuerzan colisiones. */
export interface DependenciasConfirmacion {
  generarCodigo: (tipo: TipoItem) => string;
  generarToken: () => string;
}

const DEPENDENCIAS_POR_DEFECTO: DependenciasConfirmacion = {
  generarCodigo: (tipo) => generarCodigoDescuento(tipo),
  generarToken: generarTokenSesion,
};

const RESTRICCIONES_EMAIL = new Set(['clientes_email_key', 'email']);
const RESTRICCIONES_REINTENTABLES = new Set([
  'codigos_descuento_codigo_key',
  'codigo',
  'clientes_session_token_key',
  'session_token',
]);

export interface ResultadoConfirmacion {
  /** Token en claro: solo viaja en la cookie httpOnly y en el enlace del correo. */
  tokenSesion: string;
  portafolioUrl: string;
  portafolio: PortafolioDto;
}

interface DescuentoObtenido {
  tipo: TipoItem;
  porcentaje: PorcentajeDescuento;
}

/** URL del portafolio en el frontend. No lleva token: funciona con la cookie de sesión. */
export const urlPortafolio = () => new URL('/portafolio', env.APP_URL).toString();

/**
 * El 409 NO devuelve el token ni un enlace con sesión: si lo hiciera, cualquiera
 * que conozca el correo de otra persona podría entrar a su portafolio y usar sus códigos.
 */
const errorCorreoYaConfirmado = () =>
  HttpError.conflict(
    'Este correo ya confirmó su asistencia. Abre tu portafolio desde el dispositivo donde confirmaste o con el enlace del correo de confirmación.',
    { portafolioUrl: urlPortafolio() },
  );

export async function confirmarAsistencia(
  datos: DatosConfirmacion,
  dependencias: DependenciasConfirmacion = DEPENDENCIAS_POR_DEFECTO,
): Promise<ResultadoConfirmacion> {
  // 1) Precios reales desde la BD: nunca se confía en montos enviados por el cliente
  const items = await prisma.item.findMany({
    where: { id: { in: datos.itemIds } },
    select: { id: true, tipo: true, precio: true },
  });

  const idsEncontrados = new Set(items.map((item) => item.id));
  const inexistentes = datos.itemIds.filter((id) => !idsEncontrados.has(id));
  if (inexistentes.length > 0) {
    throw HttpError.badRequest(
      'Algunos items seleccionados no existen en el catálogo',
      inexistentes.map((id) => ({ campo: 'itemIds', mensaje: `No existe un item con id ${id}` })),
    );
  }

  // 2) Un correo confirma una sola vez. Esta consulta da un error claro en el caso
  //    normal; la restricción única de la BD cubre dos peticiones simultáneas.
  const clienteExistente = await prisma.cliente.findUnique({ where: { email: datos.email }, select: { id: true } });
  if (clienteExistente) throw errorCorreoYaConfirmado();

  // 3) Descuentos con la función de dominio; solo hay código para porcentajes > 0
  const descuentos = calcularDescuentos(items.map((item) => ({ tipo: item.tipo, precio: item.precio.toString() })));
  const obtenidos: DescuentoObtenido[] = [
    { tipo: 'SERVICIO' as const, porcentaje: descuentos.servicios.porcentaje },
    { tipo: 'PRODUCTO' as const, porcentaje: descuentos.productos.porcentaje },
  ].filter((descuento) => descuento.porcentaje > 0);

  // 4) Transacción todo o nada
  const { clienteId, tokenSesion } = await crearClienteConReintentos(datos, obtenidos, dependencias);

  // 5) Portafolio recién creado
  return { tokenSesion, portafolioUrl: urlPortafolio(), portafolio: await obtenerPortafolio(clienteId) };
}

async function crearClienteConReintentos(
  datos: DatosConfirmacion,
  descuentos: DescuentoObtenido[],
  dependencias: DependenciasConfirmacion,
): Promise<{ clienteId: string; tokenSesion: string }> {
  for (let intento = 1; ; intento++) {
    // Valores nuevos en cada intento
    const tokenSesion = dependencias.generarToken();

    try {
      const clienteId = await prisma.$transaction(async (tx) => {
        const cliente = await tx.cliente.create({
          data: {
            nombre: datos.nombre,
            apellidos: datos.apellidos,
            email: datos.email,
            fechaEvento: datos.fechaEvento,
            sessionToken: hashTokenSesion(tokenSesion),
          },
          select: { id: true },
        });

        await tx.seleccionItem.createMany({
          data: datos.itemIds.map((itemId) => ({ clienteId: cliente.id, itemId })),
        });

        if (descuentos.length > 0) {
          await tx.codigoDescuento.createMany({
            data: descuentos.map(({ tipo, porcentaje }) => ({
              clienteId: cliente.id,
              tipo,
              porcentaje,
              codigo: dependencias.generarCodigo(tipo), // estado EMITIDO por defecto
            })),
          });
        }

        return cliente.id;
      });

      return { clienteId, tokenSesion };
    } catch (err) {
      const restriccion = restriccionUnicaViolada(err);

      if (restriccion && RESTRICCIONES_EMAIL.has(restriccion)) throw errorCorreoYaConfirmado();

      if (restriccion && RESTRICCIONES_REINTENTABLES.has(restriccion) && intento < MAX_INTENTOS_CONFIRMACION) {
        console.warn(`[confirmar] Colisión en ${restriccion}; reintento ${intento + 1} de ${MAX_INTENTOS_CONFIRMACION}`);
        continue;
      }

      throw err;
    }
  }
}
