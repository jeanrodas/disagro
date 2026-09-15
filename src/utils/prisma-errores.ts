/**
 * Interpretación de errores de Prisma.
 *
 * Con driver adapters (Prisma 7 + pg), un valor único duplicado llega como P2002
 * y el nombre de la restricción viene en meta.driverAdapterError.cause.constraint.index
 * (ej. "clientes_email_key"), no en meta.target como en versiones anteriores.
 * Se aceptan ambas formas para no depender de una versión concreta.
 */

type Objeto = Record<string, unknown>;

const esObjeto = (valor: unknown): valor is Objeto => typeof valor === 'object' && valor !== null;

/**
 * Si `err` es una violación de restricción única, devuelve el nombre de la
 * restricción (o de los campos); si no, null.
 */
export function restriccionUnicaViolada(err: unknown): string | null {
  if (!esObjeto(err) || err.code !== 'P2002') return null;

  const meta = esObjeto(err.meta) ? err.meta : {};
  const errorAdaptador = esObjeto(meta.driverAdapterError) ? meta.driverAdapterError : {};
  const causa = esObjeto(errorAdaptador.cause) ? errorAdaptador.cause : {};
  const restriccion = esObjeto(causa.constraint) ? causa.constraint : {};

  if (typeof restriccion.index === 'string') return restriccion.index;
  if (Array.isArray(restriccion.fields)) return restriccion.fields.join(',');
  if (Array.isArray(meta.target)) return meta.target.join(',');
  if (typeof meta.target === 'string') return meta.target;
  return 'desconocida';
}
