import type { CuerpoError, DetalleValidacion } from '../../types/api'

/**
 * Base del cliente de la API.
 *
 * En desarrollo VITE_API_URL va vacía: el navegador pide /api/... a su mismo
 * origen y el proxy de Vite lo reenvía al backend (ver vite.config.ts). En
 * producción se define con el dominio público de la API.
 */
const BASE_URL = import.meta.env?.VITE_API_URL ?? ''

/** Error con el código HTTP y el cuerpo de error del backend. */
export class ApiError extends Error {
  readonly status: number
  /** `error.details` tal como llegó: lista de campos en los 400, objeto en los 409. */
  readonly detalles: unknown

  constructor(status: number, message: string, detalles?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detalles = detalles
  }
}

export const esApiError = (error: unknown): error is ApiError => error instanceof ApiError

/** 401: no hay sesión válida (cliente o admin). Sirve para redirigir al login o al formulario. */
export const esNoAutenticado = (error: unknown): boolean => esApiError(error) && error.status === 401

export const esNoEncontrado = (error: unknown): boolean => esApiError(error) && error.status === 404

export const esConflicto = (error: unknown): boolean => esApiError(error) && error.status === 409

/**
 * Campos inválidos de un 400 de validación, o null si el error no los trae.
 * Se filtra la forma para no confiar a ciegas en el cuerpo de la respuesta.
 */
export function detallesDeValidacion(error: unknown): DetalleValidacion[] | null {
  if (!esApiError(error) || !Array.isArray(error.detalles)) return null

  const detalles = error.detalles.filter(
    (detalle): detalle is DetalleValidacion =>
      typeof (detalle as DetalleValidacion)?.campo === 'string' &&
      typeof (detalle as DetalleValidacion)?.mensaje === 'string',
  )
  return detalles.length > 0 ? detalles : null
}

/** Mensaje del primer error de un campo concreto, para pintarlo junto al input. */
export function mensajeDeCampo(error: unknown, campo: string): string | null {
  return detallesDeValidacion(error)?.find((detalle) => detalle.campo === campo)?.mensaje ?? null
}

/** Arma el query string omitiendo los parámetros vacíos o sin valor. */
export function construirQuery(parametros: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === '') continue
    query.set(clave, String(valor))
  }
  const texto = query.toString()
  return texto ? `?${texto}` : ''
}

export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    // Necesario para que viajen las cookies httpOnly de sesión (cliente y admin)
    credentials: 'include',
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...opciones.headers },
  })

  const cuerpo = respuesta.status === 204 ? null : await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const error = (cuerpo as CuerpoError | null)?.error
    throw new ApiError(respuesta.status, error?.message ?? `Error ${respuesta.status}`, error?.details)
  }

  return cuerpo as T
}

/** POST con cuerpo JSON. */
export function apiPost<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  return apiFetch<T>(ruta, {
    method: 'POST',
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  })
}
