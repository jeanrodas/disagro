import { z } from 'zod';
import { FORMATO_TOKEN_SESION } from '../lib/sesion';

/** Body de POST /api/sesion: el token que llega en el enlace del correo. */
export const enlaceSesionSchema = z.object(
  {
    token: z
      .string({ error: 'token es obligatorio' })
      .regex(FORMATO_TOKEN_SESION, 'token no tiene un formato válido'),
  },
  { error: 'El cuerpo debe ser un objeto JSON' },
);
