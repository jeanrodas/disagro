import type { PorcentajeDescuento } from '../domain/descuentos';
import { calcularMetricas, type ItemMasElegido } from '../domain/metricas';
import type { EstadoCodigo } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Métricas del panel de administración.
 *
 * Se leen las selecciones de todos los clientes y se calcula en memoria con las
 * funciones de dominio, para que cada total use el mismo redondeo que el portafolio.
 * Para una feria (cientos o miles de clientes) basta; a mayor escala convendría
 * guardar el total de cada cliente al confirmar y sumarlo en SQL.
 */

export interface MetricasDto {
  totalClientes: number;
  ingresos: { subtotal: string; descuento: string; ingresoPotencial: string };
  itemsMasElegidos: ItemMasElegido[];
  nivelesDescuento: {
    servicios: { porcentaje: PorcentajeDescuento; clientes: number }[];
    productos: { porcentaje: PorcentajeDescuento; clientes: number }[];
  };
  codigos: { emitidos: number; canjeados: number; total: number };
}

export async function obtenerMetricas(): Promise<MetricasDto> {
  const [clientes, codigosPorEstado] = await Promise.all([
    prisma.cliente.findMany({
      select: { selecciones: { select: { item: { select: { id: true, nombre: true, tipo: true, precio: true } } } } },
    }),
    prisma.codigoDescuento.groupBy({ by: ['estado'], _count: { _all: true } }),
  ]);

  const metricas = calcularMetricas(
    clientes.map((cliente) => ({
      selecciones: cliente.selecciones.map(({ item }) => ({
        itemId: item.id,
        nombre: item.nombre,
        tipo: item.tipo,
        precio: item.precio.toString(),
      })),
    })),
  );

  const contarCodigos = (estado: EstadoCodigo) =>
    codigosPorEstado.find((grupo) => grupo.estado === estado)?._count._all ?? 0;
  const emitidos = contarCodigos('EMITIDO');
  const canjeados = contarCodigos('CANJEADO');

  return {
    totalClientes: metricas.totalClientes,
    ingresos: {
      subtotal: metricas.subtotal.toFixed(2),
      descuento: metricas.descuento.toFixed(2),
      ingresoPotencial: metricas.ingresoPotencial.toFixed(2),
    },
    itemsMasElegidos: metricas.itemsMasElegidos,
    nivelesDescuento: metricas.nivelesDescuento,
    codigos: { emitidos, canjeados, total: emitidos + canjeados },
  };
}
