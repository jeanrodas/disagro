import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { healthRouter } from './routes/health.routes';

/**
 * Construye la app de Express sin levantar el servidor.
 * Separarlo de server.ts permite probar la app (tests) sin abrir un puerto.
 */
export function createApp() {
  const app = express();

  // Detrás de un proxy (Docker/nginx) para que req.ip y cookies "secure" funcionen
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true, // necesario para enviar cookies httpOnly desde el frontend
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
