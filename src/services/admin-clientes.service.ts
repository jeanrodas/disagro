import { calcularDescuentos, type PorcentajeDescuento } from '../domain/descuentos';
import { calcularTotales } from '../domain/totales';
import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import type { FiltrosClientes } from '../schemas/admin-clientes.schema';
import { HttpError } from '../utils/http-error';
import { escaparComodinesLike } from '../utils/like';
import { buscarPortafolio, type PortafolioDto } from './portafolio.service';

/**
 * Consultas de clientes para el panel de administración.
 * Descuentos y totales salen de las mismas funciones de dominio que el portafolio.
 */

export interface ClienteResumenDto {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  fechaEvento: Date;
  confirmadoEn: Date;
  cantidadItems: number;
  descuentos: { servicios: PorcentajeDescuento; productos: PorcentajeDescuento };
  cantidadCodigos: number;
  /** Total con descuento, como string con 2 decimales. */
  total: string;
}

export interface ListaClientesDto {
  data: ClienteResumenDto[];
  paginacion: { page: number; limit: number; total: number; totalPaginas: number };
}

export async function listarClientes({ page, limit, buscar }: FiltrosClientes): Promise<ListaClientesDto> {
  const where: Prisma.ClienteWhereInput = {};
  if (buscar) {
    const texto = escaparComodinesLike(buscar);
    where.OR = [
      { nombre: { contains: texto, mode: 'insensitive' } },
      { apellidos: { contains: texto, mode: 'insensitive' } },
      { email: { contains: texto, mode: 'insensitive' } },
    ];
  }

  const [total, clientes] = await prisma.$transaction([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      // id como desempate: con fechas iguales, la paginación no repite ni salta clientes
      orderBy: [{ confirmadoEn: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        fechaEvento: true,
        confirmadoEn: true,
        selecciones: { select: { item: { select: { tipo: true, precio: true } } } },
        _count: { select: { codigos: true } },
      },
    }),
  ]);

  const data = clientes.map(({ selecciones, _count, ...cliente }) => {
    const descuentos = calcularDescuentos(
      selecciones.map(({ item }) => ({ tipo: item.tipo, precio: item.precio.toString() })),
    );
    return {
      ...cliente,
      cantidadItems: selecciones.length,
      descuentos: { servicios: descuentos.servicios.porcentaje, productos: descuentos.productos.porcentaje },
      cantidadCodigos: _count.codigos,
      total: calcularTotales(descuentos).total.toFixed(2),
    };
  });

  return { data, paginacion: { page, limit, total, totalPaginas: Math.ceil(total / limit) } };
}

/** Detalle completo de un cliente: reutiliza el portafolio. 404 si no existe. */
export async function obtenerDetalleCliente(id: string): Promise<PortafolioDto> {
  const portafolio = await buscarPortafolio(id);
  if (!portafolio) throw HttpError.notFound('Cliente no encontrado');
  return portafolio;
}
