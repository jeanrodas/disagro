import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calcularDescuentos,
  porcentajeProductos,
  porcentajeServicios,
  type ItemParaDescuento,
} from './descuentos';

const servicio = (precio: string): ItemParaDescuento => ({ tipo: 'SERVICIO', precio });
const producto = (precio = '100.00'): ItemParaDescuento => ({ tipo: 'PRODUCTO', precio });
const nProductos = (n: number, precio?: string) => Array.from({ length: n }, () => producto(precio));

describe('descuento de SERVICIOS', () => {
  it('0 servicios => 0%', () => {
    const { servicios } = calcularDescuentos([]);
    expect(servicios.cantidad).toBe(0);
    expect(servicios.suma.toFixed(2)).toBe('0.00');
    expect(servicios.porcentaje).toBe(0);
  });

  it('1 servicio => 0%', () => {
    expect(calcularDescuentos([servicio('680.00')]).servicios.porcentaje).toBe(0);
  });

  it('1 servicio aunque su precio supere Q1500 => 0% (se requieren al menos 2)', () => {
    const { servicios } = calcularDescuentos([servicio('2500.00')]);
    expect(servicios.suma.toFixed(2)).toBe('2500.00');
    expect(servicios.porcentaje).toBe(0);
  });

  it('2 servicios con suma < 1500 => 3%', () => {
    const { servicios } = calcularDescuentos([servicio('750.00'), servicio('680.00')]);
    expect(servicios.suma.toFixed(2)).toBe('1430.00');
    expect(servicios.porcentaje).toBe(3);
  });

  it('frontera: 2 servicios con suma EXACTAMENTE 1500.00 => 3% (el enunciado dice "mayor a")', () => {
    const { servicios } = calcularDescuentos([servicio('750.00'), servicio('750.00')]);
    expect(servicios.suma.toFixed(2)).toBe('1500.00');
    expect(servicios.porcentaje).toBe(3);
  });

  it('frontera: 2 servicios con suma 1500.01 => 5%', () => {
    const { servicios } = calcularDescuentos([servicio('750.00'), servicio('750.01')]);
    expect(servicios.porcentaje).toBe(5);
  });

  it('2 servicios con suma > 1500 => 5%', () => {
    const { servicios } = calcularDescuentos([servicio('850.00'), servicio('950.00')]);
    expect(servicios.suma.toFixed(2)).toBe('1800.00');
    expect(servicios.porcentaje).toBe(5);
  });

  it('3 servicios con suma exactamente 1500.00 => 3%', () => {
    const items = [servicio('400.00'), servicio('500.00'), servicio('600.00')];
    expect(calcularDescuentos(items).servicios.porcentaje).toBe(3);
  });

  it('usa aritmética decimal: 524.07 + 500.00 + 475.93 = 1500.00 exacto => 3%', () => {
    // Con number, la misma suma da 1500.0000000000002 y otorgaría 5% por error
    expect(524.07 + 500.0 + 475.93).toBeGreaterThan(1500);

    const { servicios } = calcularDescuentos([servicio('524.07'), servicio('500.00'), servicio('475.93')]);
    expect(servicios.suma.toFixed(2)).toBe('1500.00');
    expect(servicios.porcentaje).toBe(3);
  });

  it.each([
    [0, '0.00', 0],
    [1, '9999.00', 0],
    [2, '1499.99', 3],
    [2, '1500.00', 3],
    [2, '1500.01', 5],
    [7, '8930.00', 5],
  ] as const)('porcentajeServicios(%i, %s) => %i%%', (cantidad, suma, esperado) => {
    expect(porcentajeServicios(cantidad, new Decimal(suma))).toBe(esperado);
  });
});

