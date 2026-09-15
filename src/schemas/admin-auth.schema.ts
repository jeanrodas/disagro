import { z } from 'zod';
import { MAX_BYTES_PASSWORD } from '../lib/password';

/** Body de POST /api/admin/login. La contraseña no se recorta: los espacios cuentan. */
export const loginAdminSchema = z.object(
  {
    usuario: z
      .string({ error: 'usuario es obligatorio' })
      .trim()
      .toLowerCase()
      .min(1, 'usuario es obligatorio')
      .max(50, 'usuario no puede tener más de 50 caracteres'),
    password: z
      .string({ error: 'password es obligatoria' })
      .min(1, 'password es obligatoria')
      .refine(
        (password) => Buffer.byteLength(password, 'utf8') <= MAX_BYTES_PASSWORD,
        `password no puede superar ${MAX_BYTES_PASSWORD} bytes`,
      ),
  },
  { error: 'El cuerpo debe ser un objeto JSON' },
);
