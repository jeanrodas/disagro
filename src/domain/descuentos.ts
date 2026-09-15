import { Decimal } from 'decimal.js';

/**
 * Reglas de descuento de la feria.
 *
 * Es una función pura: no conoce Express ni Prisma. Recibe items en memoria y
 * devuelve el resultado, así que se prueba con tests unitarios sin base de
 * datos y el servicio de confirmación solo tiene que llamarla.
 *
 * El dinero se maneja con Decimal y no con number: en coma flotante,
 * 524.07 + 500.00 + 475.93 da 1500.0000000000002, y la regla "suma > 1500"
 * otorgaría 5% cuando el enunciado dice 3% (ver test de frontera).
 */

export type TipoItem = 'SERVICIO' | 'PRODUCTO';
export type PorcentajeDescuento = 0 | 3 | 5;

export interface ItemParaDescuento {
  tipo: TipoItem;
  /** Precio unitario como Decimal o string ("850.00"). No se acepta number para no arrastrar errores de coma flotante. */
  precio: Decimal | string;
}

export interface ResumenDescuento {
  cantidad: number;
  suma: Decimal;
  porcentaje: PorcentajeDescuento;
}

export interface ResultadoDescuentos {
  servicios: ResumenDescuento;
  productos: ResumenDescuento;
}

/** Umbrales del enunciado. */
export const REGLAS = {
  servicios: {
    cantidadMinima: 2,
    /** La suma debe ser ESTRICTAMENTE mayor a este valor para el 5%. */
    sumaMayorA: new Decimal(1500),
  },
  productos: {
    cantidadParaTresPorCiento: 3,
    cantidadParaCincoPorCiento: 5,
  },
} as const;

/**
 * SERVICIOS:
 *   >= 2 servicios y suma > Q1500 => 5%
 *   >= 2 servicios                => 3%
 *   si no                         => 0%
 */
export function porcentajeServicios(cantidad: number, suma: Decimal): PorcentajeDescuento {
  const { cantidadMinima, sumaMayorA } = REGLAS.servicios;
  if (cantidad >= cantidadMinima && suma.greaterThan(sumaMayorA)) return 5;
  if (cantidad >= cantidadMinima) return 3;
  return 0;
}

/**
 * PRODUCTOS:
 *   >= 5 productos => 5%
 *   >= 3 productos => 3%
 *   si no          => 0%
 */
export function porcentajeProductos(cantidad: number): PorcentajeDescuento {
  const { cantidadParaTresPorCiento, cantidadParaCincoPorCiento } = REGLAS.productos;
  if (cantidad >= cantidadParaCincoPorCiento) return 5;
  if (cantidad >= cantidadParaTresPorCiento) return 3;
  return 0;
}

/**
 * Calcula los dos descuentos, independientes entre sí.
 * Cada elemento de `items` cuenta como un item distinto; evitar selecciones
 * repetidas es responsabilidad de quien llama (validación + @@unique en BD).
 */
export function calcularDescuentos(items: readonly ItemParaDescuento[]): ResultadoDescuentos {
  const servicios = resumirPorTipo(items, 'SERVICIO');
  const productos = resumirPorTipo(items, 'PRODUCTO');

  return {
    servicios: { ...servicios, porcentaje: porcentajeServicios(servicios.cantidad, servicios.suma) },
    productos: { ...productos, porcentaje: porcentajeProductos(productos.cantidad) },
  };
}

function resumirPorTipo(items: readonly ItemParaDescuento[], tipo: TipoItem) {
  const delTipo = items.filter((item) => item.tipo === tipo);
  const suma = delTipo.reduce((total, item) => total.plus(aPrecio(item.precio)), new Decimal(0));
  return { cantidad: delTipo.length, suma };
}

function aPrecio(valor: Decimal | string): Decimal {
  const precio = new Decimal(valor); // lanza DecimalError si el string no es numérico
  if (!precio.isFinite() || precio.lessThan(0)) {
    throw new RangeError(`Precio inválido: ${valor.toString()}`);
  }
  return precio;
}
