import 'dotenv/config';
import { z } from 'zod';

/**
 * Validación de variables de entorno al arrancar.
 * Si falta o es inválida alguna variable, el proceso termina de inmediato
 * (fail fast) en lugar de fallar más tarde en medio de una petición.
 *
 * Se irán agregando variables (DATABASE_URL, JWT_SECRET, RESEND_API_KEY...)
 * en la fase donde cada una empiece a usarse.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'Debe ser una URL de PostgreSQL (postgresql://usuario:password@host:puerto/bd)',
  }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detalle = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Variables de entorno inválidas:\n${detalle}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
