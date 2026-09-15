import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[server] Escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/**
 * Apagado ordenado: `docker stop` envía SIGTERM. Dejamos de aceptar conexiones
 * y terminamos las peticiones en curso antes de salir.
 */
function shutdown(signal: string) {
  console.log(`[server] ${signal} recibido, cerrando...`);
  server.close(() => process.exit(0));
  // Si algo queda colgado, forzar la salida
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
