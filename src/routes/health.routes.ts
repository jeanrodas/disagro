import { Router } from 'express';

export const healthRouter = Router();

/**
 * Liveness check: indica que el proceso está vivo y respondiendo.
 * Lo usará el healthcheck de Docker. En la fase de Prisma se agregará
 * la verificación de conexión a la base de datos.
 */
healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
