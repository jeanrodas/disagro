import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import { isProduction } from '../config/env';

/**
 * Sesión sin fricción del cliente invitado: no hay login, la sesión es un
 * token aleatorio que vive en una cookie httpOnly y en el enlace del correo.
 */

export const COOKIE_SESION = 'disagro_sesion';

const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

/** 32 bytes (256 bits) en base64url: imposible de adivinar y seguro en URLs y cookies. */
export function generarTokenSesion(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * En la BD se guarda solo el SHA-256 del token. Si la BD se filtra, los hashes
 * no sirven para entrar como el cliente. No hace falta sal: el token ya tiene
 * 256 bits aleatorios, no es una contraseña elegida por una persona.
 */
export function hashTokenSesion(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 32 bytes en base64url = 43 caracteres. Filtra basura antes de consultar la BD. */
export const FORMATO_TOKEN_SESION = /^[A-Za-z0-9_-]{43}$/;

export const opcionesCookieSesion: CookieOptions = {
  httpOnly: true, // JavaScript del navegador no puede leerla (protege ante XSS)
  secure: isProduction, // solo por HTTPS en producción
  sameSite: 'lax', // no se envía en peticiones POST de otros sitios (mitiga CSRF)
  path: '/',
  maxAge: DURACION_SESION_MS,
};
