import type { DatosConfirmacion, DetalleCorreoYaConfirmado, RespuestaConfirmacion } from '../../types/api'
import { ApiError, apiPost, esApiError } from './http'

/**
 * El backend responde 409 cuando el correo ya confirmó su asistencia. Se traduce
 * a este error para que la pantalla lo distinga con `instanceof`, sin tener que
 * mirar códigos HTTP ni hurgar en el cuerpo.
 *
 * El backend NO devuelve la sesión de ese cliente (sería entregarle sus códigos a
 * cualquiera que conozca su correo): portafolioUrl es la URL genérica, que funciona
 * si la persona ya tiene su cookie o abre el enlace de su correo.
 */
export class CorreoYaConfirmadoError extends ApiError {
  readonly portafolioUrl: string | null

  constructor(error: ApiError) {
    super(error.status, error.message, error.detalles)
    this.name = 'CorreoYaConfirmadoError'
    const detalle = error.detalles as DetalleCorreoYaConfirmado | undefined
    this.portafolioUrl = typeof detalle?.portafolioUrl === 'string' ? detalle.portafolioUrl : null
  }
}

/**
 * POST /api/confirmar — el endpoint principal.
 * Responde 201 con los códigos y el portafolio, y deja la cookie de sesión.
 *
 * @throws CorreoYaConfirmadoError si el correo ya confirmó (409)
 * @throws ApiError 400 con la lista de campos inválidos (ver detallesDeValidacion)
 *
 * @example
 * try {
 *   const { codigos, portafolio } = await confirmarAsistencia(datos)
 * } catch (error) {
 *   if (error instanceof CorreoYaConfirmadoError) mostrarEnlace(error.portafolioUrl)
 * }
 */
export async function confirmarAsistencia(datos: DatosConfirmacion): Promise<RespuestaConfirmacion> {
  try {
    return await apiPost<RespuestaConfirmacion>('/api/confirmar', datos)
  } catch (error) {
    if (esApiError(error) && error.status === 409) throw new CorreoYaConfirmadoError(error)
    throw error
  }
}
