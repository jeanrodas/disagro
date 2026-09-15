/**
 * Error de dominio con código HTTP.
 * Los servicios lanzan HttpError y el middleware de errores lo traduce
 * a una respuesta JSON consistente, sin exponer detalles internos.
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message = 'Solicitud inválida', details?: unknown) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'No autorizado') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflicto', details?: unknown) {
    return new HttpError(409, message, details);
  }
}
