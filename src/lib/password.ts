import { randomBytes } from 'node:crypto';
import { compare, hash } from 'bcryptjs';

/**
 * Contraseñas de administradores con bcrypt.
 * Se usa bcryptjs (JavaScript puro): mismo algoritmo y formato $2b$ que bcrypt
 * nativo, sin compilar módulos nativos al construir la imagen de Docker.
 */

/** Costo 12 = 2^12 rondas: lento a propósito para frenar la fuerza bruta si se filtra un hash. */
export const COSTO_BCRYPT = 12;

/** bcrypt solo usa los primeros 72 bytes: con más, dos contraseñas distintas darían el mismo hash. */
export const MAX_BYTES_PASSWORD = 72;

export const hashearPassword = (password: string) => hash(password, COSTO_BCRYPT);

export const verificarPassword = (password: string, passwordHash: string) => compare(password, passwordHash);

let hashFicticio: Promise<string> | undefined;

/**
 * Hash de una contraseña aleatoria que nadie conoce. Cuando el usuario no existe
 * se compara contra este hash para que la respuesta tarde lo mismo que con un
 * usuario real: así el tiempo no revela qué usuarios existen.
 */
export function obtenerHashFicticio(): Promise<string> {
  hashFicticio ??= hashearPassword(randomBytes(32).toString('hex'));
  return hashFicticio;
}
