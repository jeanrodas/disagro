import { z } from 'zod';
import { TipoItem } from '../generated/prisma/client';

/** Un parámetro vacío (?tipo=) se trata como si no se hubiera enviado. */
const vacioComoAusente = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

/** Texto opcional de query string: un solo valor, sin espacios sobrantes y con largo máximo. */
const textoOpcional = (campo: string, maximo: number) =>
  z.preprocess(
    vacioComoAusente,
    z
      .string({ error: `${campo} debe enviarse una sola vez como texto` })
      .trim()
      .max(maximo, `${campo} no puede tener más de ${maximo} caracteres`)
      .optional(),
  );

export const filtrosItemsSchema = z.object({
  tipo: z.preprocess(
    vacioComoAusente,
    z
      .string({ error: 'tipo debe enviarse una sola vez como texto' })
      .transform((valor) => valor.trim().toUpperCase())
      .pipe(z.enum(TipoItem, { error: 'tipo debe ser SERVICIO o PRODUCTO' }))
      .optional(),
  ),
  /** Nombre (sin distinguir mayúsculas) o id de la categoría. */
  categoria: textoOpcional('categoria', 100),
  /** Texto a buscar en nombre o descripción. */
  buscar: textoOpcional('buscar', 100),
});

export type FiltrosItems = z.output<typeof filtrosItemsSchema>;
