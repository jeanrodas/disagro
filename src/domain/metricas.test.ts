import { describe, expect, it } from 'vitest';
import { calcularMetricas, type ClienteParaMetricas, type SeleccionParaMetricas } from './metricas';

const item = (itemId: string, nombre: string, tipo: 'SERVICIO' | 'PRODUCTO', precio: string): SeleccionParaMetricas => ({
  itemId,
  nombre,
  tipo,
  precio,
});

const SUELOS = item('s-suelos', 'Análisis de suelos (fertilidad)', 'SERVICIO', '850.00');
const AGRITEC = item('s-agritec', 'Diagnóstico AgritecGEO (agricultura digital)', 'SERVICIO', '2500.00');
const AGUAS = item('s-aguas', 'Análisis de aguas para riego', 'SERVICIO', '750.00');
const INSUMOS = item('s-insumos', 'Análisis de insumos agrícolas', 'SERVICIO', '680.00');
const FERTICROP = item('p-ferticrop', 'Fertilizante FertiCROP (saco 50kg)', 'PRODUCTO', '485.00');
const NITRO = item('p-nitro', 'NITRO XTEND XP (saco 50kg)', 'PRODUCTO', '560.00');
const PELICANO = item('p-pelicano', 'PELICANO al suelo (saco 50kg)', 'PRODUCTO', '420.00');
const ULTRAFERT = item('p-ultrafert', 'ULTRAFERT soluble', 'PRODUCTO', '390.00');
const BIO = item('p-bio', 'Bioestimulante', 'PRODUCTO', '340.00');
const INSECTICIDA = item('p-insecticida', 'Insecticida', 'PRODUCTO', '295.00');
const HERBICIDA = item('p-herbicida', 'Herbicida', 'PRODUCTO', '275.00');

// A: 2 servicios (Q3350) 5% + 5 productos (Q2195) 5%  => total 5267.75
const A: ClienteParaMetricas = { selecciones: [SUELOS, AGRITEC, FERTICROP, NITRO, PELICANO, ULTRAFERT, BIO] };
// B: 1 servicio 0% + 2 productos 0%                   => total 1320.00
const B: ClienteParaMetricas = { selecciones: [AGUAS, INSECTICIDA, HERBICIDA] };
// C: 2 servicios (Q1430) 3% + 3 productos (Q1465) 3%  => 1387.10 + 1421.05 = 2808.15
const C: ClienteParaMetricas = { selecciones: [AGUAS, INSUMOS, FERTICROP, NITRO, PELICANO] };

describe('calcularMetricas', () => {
  it('sin clientes: todo en cero y niveles con 0 clientes', () => {
    const m = calcularMetricas([]);
    expect(m.totalClientes).toBe(0);
    expect(m.ingresoPotencial.toFixed(2)).toBe('0.00');
    expect(m.itemsMasElegidos).toEqual([]);
    expect(m.nivelesDescuento.servicios).toEqual([
      { porcentaje: 0, clientes: 0 },
      { porcentaje: 3, clientes: 0 },
      { porcentaje: 5, clientes: 0 },
    ]);
  });

  it('ingreso potencial = suma de los totales con descuento de cada cliente', () => {
    const m = calcularMetricas([A, B, C]);
    expect(m.totalClientes).toBe(3);
    expect(m.subtotal.toFixed(2)).toBe('9760.00');
    expect(m.descuento.toFixed(2)).toBe('364.10');
    expect(m.ingresoPotencial.toFixed(2)).toBe('9395.90'); // 5267.75 + 1320.00 + 2808.15
    expect(m.subtotal.minus(m.descuento).equals(m.ingresoPotencial)).toBe(true);
  });

  it('desglose de clientes por nivel de descuento, por separado para servicios y productos', () => {
    const { nivelesDescuento } = calcularMetricas([A, B, C]);
    const esperado = [
      { porcentaje: 0, clientes: 1 },
      { porcentaje: 3, clientes: 1 },
      { porcentaje: 5, clientes: 1 },
    ];
    expect(nivelesDescuento.servicios).toEqual(esperado);
    expect(nivelesDescuento.productos).toEqual(esperado);
  });

  it('top 5 de items por cantidad de selecciones, con empates ordenados por nombre', () => {
    const { itemsMasElegidos } = calcularMetricas([A, B, C]);
    expect(itemsMasElegidos.map((i) => [i.nombre, i.selecciones])).toEqual([
      ['Análisis de aguas para riego', 2],
      ['Fertilizante FertiCROP (saco 50kg)', 2],
      ['NITRO XTEND XP (saco 50kg)', 2],
      ['PELICANO al suelo (saco 50kg)', 2],
      ['Análisis de insumos agrícolas', 1],
    ]);
  });

  it('respeta la cantidad de items del top', () => {
    expect(calcularMetricas([A, B, C], 2).itemsMasElegidos).toHaveLength(2);
  });

  it('suma en Decimal: 0.10 + 0.20 = 0.30 exacto (con number da 0.30000000000000004)', () => {
    expect(0.1 + 0.2).toBe(0.30000000000000004);
    const clientes = ['0.10', '0.20'].map((precio, i) => ({
      selecciones: [item(`p${i}`, `Producto ${i}`, 'PRODUCTO', precio)],
    }));
    expect(calcularMetricas(clientes).ingresoPotencial.toString()).toBe('0.3');
  });
});
