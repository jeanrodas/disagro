import type { Monto, TipoItem } from '../types/api'

/**
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  ESTAS REGLAS DEBEN COINCIDIR CON EL BACKEND (src/domain/descuentos.ts).   │
 * │  El cálculo OFICIAL y vinculante lo hace el backend al confirmar; esto es  │
 * │  SOLO una vista previa para que el cliente vea su descuento mientras       │
 * │  elige. Si las reglas cambian allá, hay que cambiarlas aquí: el test de    │
 * │  frontera (descuentos-preview.test.ts) usa los mismos casos que el test    │
 * │  del backend y falla si se desincronizan.                                  │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * SERVICIOS: >= 2 servicios y suma > Q1,500 => 5%; >= 2 => 3%; si no => 0%
 * PRODUCTOS: >= 5 => 5%; >= 3 => 3%; si no => 0%
 *
 * Los montos llegan como string ("1250.00") y se comparan en CENTAVOS enteros:
 * con números decimales, 524.07 + 500.00 + 475.93 da 1500.0000000000002 y la
 * frontera "suma > 1500" otorgaría 5% donde corresponde 3%.
 */

export const MINIMO_SERVICIOS = 2
/** La suma de servicios debe ser ESTRICTAMENTE mayor (>) a este valor para el 5%. */
export const SUMA_SERVICIOS_MAYOR_A_CENTAVOS = 150_000 // Q1,500.00
export const MINIMO_PRODUCTOS_TRES_POR_CIENTO = 3
export const MINIMO_PRODUCTOS_CINCO_POR_CIENTO = 5

export type PorcentajePreview = 0 | 3 | 5

export interface ItemPreview {
  tipo: TipoItem
  precio: Monto
}

export interface ResumenPreview {
  cantidad: number
  sumaCentavos: number
  /** La suma como string con 2 decimales, lista para formatear. */
  suma: Monto
  porcentaje: PorcentajePreview
}

export interface DescuentosPreview {
  servicios: ResumenPreview
  productos: ResumenPreview
}

/**
 * "1250.00" => 125000 centavos.
 * Number() sobre la parte entera es exacto (son enteros muy por debajo del límite
 * seguro de JavaScript); lo que nunca se hace es sumar los precios como decimales.
 */
export function aCentavos(monto: Monto): number {
  const limpio = monto.trim()
  if (!/^-?\d+(\.\d{1,2})?$/.test(limpio)) {
    throw new RangeError(`Monto inválido: ${monto}`)
  }
  const [entero = '0', decimales = ''] = limpio.split('.')
  const signo = entero.startsWith('-') ? -1 : 1
  const enteroAbsoluto = Math.abs(Number(entero))
  return signo * (enteroAbsoluto * 100 + Number(decimales.padEnd(2, '0')))
}

/** 125000 => "1250.00" */
export function aMonto(centavos: number): Monto {
  const signo = centavos < 0 ? '-' : ''
  const absolutos = Math.abs(centavos)
  return `${signo}${Math.trunc(absolutos / 100)}.${String(absolutos % 100).padStart(2, '0')}`
}

export function porcentajeServicios(cantidad: number, sumaCentavos: number): PorcentajePreview {
  if (cantidad >= MINIMO_SERVICIOS && sumaCentavos > SUMA_SERVICIOS_MAYOR_A_CENTAVOS) return 5
  if (cantidad >= MINIMO_SERVICIOS) return 3
  return 0
}

export function porcentajeProductos(cantidad: number): PorcentajePreview {
  if (cantidad >= MINIMO_PRODUCTOS_CINCO_POR_CIENTO) return 5
  if (cantidad >= MINIMO_PRODUCTOS_TRES_POR_CIENTO) return 3
  return 0
}

export function calcularDescuentosPreview(items: readonly ItemPreview[]): DescuentosPreview {
  const resumir = (tipo: TipoItem): ResumenPreview => {
    const delTipo = items.filter((item) => item.tipo === tipo)
    const sumaCentavos = delTipo.reduce((total, item) => total + aCentavos(item.precio), 0)
    return {
      cantidad: delTipo.length,
      sumaCentavos,
      suma: aMonto(sumaCentavos),
      porcentaje: tipo === 'SERVICIO' ? porcentajeServicios(delTipo.length, sumaCentavos) : porcentajeProductos(delTipo.length),
    }
  }

  return { servicios: resumir('SERVICIO'), productos: resumir('PRODUCTO') }
}

/* ───────────────────────────────────────────────────────────────────────────
 * Progreso hacia el siguiente descuento.
 *
 * Esto NO son reglas nuevas: el nivel es una lectura del porcentaje que ya
 * calcularon las funciones de arriba (0% = nivel 0, 3% = nivel 1, 5% = nivel 2),
 * y el "cuánto falta" es aritmética sobre los MISMOS umbrales exportados. Vive
 * aquí, y no en el componente que lo pinta, justamente para que siga habiendo
 * una sola réplica de las reglas del backend en todo el frontend.
 * ─────────────────────────────────────────────────────────────────────────── */

/** 0 = sin descuento · 1 = 3% · 2 = 5% (máximo). */
export type NivelDescuento = 0 | 1 | 2

/** El porcentaje que corresponde a cada nivel, por índice. */
export const PORCENTAJE_POR_NIVEL: readonly [0, 3, 5] = [0, 3, 5]

export function nivelDe(porcentaje: PorcentajePreview): NivelDescuento {
  if (porcentaje === 5) return 2
  if (porcentaje === 3) return 1
  return 0
}

export interface ProgresoNivel {
  nivel: NivelDescuento
  porcentaje: PorcentajePreview
  /** Items que faltan para el siguiente nivel. 0 si ya está en el máximo o si el salto no depende de la cantidad. */
  itemsFaltantes: number
  /** Centavos que faltan en la suma para el siguiente nivel. Solo aplica a servicios en el nivel 1. */
  centavosFaltantes: number
}

/**
 * Servicios: del nivel 0 al 1 falta CANTIDAD; del 1 al 2 falta SUMA.
 * El +1 centavo es la frontera estricta: la regla es "mayor a Q1,500", así que
 * con la suma exactamente en Q1,500.00 todavía falta un centavo.
 */
export function progresoServicios({ cantidad, sumaCentavos, porcentaje }: ResumenPreview): ProgresoNivel {
  const nivel = nivelDe(porcentaje)
  return {
    nivel,
    porcentaje,
    itemsFaltantes: nivel === 0 ? Math.max(0, MINIMO_SERVICIOS - cantidad) : 0,
    centavosFaltantes: nivel === 1 ? Math.max(0, SUMA_SERVICIOS_MAYOR_A_CENTAVOS - sumaCentavos + 1) : 0,
  }
}

/** Productos: los dos saltos dependen solo de la cantidad. */
export function progresoProductos({ cantidad, porcentaje }: ResumenPreview): ProgresoNivel {
  const nivel = nivelDe(porcentaje)
  const objetivo = nivel === 0 ? MINIMO_PRODUCTOS_TRES_POR_CIENTO : MINIMO_PRODUCTOS_CINCO_POR_CIENTO
  return {
    nivel,
    porcentaje,
    itemsFaltantes: nivel === 2 ? 0 : Math.max(0, objetivo - cantidad),
    centavosFaltantes: 0,
  }
}
