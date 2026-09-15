import { z } from 'zod';

/** Un parámetro vacío (?tipo=) se trata como si no se hubiera enviado. */
export const vacioComoAusente = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

/** Texto opcional de query string: un solo valor, sin espacios sobrantes y con largo máximo. */
export const textoOpcional = (campo: string, maximo: number) =>
  z.preprocess(
    vacioComoAusente,
    z
      .string({ error: `${campo} debe enviarse una sola vez como texto` })
      .trim()
      .max(maximo, `${campo} no puede tener más de ${maximo} caracteres`)
      .optional(),
  );

/** Entero de query string (?page=2) con valor por defecto y rango permitido. */
export const enteroQuery = (campo: string, { defecto, minimo = 1, maximo }: { defecto: number; minimo?: number; maximo: number }) =>
  z.preprocess(
    vacioComoAusente,
    z.coerce
      .number({ error: `${campo} debe ser un número entero` })
      .int(`${campo} debe ser un número entero`)
      .min(minimo, `${campo} debe ser mayor o igual a ${minimo}`)
      .max(maximo, `${campo} no puede ser mayor a ${maximo}`)
      .default(defecto),
  );
