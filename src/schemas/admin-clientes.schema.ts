import { z } from 'zod';
import { enteroQuery, textoOpcional } from './comunes.schema';

/** Query de GET /api/admin/clientes?page=&limit=&buscar= */
export const filtrosClientesSchema = z.object({
  page: enteroQuery('page', { defecto: 1, maximo: 100_000 }),
  limit: enteroQuery('limit', { defecto: 20, maximo: 100 }),
  /** Texto a buscar en nombre, apellidos o email. */
  buscar: textoOpcional('buscar', 100),
});

export type FiltrosClientes = z.output<typeof filtrosClientesSchema>;

/** Parámetro :id de GET /api/admin/clientes/:id */
export const clienteIdSchema = z.object({
  id: z.uuid('id debe ser un UUID válido'),
});
