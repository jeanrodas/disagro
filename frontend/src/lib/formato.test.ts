import { describe, expect, it } from 'vitest'
import { formatearFecha, formatearQuetzales } from './formato'

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
