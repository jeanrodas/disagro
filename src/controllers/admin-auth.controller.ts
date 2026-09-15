import type { RequestHandler } from 'express';
import { COOKIE_ADMIN, opcionesBorrarCookieAdmin, opcionesCookieAdmin } from '../lib/jwt-admin';
import { loginAdminSchema } from '../schemas/admin-auth.schema';
import * as adminAuthService from '../services/admin-auth.service';
import { HttpError } from '../utils/http-error';
import { validar } from '../utils/validacion';

/**
 * POST /api/admin/login
 * El JWT viaja solo en la cookie httpOnly; el body lleva datos mínimos.
 */
export const login: RequestHandler = async (req, res) => {
  const { usuario, password } = validar(loginAdminSchema, req.body, 'Datos de inicio de sesión inválidos');

  const resultado = await adminAuthService.autenticarAdmin(usuario, password);
  // Mismo mensaje si el usuario no existe o si la contraseña es incorrecta
  if (!resultado) throw HttpError.unauthorized('Usuario o contraseña incorrectos');

  res.cookie(COOKIE_ADMIN, resultado.token, opcionesCookieAdmin);
  res.json({ admin: { usuario: resultado.admin.usuario } });
};

/** POST /api/admin/logout — borra la cookie. No exige sesión válida: cerrar sesión siempre debe poder hacerse. */
export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(COOKIE_ADMIN, opcionesBorrarCookieAdmin);
  res.status(204).end();
};

/** GET /api/admin/me — el frontend lo usa para saber si hay sesión de admin. */
export const me: RequestHandler = (_req, res) => {
  const { admin } = res.locals;
  if (!admin) throw HttpError.unauthorized();
  res.json({ admin: { usuario: admin.usuario } });
};
