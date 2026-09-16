import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, interpretarTrustProxy } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { healthRouter } from './routes/health.routes';
import { apiRouter } from './routes';

/**
 * Construye la app de Express sin levantar el servidor.
 * Separarlo de server.ts permite probar la app (tests) sin abrir un puerto.
 */
export function createApp() {
  const app = express();

  // Cuántos proxies hay delante (TRUST_PROXY). De esto depende qué IP ve el rate
  // limiting: con un valor incorrecto, o todos los clientes comparten contador o
  // cualquiera puede falsificar el suyo. En local: false; en producción: 1.
  app.set('trust proxy', interpretarTrustProxy());

  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true, // necesario para enviar cookies httpOnly desde el frontend
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser()); // expone req.cookies para leer la cookie de sesión del cliente

  app.use('/health', healthRouter);
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
