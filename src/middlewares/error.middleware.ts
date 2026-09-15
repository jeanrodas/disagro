import type { ErrorRequestHandler, RequestHandler } from 'express';
import { isProduction } from '../config/env';
import { HttpError } from '../utils/http-error';

/** 404 para cualquier ruta no registrada. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
  });
};

/**
 * Manejador central de errores.
 * - HttpError: se responde con su código y mensaje.
 * - JSON malformado en el body: 400.
 * - Cualquier otro error: se registra en el servidor y el cliente recibe
 *   un 500 genérico (nunca el stack trace).
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  // Error de express.json() cuando el body no es JSON válido
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'El cuerpo de la petición no es JSON válido' } });
    return;
  }

  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: { message: 'El cuerpo de la petición es demasiado grande' } });
    return;
  }

  console.error(`[error] ${req.method} ${req.originalUrl}`, isProduction ? err?.message : err);
  res.status(500).json({ error: { message: 'Error interno del servidor' } });
};
