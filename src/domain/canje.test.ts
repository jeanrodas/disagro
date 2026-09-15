import { describe, expect, it } from 'vitest';
import { interpretarCanje, type CodigoParaCanje } from './canje';

const FECHA = new Date('2026-10-15T15:30:00.000Z');

const codigo = (cambios: Partial<CodigoParaCanje> = {}): CodigoParaCanje => ({
  codigo: 'DISAGRO-SERV-XR8TKF',
  tipo: 'SERVICIO',
  porcentaje: 5,
  estado: 'EMITIDO',
  canjeadoEn: null,
  ...cambios,
});

describe('interpretarCanje', () => {
  it('el UPDATE condicional modificó el código => canjeado, con su fecha', () => {
    const resultado = interpretarCanje(codigo({ estado: 'CANJEADO', canjeadoEn: FECHA }), null);
    expect(resultado).toEqual({
      tipo: 'canjeado',
      codigo: { codigo: 'DISAGRO-SERV-XR8TKF', tipo: 'SERVICIO', porcentaje: 5, estado: 'CANJEADO', canjeadoEn: FECHA },
    });
  });

  it('no se modificó y el código no existe => inexistente', () => {
    expect(interpretarCanje(undefined, null)).toEqual({ tipo: 'inexistente' });
  });

  it('no se modificó porque ya estaba CANJEADO => ya_canjeado con la fecha del primer canje', () => {
    const resultado = interpretarCanje(undefined, codigo({ estado: 'CANJEADO', canjeadoEn: FECHA }));
    expect(resultado).toEqual({ tipo: 'ya_canjeado', codigo: 'DISAGRO-SERV-XR8TKF', canjeadoEn: FECHA });
  });

  it('no se modificó pero sigue EMITIDO => error de consistencia (no debería ocurrir)', () => {
    expect(() => interpretarCanje(undefined, codigo())).toThrow('Estado inconsistente');
  });

  it('el UPDATE devolvió una fila sin marcar como CANJEADO => error', () => {
    expect(() => interpretarCanje(codigo(), null)).toThrow('sin marcarlo como CANJEADO');
    expect(() => interpretarCanje(codigo({ estado: 'CANJEADO', canjeadoEn: null }), null)).toThrow();
  });
});
