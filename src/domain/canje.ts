import type { TipoItem } from './descuentos';

/**
 * Interpretación del resultado de un canje.
 *
 * El canje se hace con un UPDATE condicional atómico (ver codigos.service). Esta
 * función pura solo decide qué responder a partir de lo que devolvió la BD:
 *   - el UPDATE modificó el código          => canjeado (200)
 *   - no lo modificó y el código no existe   => inexistente (404)
 *   - no lo modificó y ya estaba CANJEADO    => ya canjeado (409)
 */

export type EstadoCodigo = 'EMITIDO' | 'CANJEADO';

export interface CodigoParaCanje {
  codigo: string;
  tipo: TipoItem;
  porcentaje: number;
  estado: EstadoCodigo;
  canjeadoEn: Date | null;
}

export type CodigoCanjeado = CodigoParaCanje & { estado: 'CANJEADO'; canjeadoEn: Date };

export type ResultadoCanje =
  | { tipo: 'canjeado'; codigo: CodigoCanjeado }
  | { tipo: 'inexistente' }
  | { tipo: 'ya_canjeado'; codigo: string; canjeadoEn: Date | null };

/**
 * @param actualizado fila devuelta por el UPDATE condicional (undefined si no afectó ninguna)
 * @param actual      el código tal como está en la BD; solo se consulta si el UPDATE no afectó filas
 */
export function interpretarCanje(
  actualizado: CodigoParaCanje | undefined,
  actual: CodigoParaCanje | null,
): ResultadoCanje {
  if (actualizado) {
    if (actualizado.estado !== 'CANJEADO' || !actualizado.canjeadoEn) {
      throw new Error(`El UPDATE condicional devolvió ${actualizado.codigo} sin marcarlo como CANJEADO`);
    }
    return { tipo: 'canjeado', codigo: { ...actualizado, estado: 'CANJEADO', canjeadoEn: actualizado.canjeadoEn } };
  }

  if (!actual) return { tipo: 'inexistente' };

  if (actual.estado === 'CANJEADO') {
    return { tipo: 'ya_canjeado', codigo: actual.codigo, canjeadoEn: actual.canjeadoEn };
  }

  // Sigue EMITIDO pero el UPDATE condicional no lo tocó: no debería ocurrir,
  // porque un código nunca vuelve de CANJEADO a EMITIDO.
  throw new Error(`Estado inconsistente al canjear ${actual.codigo}: sigue EMITIDO`);
}
