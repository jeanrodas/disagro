/**
 * Validación del formulario en el navegador: evita viajes al servidor por errores
 * obvios y habilita la selección. La validación VINCULANTE es la del backend
 * (zod en src/schemas/confirmacion.schema.ts), que además revisa cosas que aquí
 * no se comprueban a propósito, como los caracteres permitidos en los nombres.
 */

export interface DatosFormulario {
  nombre: string
  apellidos: string
  email: string
  /** AAAA-MM-DD, que es lo que acepta el backend. */
  fechaEvento: string
}

export type ErroresFormulario = Partial<Record<keyof DatosFormulario, string>>

/** Mismo criterio que el backend para habilitar la selección: un email con formato válido. */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const emailValido = (email: string): boolean => FORMATO_EMAIL.test(email.trim())

/** Fecha de hoy (AAAA-MM-DD) en Guatemala, para no depender de la zona del navegador. */
export const hoyEnGuatemala = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala' }).format(new Date())

export function validarFormulario(datos: DatosFormulario): ErroresFormulario {
  const errores: ErroresFormulario = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresa tu nombre'
  else if (datos.nombre.trim().length > 80) errores.nombre = 'Máximo 80 caracteres'

  if (!datos.apellidos.trim()) errores.apellidos = 'Ingresa tus apellidos'
  else if (datos.apellidos.trim().length > 120) errores.apellidos = 'Máximo 120 caracteres'

  if (!datos.email.trim()) errores.email = 'Ingresa tu correo'
  else if (!emailValido(datos.email)) errores.email = 'El correo no tiene un formato válido'

  if (!datos.fechaEvento) errores.fechaEvento = 'Elige la fecha de tu visita'
  else if (datos.fechaEvento < hoyEnGuatemala()) errores.fechaEvento = 'La fecha no puede ser anterior a hoy'

  return errores
}
