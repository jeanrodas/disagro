import { interpretarCanje, type CodigoCanjeado } from '../domain/canje';
import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';

/**
 * Canje de códigos de descuento: un código solo se puede usar UNA vez.
 */

const seleccionCodigo = {
  codigo: true,
  tipo: true,
  porcentaje: true,
  estado: true,
  canjeadoEn: true,
} satisfies Prisma.CodigoDescuentoSelect;

export async function canjearCodigo(codigo: string): Promise<CodigoCanjeado> {
  // ─── PASO ATÓMICO ────────────────────────────────────────────────────────────
  // Una sola sentencia:
  //   UPDATE codigos_descuento SET estado = 'CANJEADO', canjeado_en = $2
  //   WHERE codigo = $1 AND estado = 'EMITIDO' RETURNING ...
  // La condición y la escritura ocurren juntas. Si dos peticiones llegan a la vez,
  // Postgres bloquea la fila: la segunda espera, vuelve a evaluar el WHERE con el
  // estado ya CANJEADO y no modifica nada. No existe una ventana entre "comprobar"
  // y "escribir" donde otra petición pueda colarse.
  const [actualizado] = await prisma.codigoDescuento.updateManyAndReturn({
    where: { codigo, estado: 'EMITIDO' },
    data: { estado: 'CANJEADO', canjeadoEn: new Date() },
    select: seleccionCodigo,
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // Solo si no se modificó nada se lee el código, para elegir entre 404 y 409.
  // Esta lectura ya no decide si se canjea, así que no abre ninguna carrera.
  const actual = actualizado
    ? null
    : await prisma.codigoDescuento.findUnique({ where: { codigo }, select: seleccionCodigo });

  const resultado = interpretarCanje(actualizado, actual);

  switch (resultado.tipo) {
    case 'canjeado':
      return resultado.codigo;
    case 'inexistente':
      throw HttpError.notFound('Código no válido');
    case 'ya_canjeado':
      throw HttpError.conflict('Este código ya fue utilizado', {
        codigo: resultado.codigo,
        canjeadoEn: resultado.canjeadoEn,
      });
  }
}
