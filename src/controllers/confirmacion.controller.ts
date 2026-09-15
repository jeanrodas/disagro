import type { RequestHandler } from 'express';
import { COOKIE_SESION, opcionesCookieSesion } from '../lib/sesion';
import { confirmacionSchema } from '../schemas/confirmacion.schema';
import * as confirmacionService from '../services/confirmacion.service';
import * as correoService from '../services/correo.service';
import { validar } from '../utils/validacion';

/**
 * POST /api/confirmar
 * Valida el body, confirma la asistencia (transacción en el servicio), deja la
 * cookie de sesión y responde con los códigos destacados y el portafolio.
 * Después de responder envía el correo de respaldo.
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

  // Correo de RESPALDO, después de responder: el cliente ya tiene sus códigos en pantalla.
  // enviarCorreoConfirmacion nunca lanza; un fallo de Resend solo queda en el log.
  void correoService.enviarCorreoConfirmacion(portafolio.cliente.email, {
    nombre: portafolio.cliente.nombre,
    fechaEvento: portafolio.cliente.fechaEvento,
    codigos: portafolio.codigos,
    enlacePortafolio: correoService.construirEnlacePortafolio(tokenSesion),
  });
};
