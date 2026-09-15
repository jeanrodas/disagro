import type { Decimal } from 'decimal.js';
import { calcularDescuentos, type PorcentajeDescuento, type ResumenDescuento } from '../domain/descuentos';
import { calcularTotales, type TotalesPorTipo } from '../domain/totales';
import type { EstadoCodigo, TipoItem } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';
import { aItemDto, itemSelect, type ItemDto } from './catalogo.service';

/**
 * Portafolio personalizado del cliente: lo que eligió, sus descuentos,
 * sus códigos y los totales. Los montos viajan como string con 2 decimales.
 */

export interface ResumenDescuentoDto {
  cantidad: number;
  suma: string;
  porcentaje: PorcentajeDescuento;
}

export interface TotalesPorTipoDto {
  subtotal: string;
  porcentaje: PorcentajeDescuento;
  descuento: string;
  total: string;
}

export interface CodigoDto {
  codigo: string;
  tipo: TipoItem;
  porcentaje: number;
  estado: EstadoCodigo;
  creadoEn: Date;
  canjeadoEn: Date | null;
}

export interface PortafolioDto {
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    fechaEvento: Date;
    confirmadoEn: Date;
  };
  items: ItemDto[];
  descuentos: { servicios: ResumenDescuentoDto; productos: ResumenDescuentoDto };
  codigos: CodigoDto[];
  totales: {
    servicios: TotalesPorTipoDto;
    productos: TotalesPorTipoDto;
    subtotal: string;
    descuento: string;
    total: string;
  };
}

const aMoneda = (monto: Decimal) => monto.toFixed(2);

const aResumenDto = ({ cantidad, suma, porcentaje }: ResumenDescuento): ResumenDescuentoDto => ({
  cantidad,
  suma: aMoneda(suma),
  porcentaje,
});

const aTotalesDto = ({ subtotal, porcentaje, descuento, total }: TotalesPorTipo): TotalesPorTipoDto => ({
  subtotal: aMoneda(subtotal),
  porcentaje,
  descuento: aMoneda(descuento),
  total: aMoneda(total),
});

/** Portafolio de un cliente, o null si no existe. Lo usan el cliente y el panel admin. */
export async function buscarPortafolio(clienteId: string): Promise<PortafolioDto | null> {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      email: true,
      fechaEvento: true,
      confirmadoEn: true,
      selecciones: {
        select: { item: { select: itemSelect } },
        orderBy: [{ item: { tipo: 'asc' } }, { item: { nombre: 'asc' } }],
      },
      codigos: {
        select: { codigo: true, tipo: true, porcentaje: true, estado: true, creadoEn: true, canjeadoEn: true },
        orderBy: { tipo: 'asc' },
      },
    },
  });

  if (!cliente) return null;

  const { selecciones, codigos, ...datosCliente } = cliente;
  const items = selecciones.map((seleccion) => seleccion.item);

  // Mismos precios de la BD y la misma función de dominio que usó la confirmación
  const descuentos = calcularDescuentos(items.map((item) => ({ tipo: item.tipo, precio: item.precio.toString() })));
  const totales = calcularTotales(descuentos);

  return {
    cliente: datosCliente,
    items: items.map(aItemDto),
    descuentos: {
      servicios: aResumenDto(descuentos.servicios),
      productos: aResumenDto(descuentos.productos),
    },
    codigos,
    totales: {
      servicios: aTotalesDto(totales.servicios),
      productos: aTotalesDto(totales.productos),
      subtotal: aMoneda(totales.subtotal),
      descuento: aMoneda(totales.descuento),
      total: aMoneda(totales.total),
    },
  };
}

/** Portafolio del cliente de la sesión; 404 si el cliente ya no existe. */
export async function obtenerPortafolio(clienteId: string): Promise<PortafolioDto> {
  const portafolio = await buscarPortafolio(clienteId);
  if (!portafolio) throw HttpError.notFound('Portafolio no encontrado');
  return portafolio;
}
