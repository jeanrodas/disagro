import { prisma } from '../lib/prisma';
import { FORMATO_TOKEN_SESION, hashTokenSesion } from '../lib/sesion';

/** Devuelve el id del cliente dueño del token, o null si el token no es válido. */
export async function buscarClienteIdPorToken(token: string): Promise<string | null> {
  if (!FORMATO_TOKEN_SESION.test(token)) return null;

  const cliente = await prisma.cliente.findUnique({
    where: { sessionToken: hashTokenSesion(token) },
    select: { id: true },
  });
  return cliente?.id ?? null;
}
