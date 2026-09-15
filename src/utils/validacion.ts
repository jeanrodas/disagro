import type { z } from 'zod';
import { HttpError } from './http-error';

/**
 * Valida `datos` contra un schema de zod.
 * Si falla, lanza un 400 con la lista de campos inválidos para que el
 * frontend pueda mostrar cada error junto a su campo.
 */
export function validar<T extends z.ZodType>(
  schema: T,
  datos: unknown,
  mensaje = 'Datos inválidos',
): z.output<T> {
  const resultado = schema.safeParse(datos);
  if (!resultado.success) {
    throw HttpError.badRequest(
      mensaje,
      resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      })),
    );
  }
  return resultado.data;
}
