/**
 * Tipos de las respuestas del backend (Express + Prisma) de la Feria Disagro.
 *
 * Dos reglas que valen para todo el archivo:
 *
 * 1. Los montos viajan como STRING con 2 decimales ("1250.00"). En la BD son
 *    Decimal y el backend los serializa así a propósito: convertirlos a number
 *    en el frontend reintroduce los errores de coma flotante que se evitaron en
 *    el cálculo (0.1 + 0.2 !== 0.3). Se formatean para mostrar, nunca se operan.
 * 2. Las fechas viajan como STRING en formato ISO 8601 UTC, porque JSON no tiene
 *    tipo fecha. Se convierten a Date solo en el momento de formatearlas.
 */

export type TipoItem = 'SERVICIO' | 'PRODUCTO'
export type EstadoCodigo = 'EMITIDO' | 'CANJEADO'
/** Los únicos porcentajes que emite el backend. */
export type PorcentajeDescuento = 0 | 3 | 5

/** Monto en quetzales con 2 decimales, ej. "1250.00". */
export type Monto = string
/** Fecha ISO 8601 en UTC, ej. "2026-10-15T06:00:00.000Z". */
export type FechaIso = string

// ─────────────────────────────── Catálogo ───────────────────────────────

export interface CategoriaResumen {
  id: string
  nombre: string
}

export interface Item {
  id: string
  nombre: string
  descripcion: string
  precio: Monto
  tipo: TipoItem
  imagenUrl: string
  beneficios: string[]
  /** Ficha libre en JSON: las claves cambian según el item (presentación, dosis, cultivos…). */
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

export interface FiltrosItems {
  tipo?: TipoItem
  /** Nombre (sin distinguir mayúsculas) o id de la categoría. */
  categoria?: string
  /** Texto a buscar en nombre o descripción. */
  buscar?: string
}

// ──────────────────────── Cliente, portafolio y códigos ────────────────────────

export interface Cliente {
  id: string
  nombre: string
  apellidos: string
  email: string
  fechaEvento: FechaIso
  confirmadoEn: FechaIso
}

/** Cuántos items de ese tipo eligió el cliente, cuánto suman y qué porcentaje le tocó. */
export interface ResumenDescuento {
  cantidad: number
  suma: Monto
  porcentaje: PorcentajeDescuento
}

export interface Descuentos {
  servicios: ResumenDescuento
  productos: ResumenDescuento
}

export interface CodigoDescuento {
  codigo: string
  tipo: TipoItem
  porcentaje: number
  estado: EstadoCodigo
  creadoEn: FechaIso
  /** null mientras el código no se haya usado. */
  canjeadoEn: FechaIso | null
}

export interface TotalesPorTipo {
  subtotal: Monto
  porcentaje: PorcentajeDescuento
  descuento: Monto
  total: Monto
}

export interface Totales {
  servicios: TotalesPorTipo
  productos: TotalesPorTipo
  subtotal: Monto
  descuento: Monto
  total: Monto
}

/** Lo que devuelven GET /api/portafolio y GET /api/admin/clientes/:id. */
export interface Portafolio {
  cliente: Cliente
  items: Item[]
  descuentos: Descuentos
  codigos: CodigoDescuento[]
  totales: Totales
}

// ───────────────────────────── Confirmación ─────────────────────────────

export interface DatosConfirmacion {
  nombre: string
  apellidos: string
  email: string
  /** Solo la fecha, formato AAAA-MM-DD. No puede ser anterior a hoy. */
  fechaEvento: string
  /** Ids de los items elegidos, sin repetir, al menos uno. */
  itemIds: string[]
}

/** Códigos destacados al inicio de la respuesta, para mostrarlos apenas confirma. */
export interface CodigoEmitido {
  codigo: string
  tipo: TipoItem
  porcentaje: number
}

export interface RespuestaConfirmacion {
  mensaje: string
  codigos: CodigoEmitido[]
  /** URL del portafolio en el frontend (sin token: la sesión va en la cookie). */
  portafolioUrl: string
  portafolio: Portafolio
}

// ──────────────────────────── Canje de códigos ────────────────────────────

export interface CodigoCanjeado {
  codigo: string
  tipo: TipoItem
  porcentaje: number
  estado: 'CANJEADO'
  canjeadoEn: FechaIso
}

export interface RespuestaCanje {
  mensaje: string
  codigo: CodigoCanjeado
}

// ────────────────────────────── Panel de admin ──────────────────────────────

export interface Admin {
  usuario: string
}

/** Respuesta de POST /api/admin/login y GET /api/admin/me. */
export interface RespuestaAdmin {
  admin: Admin
}

export interface ClienteResumen {
  id: string
  nombre: string
  apellidos: string
  email: string
  fechaEvento: FechaIso
  confirmadoEn: FechaIso
  cantidadItems: number
  /** Solo los porcentajes; el detalle completo está en GET /api/admin/clientes/:id. */
  descuentos: { servicios: PorcentajeDescuento; productos: PorcentajeDescuento }
  cantidadCodigos: number
  /** Total con descuento aplicado. */
  total: Monto
}

export interface Paginacion {
  page: number
  limit: number
  total: number
  totalPaginas: number
}

export interface RespuestaClientes {
  data: ClienteResumen[]
  paginacion: Paginacion
}

export interface FiltrosClientes {
  page?: number
  /** Máximo 100; el backend responde 400 si se pide más. */
  limit?: number
  /** Busca en nombre, apellidos o email. */
  buscar?: string
}

export interface ItemMasElegido {
  itemId: string
  nombre: string
  tipo: TipoItem
  /** Cuántos clientes eligieron este item. */
  selecciones: number
}

export interface NivelDescuento {
  porcentaje: PorcentajeDescuento
  clientes: number
}

export interface Metricas {
  totalClientes: number
  ingresos: {
    subtotal: Monto
    descuento: Monto
    /** Suma de los totales con descuento de todos los clientes. */
    ingresoPotencial: Monto
  }
  itemsMasElegidos: ItemMasElegido[]
  nivelesDescuento: {
    servicios: NivelDescuento[]
    productos: NivelDescuento[]
  }
  codigos: {
    emitidos: number
    canjeados: number
    total: number
  }
}

// ─────────────────────────────── Errores ───────────────────────────────

/** Un campo inválido dentro de un 400 de validación. */
export interface DetalleValidacion {
  campo: string
  mensaje: string
}

/** Forma del cuerpo de error del backend, igual en todos los endpoints. */
export interface CuerpoError {
  error: {
    message: string
    details?: DetalleValidacion[] | Record<string, unknown>
  }
}

/** details del 409 de POST /api/confirmar. */
export interface DetalleCorreoYaConfirmado {
  portafolioUrl: string
}

/** details del 409 de POST /api/codigos/canjear. */
export interface DetalleCodigoYaUtilizado {
  codigo: string
  canjeadoEn: FechaIso | null
}
