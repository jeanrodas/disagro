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

/** Texto de ayuda bajo cada tarjeta: qué falta para llegar al siguiente descuento. */
export function notaServicios({ cantidad, sumaCentavos, porcentaje }: ResumenPreview): string {
  if (cantidad === 0) return 'Elige 2 servicios para tu descuento'
  if (cantidad < MINIMO_SERVICIOS) return `${cantidad} servicio · falta ${MINIMO_SERVICIOS - cantidad} para el 3%`
  if (porcentaje === 3) {
    const faltan = SUMA_SERVICIOS_MAYOR_A_CENTAVOS - sumaCentavos + 1
    return `${cantidad} servicios · ${aMonto(faltan)} más para el 5%`
  }
  return `${cantidad} servicios · más de Q1,500`
}

export function notaProductos({ cantidad, porcentaje }: ResumenPreview): string {
  if (cantidad === 0) return 'Elige 3 productos para tu descuento'
  if (porcentaje === 0) return `${cantidad} producto(s) · faltan ${MINIMO_PRODUCTOS_TRES_POR_CIENTO - cantidad} para el 3%`
  if (porcentaje === 3) return `${cantidad} productos · faltan ${MINIMO_PRODUCTOS_CINCO_POR_CIENTO - cantidad} para el 5%`
  return `${cantidad} productos`
}
