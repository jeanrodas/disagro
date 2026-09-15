import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calcularDescuentos, type ItemParaDescuento } from './descuentos';
import { calcularMontoDescuento, calcularTotales } from './totales';

const servicio = (precio: string): ItemParaDescuento => ({ tipo: 'SERVICIO', precio });
const producto = (precio: string): ItemParaDescuento => ({ tipo: 'PRODUCTO', precio });

/** Convierte los Decimal a string con 2 decimales para comparar fácilmente. */
const aTexto = (totales: ReturnType<typeof calcularTotales>) => ({
  servicios: {
    subtotal: totales.servicios.subtotal.toFixed(2),
    porcentaje: totales.servicios.porcentaje,
    descuento: totales.servicios.descuento.toFixed(2),
    total: totales.servicios.total.toFixed(2),
  },
  productos: {
    subtotal: totales.productos.subtotal.toFixed(2),
    porcentaje: totales.productos.porcentaje,
    descuento: totales.productos.descuento.toFixed(2),
    total: totales.productos.total.toFixed(2),
  },
  subtotal: totales.subtotal.toFixed(2),
  descuento: totales.descuento.toFixed(2),
  total: totales.total.toFixed(2),
});

describe('calcularMontoDescuento', () => {
  it.each([
    ['1800.00', 5, '90.00'],
    ['1430.00', 3, '42.90'],
    ['1465.00', 3, '43.95'],
    ['999.99', 0, '0.00'],
  ] as const)('%s al %i por ciento => %s', (subtotal, porcentaje, esperado) => {
    expect(calcularMontoDescuento(new Decimal(subtotal), porcentaje).toFixed(2)).toBe(esperado);
  });

  it('redondea a centavos con half-up: 3% de 1.50 = 0.045 => 0.05', () => {
    expect(calcularMontoDescuento(new Decimal('1.50'), 3).toFixed(2)).toBe('0.05');
  });

  it('redondea hacia abajo bajo la mitad: 3% de 485.55 = 14.5665 => 14.57, 3% de 485.51 = 14.5653 => 14.57, 3% de 485.33 = 14.5599 => 14.56', () => {
    expect(calcularMontoDescuento(new Decimal('485.55'), 3).toFixed(2)).toBe('14.57');
    expect(calcularMontoDescuento(new Decimal('485.51'), 3).toFixed(2)).toBe('14.57');
    expect(calcularMontoDescuento(new Decimal('485.33'), 3).toFixed(2)).toBe('14.56');
  });
});

describe('calcularTotales', () => {
  it('2 servicios (Q3350) al 5% + 5 productos (Q2195) al 5%', () => {
    const descuentos = calcularDescuentos([
      servicio('850.00'),
      servicio('2500.00'),
      producto('485.00'),
      producto('560.00'),
      producto('420.00'),
      producto('390.00'),
      producto('340.00'),
    ]);

    expect(aTexto(calcularTotales(descuentos))).toEqual({
      servicios: { subtotal: '3350.00', porcentaje: 5, descuento: '167.50', total: '3182.50' },
      productos: { subtotal: '2195.00', porcentaje: 5, descuento: '109.75', total: '2085.25' },
      subtotal: '5545.00',
      descuento: '277.25',
      total: '5267.75',
    });
  });

  it('sin descuento (1 servicio + 2 productos): total = subtotal', () => {
    const descuentos = calcularDescuentos([servicio('850.00'), producto('485.00'), producto('560.00')]);

    expect(aTexto(calcularTotales(descuentos))).toEqual({
      servicios: { subtotal: '850.00', porcentaje: 0, descuento: '0.00', total: '850.00' },
      productos: { subtotal: '1045.00', porcentaje: 0, descuento: '0.00', total: '1045.00' },
      subtotal: '1895.00',
      descuento: '0.00',
      total: '1895.00',
    });
  });

  it('porcentajes distintos por tipo: servicios 3% y productos 3%', () => {
    const descuentos = calcularDescuentos([
      servicio('750.00'),
      servicio('680.00'),
      producto('295.00'),
      producto('310.00'),
      producto('275.00'),
    ]);
    const totales = aTexto(calcularTotales(descuentos));

    expect(totales.servicios).toEqual({ subtotal: '1430.00', porcentaje: 3, descuento: '42.90', total: '1387.10' });
    expect(totales.productos).toEqual({ subtotal: '880.00', porcentaje: 3, descuento: '26.40', total: '853.60' });
    expect(totales.total).toBe('2240.70');
  });

  it('las filas por tipo cuadran con el total general', () => {
    const totales = calcularTotales(
      calcularDescuentos([servicio('333.33'), servicio('1200.01'), producto('1.50'), producto('1.50'), producto('1.50')]),
    );
    expect(totales.servicios.total.plus(totales.productos.total).equals(totales.total)).toBe(true);
    expect(totales.subtotal.minus(totales.descuento).equals(totales.total)).toBe(true);
  });
});
