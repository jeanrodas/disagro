import { Decimal } from 'decimal.js';
import type { PorcentajeDescuento, ResultadoDescuentos, ResumenDescuento } from './descuentos';

/**
 * Totales del portafolio a partir de los descuentos ya calculados.
 * Función pura y en Decimal: el monto se redondea a centavos con
 * redondeo "half-up" (0.045 => 0.05), el habitual en facturación.
 */

export interface TotalesPorTipo {
  subtotal: Decimal;
  porcentaje: PorcentajeDescuento;
  descuento: Decimal;
  total: Decimal;
}

export interface TotalesPortafolio {
  servicios: TotalesPorTipo;
  productos: TotalesPorTipo;
  subtotal: Decimal;
  descuento: Decimal;
  total: Decimal;
}

export function calcularMontoDescuento(subtotal: Decimal, porcentaje: PorcentajeDescuento): Decimal {
  return subtotal.times(porcentaje).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function totalesDeTipo({ suma, porcentaje }: ResumenDescuento): TotalesPorTipo {
  const descuento = calcularMontoDescuento(suma, porcentaje);
  return { subtotal: suma, porcentaje, descuento, total: suma.minus(descuento) };
}

/**
 * Se redondea por tipo y luego se suma, para que las filas que ve el cliente
 * (servicios y productos) cuadren exactamente con el total general.
 */
export function calcularTotales(descuentos: ResultadoDescuentos): TotalesPortafolio {
  const servicios = totalesDeTipo(descuentos.servicios);
  const productos = totalesDeTipo(descuentos.productos);

  return {
    servicios,
    productos,
    subtotal: servicios.subtotal.plus(productos.subtotal),
    descuento: servicios.descuento.plus(productos.descuento),
    total: servicios.total.plus(productos.total),
  };
}
