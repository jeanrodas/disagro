/**
 * Cliente de la API del backend.
 *
 * En desarrollo VITE_API_URL va vacía: el navegador pide /api/... al mismo origen
 * y el proxy de Vite lo reenvía al backend (ver vite.config.ts). En producción se
 * define con el dominio público del backend.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/**
 * Error con el código HTTP y el detalle por campo que devuelve el backend.
 * Los campos se declaran aparte y no como propiedades del constructor, porque el
 * tsconfig de la plantilla activa erasableSyntaxOnly (solo sintaxis que se borra
 * al compilar, para que Node pueda ejecutar TypeScript sin transformarlo).
 */
export class ApiError extends Error {
  readonly status: number
  readonly detalles: unknown

  constructor(status: number, message: string, detalles?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detalles = detalles
  }
}

interface RespuestaError {
  error?: { message?: string; details?: unknown }
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
    const error = (cuerpo as RespuestaError | null)?.error
    throw new ApiError(respuesta.status, error?.message ?? `Error ${respuesta.status}`, error?.details)
  }

  return cuerpo as T
}
