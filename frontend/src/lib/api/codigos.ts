import type { DetalleCodigoYaUtilizado, FechaIso, RespuestaCanje } from '../../types/api'
import { ApiError, apiPost, esApiError } from './http'

/**
 * El backend responde 409 si el código ya fue canjeado. Se traduce a este error
 * para que la pantalla muestre cuándo se usó sin analizar el cuerpo a mano.
 */
export class CodigoYaUtilizadoError extends ApiError {
  readonly codigo: string | null
  readonly canjeadoEn: FechaIso | null

  constructor(error: ApiError) {
    super(error.status, error.message, error.detalles)
    this.name = 'CodigoYaUtilizadoError'
    const detalle = error.detalles as DetalleCodigoYaUtilizado | undefined
    this.codigo = typeof detalle?.codigo === 'string' ? detalle.codigo : null
    this.canjeadoEn = typeof detalle?.canjeadoEn === 'string' ? detalle.canjeadoEn : null
  }
}

/**
 * POST /api/codigos/canjear — marca el código como CANJEADO. Solo se puede una vez.
 *
 * @throws CodigoYaUtilizadoError si ya se había usado (409)
 * @throws ApiError 404 si el código no existe, 400 si el formato es inválido
 */
export async function canjearCodigo(codigo: string): Promise<RespuestaCanje> {
  try {
    return await apiPost<RespuestaCanje>('/api/codigos/canjear', { codigo })
  } catch (error) {
    if (esApiError(error) && error.status === 409) throw new CodigoYaUtilizadoError(error)
    throw error
  }
}
