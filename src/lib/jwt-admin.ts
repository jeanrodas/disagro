import type { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env';

/**
 * Sesión del administrador: JWT firmado con HS256 y guardado en una cookie httpOnly.
 * Es un mecanismo distinto al del cliente invitado: otra cookie, otro formato de
 * token (firmado y con expiración) y otro middleware.
 */

export const COOKIE_ADMIN = 'disagro_admin';

const DURACION_SEGUNDOS = 8 * 60 * 60; // 8 horas: una jornada de trabajo
const ALGORITMO = 'HS256';
const EMISOR = 'disagro-feria-api';
const AUDIENCIA = 'disagro-admin';

export interface SesionAdmin {
  id: string;
  usuario: string;
}

export function firmarTokenAdmin({ id, usuario }: SesionAdmin): string {
  return jwt.sign({ usuario }, env.JWT_SECRET, {
    algorithm: ALGORITMO,
    expiresIn: DURACION_SEGUNDOS,
    issuer: EMISOR,
    audience: AUDIENCIA,
    subject: id,
  });
}

/**
 * Verifica firma, algoritmo, emisor, audiencia y expiración.
 * Fijar `algorithms` impide aceptar tokens con "alg": "none" o con otro algoritmo.
 * Devuelve null ante cualquier problema; el motivo no se expone al cliente.
 */
export function verificarTokenAdmin(token: string): SesionAdmin | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [ALGORITMO],
      issuer: EMISOR,
      audience: AUDIENCIA,
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.usuario !== 'string') {
      return null;
    }
    return { id: payload.sub, usuario: payload.usuario };
  } catch {
    return null;
  }
}

const atributosCookieAdmin: CookieOptions = {
  httpOnly: true, // JavaScript del navegador no puede leer el JWT
  secure: isProduction, // solo por HTTPS en producción
  sameSite: 'lax', // no viaja en POST desde otros sitios (mitiga CSRF)
  path: '/api/admin', // el navegador solo la envía a las rutas del panel
};

export const opcionesCookieAdmin: CookieOptions = { ...atributosCookieAdmin, maxAge: DURACION_SEGUNDOS * 1000 };

/** Para borrar una cookie hay que repetir su path y atributos (sin maxAge). */
export const opcionesBorrarCookieAdmin: CookieOptions = atributosCookieAdmin;
