const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Las columnas id son @db.Uuid: consultar con un texto que no es UUID hace fallar
 * a Postgres. Se valida antes para responder 404/401 en lugar de un 500.
 */
export const esUuid = (valor: string) => FORMATO_UUID.test(valor);
