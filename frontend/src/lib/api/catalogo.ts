import type { FiltrosItems, RespuestaCategorias, RespuestaItems } from '../../types/api'
import { apiFetch, construirQuery } from './http'

/** Catálogo público: no necesita sesión. */

/**
 * GET /api/items?tipo=&categoria=&buscar=
 * Sin filtros devuelve el catálogo completo. Un tipo inválido responde 400.
 *
 * @example
 * const { total, items } = await obtenerItems({ tipo: 'SERVICIO', buscar: 'suelos' })
 */
export function obtenerItems(filtros: FiltrosItems = {}): Promise<RespuestaItems> {
  return apiFetch<RespuestaItems>(`/api/items${construirQuery({ ...filtros })}`)
}

/** GET /api/categorias — incluye cuántos items tiene cada categoría. */
export function obtenerCategorias(): Promise<RespuestaCategorias> {
  return apiFetch<RespuestaCategorias>('/api/categorias')
}
