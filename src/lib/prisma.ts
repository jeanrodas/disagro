import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Cliente Prisma único para toda la app.
 *
 * Node cachea los módulos: cualquier archivo que importe `prisma` recibe esta
 * misma instancia y, por lo tanto, el mismo pool de conexiones. No hace falta
 * el truco de `globalThis` (ese es para el hot reload de Next.js); `tsx watch`
 * reinicia el proceso completo y el pool anterior muere con él.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  // Falla rápido si Postgres no responde, en lugar de colgar la petición
  connectionTimeoutMillis: 5_000,
});

export const prisma = new PrismaClient({
  adapter,
  // Sin 'error': los errores de consulta se propagan y los registra quien los
  // atrapa (middleware de errores o /health); así no se loguean dos veces.
  log: ['warn'],
});
