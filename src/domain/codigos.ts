import { randomBytes } from 'node:crypto';
import type { TipoItem } from './descuentos';

/**
 * Códigos de descuento con formato DISAGRO-SERV-XXXXXX / DISAGRO-PROD-XXXXXX.
 *
 * - Aleatoriedad criptográfica (crypto.randomBytes): la salida de Math.random
 *   se puede predecir y alguien podría adivinar códigos válidos.
 * - Alfabeto sin caracteres ambiguos (0/O, 1/I/L) para leerlo o dictarlo desde un correo.
 * - Muestreo por rechazo para que todos los caracteres sean igual de probables.
 * - La unicidad NO se garantiza aquí sino en la BD (codigo @unique): quien
 *   inserta reintenta con un código nuevo si hay colisión.
 */

/** 23 letras (sin I, L, O) + 8 dígitos (sin 0, 1) = 31 caracteres. */
export const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LONGITUD_SUFIJO = 6;

export const PREFIJO_CODIGO = {
  SERVICIO: 'DISAGRO-SERV',
  PRODUCTO: 'DISAGRO-PROD',
} as const satisfies Record<TipoItem, string>;

export const FORMATO_CODIGO = new RegExp(`^DISAGRO-(SERV|PROD)-[${ALFABETO_CODIGO}]{${LONGITUD_SUFIJO}}$`);

/** Fuente de bytes aleatorios. Se inyecta en los tests para obtener resultados deterministas. */
export type FuenteAleatoria = (cantidad: number) => Uint8Array;

/**
 * 248 = mayor múltiplo de 31 que cabe en un byte. Los bytes >= 248 se descartan:
 * con `byte % 31` sin descartar, los primeros 8 caracteres del alfabeto
 * saldrían más seguido que el resto (sesgo de módulo).
 */
const LIMITE_SIN_SESGO = 256 - (256 % ALFABETO_CODIGO.length);

export function generarSufijo(longitud = LONGITUD_SUFIJO, fuente: FuenteAleatoria = randomBytes): string {
  let sufijo = '';
  while (sufijo.length < longitud) {
    for (const byte of fuente(longitud * 2)) {
      if (byte >= LIMITE_SIN_SESGO) continue;
      sufijo += ALFABETO_CODIGO.charAt(byte % ALFABETO_CODIGO.length);
      if (sufijo.length === longitud) break;
    }
  }
  return sufijo;
}

export function generarCodigoDescuento(tipo: TipoItem, fuente?: FuenteAleatoria): string {
  return `${PREFIJO_CODIGO[tipo]}-${generarSufijo(LONGITUD_SUFIJO, fuente)}`;
}
