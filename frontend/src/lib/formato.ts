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
