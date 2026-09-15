import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ALFABETO_CODIGO,
  FORMATO_CODIGO,
  LONGITUD_SUFIJO,
  generarCodigoDescuento,
  generarSufijo,
  type FuenteAleatoria,
} from './codigos';

const AMBIGUOS = /[0O1IL]/;

/** Fuente determinista que entrega los bytes indicados, en orden, a lo largo de varias llamadas. */
const fuenteFija = (bytes: number[]): FuenteAleatoria => {
  let posicion = 0;
  return (cantidad) => {
    const lote = bytes.slice(posicion, posicion + cantidad);
    posicion += cantidad;
    return Uint8Array.from(lote);
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('formato del código', () => {
  it('SERVICIO => DISAGRO-SERV-XXXXXX', () => {
    const codigo = generarCodigoDescuento('SERVICIO');
    expect(codigo).toMatch(/^DISAGRO-SERV-[A-Z2-9]{6}$/);
    expect(codigo).toMatch(FORMATO_CODIGO);
  });

  it('PRODUCTO => DISAGRO-PROD-XXXXXX', () => {
    const codigo = generarCodigoDescuento('PRODUCTO');
    expect(codigo).toMatch(/^DISAGRO-PROD-[A-Z2-9]{6}$/);
    expect(codigo).toMatch(FORMATO_CODIGO);
  });

  it('10,000 códigos: todos con formato válido y sin caracteres ambiguos', () => {
    for (let i = 0; i < 10_000; i++) {
      const codigo = generarCodigoDescuento(i % 2 === 0 ? 'SERVICIO' : 'PRODUCTO');
      const sufijo = codigo.slice(-LONGITUD_SUFIJO);
      expect(codigo).toMatch(FORMATO_CODIGO);
      expect(sufijo).not.toMatch(AMBIGUOS);
    }
  });
});

describe('alfabeto', () => {
  it('no contiene caracteres ambiguos (0, O, 1, I, L)', () => {
    expect(ALFABETO_CODIGO).not.toMatch(AMBIGUOS);
  });

  it('tiene 31 caracteres únicos, solo mayúsculas y dígitos', () => {
    expect(ALFABETO_CODIGO).toHaveLength(31);
    expect(new Set(ALFABETO_CODIGO).size).toBe(31);
    expect(ALFABETO_CODIGO).toMatch(/^[A-Z2-9]+$/);
  });
});

describe('aleatoriedad', () => {
  it('usa crypto y nunca Math.random', () => {
    const espia = vi.spyOn(Math, 'random');
    generarCodigoDescuento('SERVICIO');
    generarCodigoDescuento('PRODUCTO');
    expect(espia).not.toHaveBeenCalled();
  });

  it('distribución uniforme: en 60,000 caracteres cada uno aparece cerca de 1/31', () => {
    const conteo = new Map<string, number>();
    const total = 60_000;
    const sufijo = generarSufijo(total);
    for (const caracter of sufijo) conteo.set(caracter, (conteo.get(caracter) ?? 0) + 1);

    const esperado = total / ALFABETO_CODIGO.length; // ~1935
    expect(conteo.size).toBe(ALFABETO_CODIGO.length);
    for (const veces of conteo.values()) {
      expect(veces).toBeGreaterThan(esperado * 0.8);
      expect(veces).toBeLessThan(esperado * 1.2);
    }
  });

  it('10,000 códigos prácticamente no se repiten (la unicidad real la garantiza la BD)', () => {
    const codigos = new Set(Array.from({ length: 10_000 }, () => generarCodigoDescuento('SERVICIO')));
    expect(codigos.size).toBeGreaterThan(9_990);
  });
});

describe('muestreo por rechazo (sin sesgo de módulo)', () => {
  it('cada byte válido se traduce a su carácter del alfabeto', () => {
    expect(generarSufijo(6, fuenteFija([0, 1, 2, 3, 4, 5]))).toBe('ABCDEF');
    expect(generarSufijo(2, fuenteFija([30, 31]))).toBe('9A'); // 30 => último, 31 => vuelve al primero
  });

  it('descarta los bytes >= 248', () => {
    expect(generarSufijo(3, fuenteFija([255, 248, 0, 250, 1, 2]))).toBe('ABC');
    expect(generarSufijo(1, fuenteFija([247]))).toBe(ALFABETO_CODIGO.charAt(247 % 31));
  });

  it('pide más bytes si un lote completo se descartó', () => {
    const descartados = Array.from({ length: 12 }, () => 255);
    const codigo = generarCodigoDescuento('PRODUCTO', fuenteFija([...descartados, 7, 8, 9, 10, 11, 12]));
    expect(codigo).toBe('DISAGRO-PROD-HJKMNP');
  });
});
