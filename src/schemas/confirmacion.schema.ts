import { z } from 'zod';

const ZONA_HORARIA_FERIA = 'America/Guatemala';

/** Fecha de hoy (AAAA-MM-DD) en Guatemala, para no depender de la zona horaria del servidor. */
const hoyEnGuatemala = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA_FERIA }).format(new Date());

/**
 * Letras de cualquier idioma (con tildes y ñ), espacios, apóstrofes, puntos y guiones.
 * Rechaza etiquetas HTML y el carácter de reemplazo "�" que aparece cuando el
 * body llega con una codificación distinta de UTF-8.
 */
const NOMBRE_PERSONA = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

const nombrePersona = (campo: string, maximo: number) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(maximo, `${campo} no puede tener más de ${maximo} caracteres`)
    .regex(NOMBRE_PERSONA, `${campo} solo puede contener letras, espacios, apóstrofes, puntos y guiones`);

/** Body de POST /api/confirmar. Cualquier campo extra (por ejemplo precios) se ignora. */
export const confirmacionSchema = z.object(
  {
    nombre: nombrePersona('nombre', 80),
    apellidos: nombrePersona('apellidos', 120),

    // En minúsculas: Juan@Correo.com y juan@correo.com son el mismo cliente
    email: z
      .string({ error: 'email es obligatorio' })
      .trim()
      .toLowerCase()
      .pipe(z.email('email no tiene un formato válido').max(254, 'email es demasiado largo')),

    // Solo la fecha: el día de la feria en hora de Guatemala (UTC-6, sin horario de verano)
    fechaEvento: z
      .string({ error: 'fechaEvento es obligatoria (formato AAAA-MM-DD)' })
      .pipe(
        z.iso
          // abort: si la fecha no es válida, no se evalúa si es pasada (un solo error claro)
          .date({ error: 'fechaEvento debe ser una fecha válida con formato AAAA-MM-DD', abort: true })
          .refine((fecha) => fecha >= hoyEnGuatemala(), 'fechaEvento no puede ser una fecha pasada'),
      )
      .transform((fecha) => new Date(`${fecha}T00:00:00-06:00`)),

    itemIds: z
      .array(
        z
          .uuid('cada itemId debe ser un UUID válido')
          .transform((id) => id.toLowerCase()),
        { error: 'itemIds debe ser una lista de ids' },
      )
      .min(1, 'Selecciona al menos un producto o servicio')
      .max(50, 'No se pueden seleccionar más de 50 items')
      .refine((ids) => new Set(ids).size === ids.length, 'itemIds no puede tener ids repetidos'),
  },
  { error: 'El cuerpo debe ser un objeto JSON' },
);

export type DatosConfirmacion = z.output<typeof confirmacionSchema>;
