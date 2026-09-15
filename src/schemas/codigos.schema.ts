import { z } from 'zod';
import { FORMATO_CODIGO } from '../domain/codigos';

/**
 * Body de POST /api/codigos/canjear.
 * Se aceptan espacios alrededor y minúsculas (un código dictado o copiado de un
 * correo), pero el formato debe coincidir exactamente con el que se genera.
 */
export const canjearCodigoSchema = z.object(
  {
    codigo: z
      .string({ error: 'codigo es obligatorio' })
      .trim()
      .toUpperCase()
      .regex(FORMATO_CODIGO, 'codigo debe tener el formato DISAGRO-SERV-XXXXXX o DISAGRO-PROD-XXXXXX'),
  },
  { error: 'El cuerpo debe ser un objeto JSON' },
);
