import { describe, expect, it } from 'vitest'
import { formatearClaveFicha, formatearFecha, formatearQuetzales, formatearValorFicha } from './formato'

describe('formatearQuetzales', () => {
  it.each([
    ['850.00', 'Q850.00'],
    ['1250.00', 'Q1,250.00'],
    ['36815.00', 'Q36,815.00'],
    ['0.00', 'Q0.00'],
    ['4603.55', 'Q4,603.55'],
  ])('%s => %s', (monto, esperado) => {
    expect(formatearQuetzales(monto)).toBe(esperado)
  })

  it('no pierde precisión: el valor mostrado es el string del backend', () => {
    expect(formatearQuetzales('9007199254740993.99')).toBe('Q9,007,199,254,740,993.99')
  })
})

describe('formatearFecha', () => {
  it('muestra la fecha del evento en hora de Guatemala', () => {
    expect(formatearFecha('2026-10-15T06:00:00.000Z')).toBe('15 de octubre de 2026')
  })
})

describe('formatearClaveFicha', () => {
  it.each([
    ['tiempoEntregaDias', 'Tiempo entrega dias'],
    ['dosisReferencia', 'Dosis referencia'],
    ['presentacion', 'Presentacion'],
    ['areaIncluida', 'Area incluida'],
  ])('%s => %s', (clave, esperado) => {
    expect(formatearClaveFicha(clave)).toBe(esperado)
  })

  it('respeta las siglas', () => {
    expect(formatearClaveFicha('indicesNDVI')).toBe('Indices NDVI')
  })
})

describe('formatearValorFicha', () => {
  it('une las listas con separador', () => {
    expect(formatearValorFicha(['NDVI', 'NDRE'])).toBe('NDVI · NDRE')
  })

  it('convierte números y textos', () => {
    expect(formatearValorFicha(7)).toBe('7')
    expect(formatearValorFicha('Saco de 50 kg')).toBe('Saco de 50 kg')
  })

  it('no rompe con valores ausentes', () => {
    expect(formatearValorFicha(null)).toBe('—')
    expect(formatearValorFicha(undefined)).toBe('—')
  })
})
