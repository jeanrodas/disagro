/**
 * Tipos de las respuestas del backend.
 * Los montos viajan como string con 2 decimales ("850.00") para no perder
 * precisión: se formatean para mostrar, nunca se operan como number.
 */

export type TipoItem = 'SERVICIO' | 'PRODUCTO'

export interface CategoriaResumen {
  id: string
  nombre: string
}

export interface Item {
  id: string
  nombre: string
  descripcion: string
  precio: string
  tipo: TipoItem
  imagenUrl: string
  beneficios: string[]
  fichaTecnica: Record<string, unknown> | null
  categoria: CategoriaResumen
}

export interface RespuestaItems {
  total: number
  items: Item[]
}

export interface Categoria extends CategoriaResumen {
  tipo: TipoItem
  totalItems: number
}

export interface RespuestaCategorias {
  total: number
  categorias: Categoria[]
}
