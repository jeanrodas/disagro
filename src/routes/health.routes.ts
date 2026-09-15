import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const healthRouter = Router();

const DB_CHECK_TIMEOUT_MS = 3_000;

type DatabaseCheck = { status: 'up'; latencyMs: number } | { status: 'down' };

/** SELECT 1 contra Postgres con tiempo límite, para que /health nunca se cuelgue. */
async function checkDatabase(): Promise<DatabaseCheck> {
  const inicio = performance.now();
  let timer: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), DB_CHECK_TIMEOUT_MS);
      }),
    ]);
    return { status: 'up', latencyMs: Math.round(performance.now() - inicio) };
  } catch (err) {
    // El detalle se queda en el log del servidor; al cliente solo le decimos "down".
    // Prisma pone la causa real en `code` (ej. ECONNREFUSED) y un mensaje genérico.
    const { code, message } = err as { code?: string; message?: string };
    console.error(`[health] Base de datos no disponible: ${code ?? message ?? 'error desconocido'}`);
    return { status: 'down' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Estado del servicio y sus dependencias.
 * 200 si todo responde; 503 si la base de datos no está disponible, porque sin
 * ella ningún endpoint de negocio puede funcionar.
 */
healthRouter.get('/', async (_req, res) => {
  const database = await checkDatabase();
  const saludable = database.status === 'up';

  res.status(saludable ? 200 : 503).json({
    status: saludable ? 'ok' : 'error',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database },
  });
});
