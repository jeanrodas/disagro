import { firmarTokenAdmin, type SesionAdmin } from '../lib/jwt-admin';
import { obtenerHashFicticio, verificarPassword } from '../lib/password';
import { prisma } from '../lib/prisma';
import { esUuid } from '../utils/uuid';

// Se calcula al cargar el módulo para que el primer login con un usuario inexistente
// no tarde el doble (hash + comparación) y delate que el usuario no existe.
void obtenerHashFicticio();

/**
 * Verifica usuario y contraseña. Devuelve null si algo no coincide, sin distinguir
 * si falló el usuario o la contraseña.
 */
export async function autenticarAdmin(
  usuario: string,
  password: string,
): Promise<{ admin: SesionAdmin; token: string } | null> {
  const admin = await prisma.admin.findUnique({
    where: { usuario },
    select: { id: true, usuario: true, passwordHash: true },
  });

  // bcrypt se ejecuta SIEMPRE, exista o no el usuario: ambos casos tardan lo mismo
  const passwordValida = await verificarPassword(password, admin?.passwordHash ?? (await obtenerHashFicticio()));
  if (!admin || !passwordValida) return null;

  const sesion: SesionAdmin = { id: admin.id, usuario: admin.usuario };
  return { admin: sesion, token: firmarTokenAdmin(sesion) };
}

/** Confirma que el admin del token sigue existiendo: si se elimina, su token deja de servir. */
export async function buscarAdminPorId(id: string): Promise<SesionAdmin | null> {
  if (!esUuid(id)) return null;
  return prisma.admin.findUnique({ where: { id }, select: { id: true, usuario: true } });
}
