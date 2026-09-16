import type {
  FiltrosClientes,
  Metricas,
  Portafolio,
  RespuestaAdmin,
  RespuestaClientes,
} from '../../types/api'
import { apiFetch, apiPost, construirQuery } from './http'

/**
 * Panel de administración. Todo menos el login exige la cookie `disagro_admin`
 * (JWT httpOnly): sin ella el backend responde 401 (ver esNoAutenticado).
 */

/**
 * POST /api/admin/login — deja el JWT en la cookie y devuelve solo el usuario.
 * El token nunca viaja en el cuerpo.
 *
 * @throws ApiError 401 "Usuario o contraseña incorrectos" (mismo mensaje exista o
 *         no el usuario: el backend no revela cuál de los dos falló)
 */
export function loginAdmin(usuario: string, password: string): Promise<RespuestaAdmin> {
  return apiPost<RespuestaAdmin>('/api/admin/login', { usuario, password })
}

/** POST /api/admin/logout — borra la cookie. Responde 204 y no exige sesión válida. */
export async function logoutAdmin(): Promise<void> {
  await apiPost<null>('/api/admin/logout')
}

/** GET /api/admin/me — sirve para saber si hay sesión de admin al cargar el panel. */
export function obtenerAdminActual(): Promise<RespuestaAdmin> {
  return apiFetch<RespuestaAdmin>('/api/admin/me')
}

/**
 * GET /api/admin/clientes?page=&limit=&buscar=
 * Ordenados por fecha de confirmación, del más reciente al más antiguo.
 * limit acepta hasta 100; por encima el backend responde 400.
 */
export function listarClientes(filtros: FiltrosClientes = {}): Promise<RespuestaClientes> {
  return apiFetch<RespuestaClientes>(`/api/admin/clientes${construirQuery({ ...filtros })}`)
}

/**
 * GET /api/admin/clientes/:id — mismo detalle que ve el cliente en su portafolio.
 *
 * @throws ApiError 404 si no existe, 400 si el id no es un UUID
 */
export function obtenerCliente(id: string): Promise<Portafolio> {
  return apiFetch<Portafolio>(`/api/admin/clientes/${encodeURIComponent(id)}`)
}

/** GET /api/admin/metricas — totales, ingreso potencial, top de items y estado de los códigos. */
export function obtenerMetricas(): Promise<Metricas> {
  return apiFetch<Metricas>('/api/admin/metricas')
}
