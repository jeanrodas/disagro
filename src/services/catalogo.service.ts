import type { Prisma, TipoItem } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { escaparComodinesLike } from '../utils/like';
import { esUuid } from '../utils/uuid';

/**
 * Consultas del catálogo público.
 * No conoce Express: recibe filtros ya validados y devuelve datos planos,
 * así que se puede reutilizar desde otro servicio o probar sin HTTP.
 */

export interface FiltrosCatalogo {
  tipo?: TipoItem | undefined;
  categoria?: string | undefined;
  buscar?: string | undefined;
}

export const itemSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  precio: true,
  tipo: true,
  imagenUrl: true,
  beneficios: true,
  fichaTecnica: true,
  categoria: { select: { id: true, nombre: true } },
} satisfies Prisma.ItemSelect;

export type ItemConCategoria = Prisma.ItemGetPayload<{ select: typeof itemSelect }>;

/** El precio viaja como string con 2 decimales ("850.00") para no perder precisión en JSON. */
export type ItemDto = Omit<ItemConCategoria, 'precio'> & { precio: string };

export function aItemDto({ precio, ...item }: ItemConCategoria): ItemDto {
  return { ...item, precio: precio.toFixed(2) };
}

export async function listarItems(filtros: FiltrosCatalogo): Promise<ItemDto[]> {
  const where: Prisma.ItemWhereInput = {};

  if (filtros.tipo) {
    where.tipo = filtros.tipo;
  }

  if (filtros.categoria) {
    where.categoria = esUuid(filtros.categoria)
      ? { id: filtros.categoria }
      : { nombre: { equals: filtros.categoria, mode: 'insensitive' } };
  }

  if (filtros.buscar) {
    const texto = escaparComodinesLike(filtros.buscar);
    where.OR = [
      { nombre: { contains: texto, mode: 'insensitive' } },
      { descripcion: { contains: texto, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    select: itemSelect,
    orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
  });

  return items.map(aItemDto);
}

export interface CategoriaDto {
  id: string;
  nombre: string;
  tipo: TipoItem;
  totalItems: number;
}

export async function listarCategorias(): Promise<CategoriaDto[]> {
  const categorias = await prisma.categoria.findMany({
    select: { id: true, nombre: true, tipo: true, _count: { select: { items: true } } },
    orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
  });

  return categorias.map(({ _count, ...categoria }) => ({ ...categoria, totalItems: _count.items }));
}
