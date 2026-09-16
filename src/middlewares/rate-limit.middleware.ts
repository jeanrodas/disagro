import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Límites de peticiones por IP para los endpoints sensibles.
 *
 * Por qué por IP y NO bloqueo de cuenta: el admin es uno solo. Si se bloqueara
 * la cuenta tras N intentos fallidos, cualquiera podría dejar fuera al
 * administrador real mandando contraseñas equivocadas. Limitar por IP frena la
 * fuerza bruta sin regalar esa vía de denegación de servicio.
 *
 * El contador vive en memoria del proceso: suficiente para una instancia. Con
 * varias réplicas detrás de un balanceador habría que usar un almacén
 * compartido (Redis), porque cada réplica contaría por su lado.
 *
 * La IP que se cuenta es la que resuelve Express según 'trust proxy'
 * (ver src/app.ts y la variable TRUST_PROXY).
 */

const comunes: Partial<Options> = {
  standardHeaders: 'draft-7', // cabeceras RateLimit-* estándar
  legacyHeaders: false,
  // Los tests unitarios no levantan servidor, pero si se agregan pruebas de
  // integración, el límite no debe hacerlas fallar. Activo en desarrollo y producción.
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: { message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
  },
};

/**
 * Login del admin: el más estricto. 8 intentos fallidos por IP cada 15 minutos
 * dejan margen a quien se equivoca de contraseña, pero hacen inviable probar
 * miles de combinaciones. Los ingresos correctos no gastan cupo, así que el
 * admin que entra bien nunca se queda fuera por su propio uso.
 */
export const limitadorLogin = rateLimit({
  ...comunes,
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skipSuccessfulRequests: true,
});

/**
 * Confirmación de asistencia: una persona confirma una vez. 20 por IP cada hora
 * no estorba a un uso normal (ni a varias personas que compartan la salida a
 * internet de una oficina o del wifi de la feria) y corta la creación masiva de
 * confirmaciones con correos inventados.
 */
export const limitadorConfirmacion = rateLimit({
  ...comunes,
  windowMs: 60 * 60 * 1000,
  limit: 20,
});

/**
 * Canje de códigos: 30 por IP cada 10 minutos. Adivinar un código al azar ya es
 * muy improbable (31^6 ≈ 887 millones de combinaciones); el límite evita que
 * alguien lo intente en masa. Es el valor más discutible: si en la feria un solo
 * punto de venta canjeara muchos códigos desde la misma IP, habría que subirlo o
 * exceptuar esa IP (ver la sección de seguridad del README).
 */
export const limitadorCanje = rateLimit({
  ...comunes,
  windowMs: 10 * 60 * 1000,
  limit: 30,
});
