import type { Portafolio } from '../../types/api'
import { apiFetch, apiPost } from './http'

/**
 * GET /api/portafolio — portafolio del cliente de la sesión.
 * Usa la cookie httpOnly; sin sesión válida lanza ApiError 401 (ver esNoAutenticado).
 */
export function obtenerPortafolio(): Promise<Portafolio> {
  return apiFetch<Portafolio>('/api/portafolio')
}

/**
 * POST /api/sesion — canjea el token del enlace del correo por la cookie de sesión.
 * Responde 204 sin cuerpo; 401 si el token no corresponde a ningún cliente.
 */
export async function canjearSesion(token: string): Promise<void> {
  await apiPost<null>('/api/sesion', { token })
}

/**
 * Lee el token del enlace del correo, que llega en el fragmento (#token=...).
 * El fragmento nunca se envía al servidor, así que el token no aparece en los logs
 * de acceso ni en el header Referer: se lee aquí y se manda en el body de /api/sesion.
 *
 * @example
 * const token = leerTokenDelEnlace()
 * if (token) { await canjearSesion(token); limpiarTokenDeLaUrl() }
 */
export function leerTokenDelEnlace(hash: string = window.location.hash): string | null {
  const parametros = new URLSearchParams(hash.replace(/^#/, ''))
  return parametros.get('token')
}

/** Quita el token de la barra de direcciones para que no quede en el historial. */
export function limpiarTokenDeLaUrl(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
