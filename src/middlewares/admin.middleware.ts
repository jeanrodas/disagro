import type { RequestHandler } from 'express';
import { COOKIE_ADMIN, verificarTokenAdmin } from '../lib/jwt-admin';
import { buscarAdminPorId } from '../services/admin-auth.service';
import { HttpError } from '../utils/http-error';

/**
 * Protege las rutas del panel de administración.
 *
 *   1. Lee el JWT de la cookie httpOnly `disagro_admin` (nunca de la del cliente).
 *   2. Verifica firma, algoritmo (solo HS256), emisor, audiencia y expiración.
 *   3. Confirma que el admin siga existiendo en la BD.
 *
 * Si algo falla responde 401 con un único mensaje, sin decir qué falló.
 * Es independiente de requiereSesionCliente: el token de un cliente (aleatorio y
 * sin firma) nunca pasa la verificación de un JWT.
 */
export const requiereAdmin: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[COOKIE_ADMIN];
  const sesion = typeof token === 'string' ? verificarTokenAdmin(token) : null;
  const admin = sesion ? await buscarAdminPorId(sesion.id) : null;

  if (!admin) {
    throw HttpError.unauthorized('Sesión de administrador no válida o expirada');
  }

  res.locals.admin = admin;
  next();
};
