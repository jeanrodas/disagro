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
/** Variable opcional: vacía o ausente se trata como undefined. */
const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor), schema.optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.url().default('http://localhost:5173'),
  // Cuántos proxies hay delante de la app (ver interpretarTrustProxy)
  TRUST_PROXY: z
    .string()
    .trim()
    .default('false')
    .refine(
      (valor) => valor !== 'true',
      'TRUST_PROXY no puede ser "true": confiar en todas las cabeceras permite falsificar la IP. Usa el número de proxies (1), "loopback" o la lista de IPs.',
    ),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'Debe ser una URL de PostgreSQL (postgresql://usuario:password@host:puerto/bd)',
  }),
  // JWT_SECRET firma los tokens del admin: obligatoria, larga y nunca el valor de ejemplo
  JWT_SECRET: z.string({ error: 'JWT_SECRET es obligatoria' }).min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
    .refine((valor) => valor !== 'reemplazar_por_un_secreto_largo_y_aleatorio', 'JWT_SECRET todavía tiene el valor de ejemplo'),
  // Opcional: sin key el correo de respaldo se omite y la confirmación funciona igual
  RESEND_API_KEY: opcional(z.string().startsWith('re_', 'RESEND_API_KEY debe empezar con "re_"')),
  // Desarrollo: onboarding@resend.dev | Producción: feria@jeanrodas.lat (sin tocar código)
  MAIL_FROM: z.string().trim().min(3).default('Feria Disagro <onboarding@resend.dev>'),
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

/**
 * Valor de 'trust proxy' para Express, a partir de TRUST_PROXY.
 *
 * En local NO hay proxy y el valor es false: si se confiara en X-Forwarded-For
 * sin tener un proxy delante, cualquiera podría inventar esa cabecera, aparecer
 * con una IP distinta en cada petición y saltarse el rate limiting.
 *
 * En producción la app va detrás de un proxy (el hosting o nginx), así que se
 * indica cuántos saltos confiables hay —normalmente 1— y Express toma como
 * req.ip la IP real del cliente en lugar de la del proxy.
 *
 *   TRUST_PROXY=false          desarrollo local, sin proxy
 *   TRUST_PROXY=1              un proxy delante (lo habitual en producción)
 *   TRUST_PROXY=loopback       confía solo en 127.0.0.1 / ::1
 *   TRUST_PROXY=10.0.0.1,...   lista de proxies concretos
 */
export function interpretarTrustProxy(valor: string = env.TRUST_PROXY): boolean | number | string {
  if (valor === '' || valor === 'false') return false;
  if (/^\d+$/.test(valor)) return Number(valor);
  return valor;
}

/**
 * Credenciales del admin inicial. Se validan aparte porque solo las usa el seed:
 * el servidor arranca sin ellas.
 */
const credencialesAdminSchema = z.object({
  ADMIN_USER: z
    .string({ error: 'ADMIN_USER es obligatoria para crear el admin' })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,50}$/, 'ADMIN_USER debe tener de 3 a 50 caracteres: letras, números, punto, guion o guion bajo'),
  ADMIN_PASSWORD: z
    .string({ error: 'ADMIN_PASSWORD es obligatoria para crear el admin' })
    .min(12, 'ADMIN_PASSWORD debe tener al menos 12 caracteres')
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'ADMIN_PASSWORD no puede superar 72 bytes (límite de bcrypt)')
    .refine((password) => password !== 'cambiar_esta_password', 'ADMIN_PASSWORD todavía tiene el valor de ejemplo'),
});

/** Lanza un Error con el detalle si ADMIN_USER o ADMIN_PASSWORD faltan o son inválidas. */
export function leerCredencialesAdmin(fuente: NodeJS.ProcessEnv = process.env) {
  const resultado = credencialesAdminSchema.safeParse(fuente);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Credenciales del admin inválidas:\n${detalle}`);
  }
  return { usuario: resultado.data.ADMIN_USER, password: resultado.data.ADMIN_PASSWORD };
}
