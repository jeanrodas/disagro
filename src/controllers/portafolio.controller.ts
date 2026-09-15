import type { RequestHandler } from 'express';
import { COOKIE_SESION, opcionesCookieSesion } from '../lib/sesion';
import { enlaceSesionSchema } from '../schemas/sesion.schema';
import * as portafolioService from '../services/portafolio.service';
import * as sesionService from '../services/sesion.service';
import { HttpError } from '../utils/http-error';
import { validar } from '../utils/validacion';

/** GET /api/portafolio — requiere la cookie de sesión (middleware requiereSesionCliente). */
export const obtenerPortafolio: RequestHandler = async (_req, res) => {
  const { clienteId } = res.locals;
  if (!clienteId) throw HttpError.unauthorized();

  res.json(await portafolioService.obtenerPortafolio(clienteId));
};

/**
 * POST /api/sesion — canjea el token del enlace del correo por la cookie de sesión.
 * Permite abrir el portafolio desde otro dispositivo sin exponer el token en
 * los logs de la API (llega en el body, no en la URL).
 */
export const iniciarSesionConEnlace: RequestHandler = async (req, res) => {
  const { token } = validar(enlaceSesionSchema, req.body, 'Enlace de sesión inválido');

  const clienteId = await sesionService.buscarClienteIdPorToken(token);
  if (!clienteId) throw HttpError.unauthorized('El enlace no es válido');

  res.cookie(COOKIE_SESION, token, opcionesCookieSesion);
  res.status(204).end();
};
