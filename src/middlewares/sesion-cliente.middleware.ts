import type { RequestHandler } from 'express';
import { COOKIE_SESION } from '../lib/sesion';
import { buscarClienteIdPorToken } from '../services/sesion.service';
import { HttpError } from '../utils/http-error';

/**
 * Exige la cookie de sesión del cliente invitado.
 * Sin cookie o con un token que no corresponde a ningún cliente => 401.
 */
export const requiereSesionCliente: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[COOKIE_SESION];
  const clienteId = typeof token === 'string' ? await buscarClienteIdPorToken(token) : null;

  if (!clienteId) {
    throw HttpError.unauthorized('No hay una sesión válida. Confirma tu asistencia o abre el enlace de tu correo.');
  }

  res.locals.clienteId = clienteId;
  next();
};
