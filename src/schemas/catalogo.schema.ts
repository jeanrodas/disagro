import { z } from 'zod';
import { TipoItem } from '../generated/prisma/client';
import { textoOpcional, vacioComoAusente } from './comunes.schema';

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