describe('descuento de PRODUCTOS', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 3],
    [4, 3],
    [5, 5],
    [6, 5],
    [10, 5],
  ] as const)('%i productos => %i%%', (cantidad, esperado) => {
    expect(calcularDescuentos(nProductos(cantidad)).productos.porcentaje).toBe(esperado);
    expect(porcentajeProductos(cantidad)).toBe(esperado);
  });

  it('el porcentaje de productos depende de la cantidad, no del precio', () => {
    expect(calcularDescuentos(nProductos(5, '0.01')).productos.porcentaje).toBe(5);
    expect(calcularDescuentos(nProductos(2, '1250.00')).productos.porcentaje).toBe(0);
  });

  it('reporta cantidad y suma de productos', () => {
    const { productos } = calcularDescuentos([producto('485.00'), producto('560.00'), producto('420.00')]);
    expect(productos.cantidad).toBe(3);
    expect(productos.suma.toFixed(2)).toBe('1465.00');
  });
});

describe('SERVICIOS y PRODUCTOS combinados (porcentajes independientes)', () => {
  it('2 servicios con suma > 1500 y 3 productos => servicios 5%, productos 3%', () => {
    const resultado = calcularDescuentos([
      servicio('850.00'),
      servicio('950.00'),
      ...nProductos(3),
    ]);
    expect(resultado.servicios.porcentaje).toBe(5);
    expect(resultado.productos.porcentaje).toBe(3);
  });

  it('los servicios no cuentan para el umbral de productos: 4 servicios + 2 productos => productos 0%', () => {
    const resultado = calcularDescuentos([
      servicio('850.00'),
      servicio('750.00'),
      servicio('950.00'),
      servicio('680.00'),
      ...nProductos(2),
    ]);
    expect(resultado.servicios.porcentaje).toBe(5);
    expect(resultado.productos.cantidad).toBe(2);
    expect(resultado.productos.porcentaje).toBe(0);
  });

  it('los productos no suman para el umbral de servicios: 1 servicio + 5 productos caros => servicios 0%, productos 5%', () => {
    const resultado = calcularDescuentos([servicio('850.00'), ...nProductos(5, '1250.00')]);
    expect(resultado.servicios.suma.toFixed(2)).toBe('850.00');
    expect(resultado.servicios.porcentaje).toBe(0);
    expect(resultado.productos.porcentaje).toBe(5);
  });

  it('selección real del catálogo: 2 servicios (Q3350) + 5 productos => 5% y 5%', () => {
    const resultado = calcularDescuentos([
      producto('485.00'), // FertiCROP
      servicio('850.00'), // Análisis de suelos
      producto('560.00'), // NITRO XTEND XP
      producto('420.00'), // PELICANO
      servicio('2500.00'), // AgritecGEO
      producto('390.00'), // ULTRAFERT
      producto('340.00'), // Bioestimulante
    ]);
    expect(resultado.servicios).toMatchObject({ cantidad: 2, porcentaje: 5 });
    expect(resultado.servicios.suma.toFixed(2)).toBe('3350.00');
    expect(resultado.productos).toMatchObject({ cantidad: 5, porcentaje: 5 });
    expect(resultado.productos.suma.toFixed(2)).toBe('2195.00');
  });

  it('el orden de los items no cambia el resultado', () => {
    const items = [servicio('850.00'), producto(), servicio('950.00'), producto(), producto()];
    const invertido = [...items].reverse();
    const a = calcularDescuentos(items);
    const b = calcularDescuentos(invertido);
    expect([a.servicios.porcentaje, a.productos.porcentaje]).toEqual([b.servicios.porcentaje, b.productos.porcentaje]);
    expect(a.servicios.suma.equals(b.servicios.suma)).toBe(true);
  });
});

describe('validación de precios', () => {
  it('acepta Decimal además de string', () => {
    const items: ItemParaDescuento[] = [
      { tipo: 'SERVICIO', precio: new Decimal('850.00') },
      { tipo: 'SERVICIO', precio: new Decimal('950.00') },
    ];
    expect(calcularDescuentos(items).servicios.porcentaje).toBe(5);
  });

  it('rechaza precios negativos', () => {
    expect(() => calcularDescuentos([servicio('-1.00')])).toThrow(RangeError);
  });

  it('rechaza precios no numéricos', () => {
    expect(() => calcularDescuentos([servicio('abc')])).toThrow();
  });

  it('rechaza precios infinitos o NaN', () => {
    expect(() => calcularDescuentos([servicio('Infinity')])).toThrow(RangeError);
    expect(() => calcularDescuentos([servicio('NaN')])).toThrow(RangeError);
  });
});
