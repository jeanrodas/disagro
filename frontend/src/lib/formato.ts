import type { FechaIso, Monto } from '../types/api'

/**
 * Formatea un monto del backend ("1250.00") como "Q1,250.00".
 * Trabaja sobre el string, sin pasar por number: el valor que se muestra es
 * exactamente el que envió el backend.
 */
export function formatearQuetzales(monto: Monto): string {
  const [entero = '0', decimales = ''] = monto.trim().split('.')
  const negativo = entero.startsWith('-')
  const digitos = (negativo ? entero.slice(1) : entero).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negativo ? '-' : ''}Q${digitos}.${decimales.padEnd(2, '0').slice(0, 2)}`
}

/** "2026-10-15T06:00:00.000Z" => "15 de octubre de 2026" (hora de Guatemala). */
export function formatearFecha(fecha: FechaIso): string {
  return new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Guatemala',
  }).format(new Date(fecha))
}

/**
 * Las claves de la ficha técnica las define el catálogo y cambian por item
 * ("tiempoEntregaDias", "dosisReferencia"...). Se separan las palabras y se
 * respetan las siglas: "NDVI" no se convierte en "Ndvi".
 */
export function formatearClaveFicha(clave: string): string {
  const palabras = clave.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ')
  return palabras
    .map((palabra, indice) => {
      if (indice === 0) return palabra.charAt(0).toUpperCase() + palabra.slice(1)
      return palabra === palabra.toUpperCase() ? palabra : palabra.toLowerCase()
    })
    .join(' ')
}

/** Los valores de la ficha pueden ser texto, número o lista. */
export function formatearValorFicha(valor: unknown): string {
  if (Array.isArray(valor)) return valor.map((elemento) => String(elemento)).join(' · ')
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'object') return JSON.stringify(valor)
  return String(valor)
}
