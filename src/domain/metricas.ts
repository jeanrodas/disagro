import { Decimal } from 'decimal.js';
import { calcularDescuentos, type PorcentajeDescuento, type TipoItem } from './descuentos';
import { calcularTotales } from './totales';

/**
 * Métricas del panel a partir de las selecciones de cada cliente.
 * Función pura: reutiliza calcularDescuentos y calcularTotales, así que el ingreso
 * potencial suma exactamente los mismos totales que ve cada cliente en su portafolio.
 */

export interface SeleccionParaMetricas {
  itemId: string;
  nombre: string;
  tipo: TipoItem;
  precio: Decimal | string;
}

export interface ClienteParaMetricas {
  selecciones: readonly SeleccionParaMetricas[];
}

export interface ItemMasElegido {
  itemId: string;
  nombre: string;
  tipo: TipoItem;
  selecciones: number;
}

export interface ConteoNivel {
  porcentaje: PorcentajeDescuento;
  clientes: number;
}

export interface Metricas {
  totalClientes: number;
  subtotal: Decimal;
  descuento: Decimal;
  /** Suma de los totales con descuento de todos los clientes. */
  ingresoPotencial: Decimal;
  itemsMasElegidos: ItemMasElegido[];
  nivelesDescuento: { servicios: ConteoNivel[]; productos: ConteoNivel[] };
}

const NIVELES: readonly PorcentajeDescuento[] = [0, 3, 5];

export function calcularMetricas(clientes: readonly ClienteParaMetricas[], cantidadTop = 5): Metricas {
  let subtotal = new Decimal(0);
  let descuento = new Decimal(0);
  let ingresoPotencial = new Decimal(0);

  const conteoPorItem = new Map<string, ItemMasElegido>();
  const nivelesServicios = new Map<PorcentajeDescuento, number>();
  const nivelesProductos = new Map<PorcentajeDescuento, number>();

  for (const cliente of clientes) {
    const totales = calcularTotales(calcularDescuentos(cliente.selecciones));

    subtotal = subtotal.plus(totales.subtotal);
    descuento = descuento.plus(totales.descuento);
    ingresoPotencial = ingresoPotencial.plus(totales.total);

    nivelesServicios.set(totales.servicios.porcentaje, (nivelesServicios.get(totales.servicios.porcentaje) ?? 0) + 1);
    nivelesProductos.set(totales.productos.porcentaje, (nivelesProductos.get(totales.productos.porcentaje) ?? 0) + 1);

    for (const { itemId, nombre, tipo } of cliente.selecciones) {
      const conteo = conteoPorItem.get(itemId);
      if (conteo) conteo.selecciones += 1;
      else conteoPorItem.set(itemId, { itemId, nombre, tipo, selecciones: 1 });
    }
  }

  // Más elegidos primero; con empate, por nombre para que el orden sea estable
  const itemsMasElegidos = [...conteoPorItem.values()]
    .sort((a, b) => b.selecciones - a.selecciones || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, cantidadTop);

  const aConteos = (niveles: Map<PorcentajeDescuento, number>): ConteoNivel[] =>
    NIVELES.map((porcentaje) => ({ porcentaje, clientes: niveles.get(porcentaje) ?? 0 }));

  return {
    totalClientes: clientes.length,
    subtotal,
    descuento,
    ingresoPotencial,
    itemsMasElegidos,
    nivelesDescuento: { servicios: aConteos(nivelesServicios), productos: aConteos(nivelesProductos) },
  };
}
