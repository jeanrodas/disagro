import type { Prisma, TipoItem } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Prisma traduce `contains` a ILIKE '%texto%' sin escapar los comodines de LIKE:
 * sin esto, buscar "%" devolvería todo el catálogo y "_" cualquier carácter.
 */
const escaparComodinesLike = (texto: string) => texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);

const itemSelect = {
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

type ItemConCategoria = Prisma.ItemGetPayload<{ select: typeof itemSelect }>;

/** El precio viaja como string con 2 decimales ("850.00") para no perder precisión en JSON. */
export type ItemDto = Omit<ItemConCategoria, 'precio'> & { precio: string };

export async function listarItems(filtros: FiltrosCatalogo): Promise<ItemDto[]> {
  const where: Prisma.ItemWhereInput = {};

  if (filtros.tipo) {
    where.tipo = filtros.tipo;
  }

  if (filtros.categoria) {
    where.categoria = UUID.test(filtros.categoria)
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

  return items.map(({ precio, ...item }) => ({ ...item, precio: precio.toFixed(2) }));
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
