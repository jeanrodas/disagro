import type { RequestHandler } from 'express';
import { COOKIE_SESION, opcionesCookieSesion } from '../lib/sesion';
import { confirmacionSchema } from '../schemas/confirmacion.schema';
import * as confirmacionService from '../services/confirmacion.service';
import { validar } from '../utils/validacion';

/**
 * POST /api/confirmar
 * Valida el body, confirma la asistencia (transacción en el servicio), deja la
 * cookie de sesión y responde con los códigos destacados y el portafolio.
 */
export const confirmar: RequestHandler = async (req, res) => {
  const datos = validar(confirmacionSchema, req.body, 'Datos de confirmación inválidos');

  const { tokenSesion, portafolio, portafolioUrl } = await confirmacionService.confirmarAsistencia(datos);

  res.cookie(COOKIE_SESION, tokenSesion, opcionesCookieSesion);
  res.status(201).json({
    mensaje: '¡Asistencia confirmada! Guarda tus códigos de descuento.',
    // Los códigos van al inicio de la respuesta para que el frontend los muestre de inmediato
    codigos: portafolio.codigos.map(({ codigo, tipo, porcentaje }) => ({ codigo, tipo, porcentaje })),
    portafolioUrl,
    portafolio,
  });
};
