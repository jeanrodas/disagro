import { describe, expect, it } from 'vitest'
import {
  aCentavos,
  aMonto,
  calcularDescuentosPreview,
  nivelDe,
  porcentajeProductos,
  porcentajeServicios,
  progresoProductos,
  progresoServicios,
  type ItemPreview,
} from './descuentos-preview'

/**
 * Los casos son los MISMOS que los del test del backend (src/domain/descuentos.test.ts).
 * Si alguien cambia las reglas en un lado y no en el otro, este archivo falla.
 */

const servicio = (precio: string): ItemPreview => ({ tipo: 'SERVICIO', precio })
const producto = (precio = '100.00'): ItemPreview => ({ tipo: 'PRODUCTO', precio })
const nProductos = (n: number, precio?: string) => Array.from({ length: n }, () => producto(precio))

describe('conversión a centavos (sin decimales flotantes)', () => {
  it.each([
    ['1250.00', 125000],
    ['850.00', 85000],
    ['0.01', 1],
    ['1500', 150000],
    ['1500.5', 150050],
  ])('aCentavos(%s) => %i', (monto, esperado) => {
    expect(aCentavos(monto)).toBe(esperado)
  })

  it('ida y vuelta: aMonto(aCentavos(x)) conserva el valor', () => {
    expect(aMonto(aCentavos('3350.00'))).toBe('3350.00')
    expect(aMonto(aCentavos('0.05'))).toBe('0.05')
  })

  it('rechaza montos que no son válidos', () => {
    expect(() => aCentavos('abc')).toThrow(RangeError)
    expect(() => aCentavos('12.345')).toThrow(RangeError)
  })
})

describe('descuento de SERVICIOS (mismas reglas que el backend)', () => {
  it('0 y 1 servicio => 0%', () => {
    expect(calcularDescuentosPreview([]).servicios.porcentaje).toBe(0)
    expect(calcularDescuentosPreview([servicio('2500.00')]).servicios.porcentaje).toBe(0)
  })

  it('2 servicios con suma menor a 1500 => 3%', () => {
    const { servicios } = calcularDescuentosPreview([servicio('750.00'), servicio('680.00')])
    expect(servicios.suma).toBe('1430.00')
    expect(servicios.porcentaje).toBe(3)
  })

  it('frontera: suma EXACTAMENTE 1500.00 => 3% (la regla dice "mayor a", no "mayor o igual")', () => {
    const { servicios } = calcularDescuentosPreview([servicio('750.00'), servicio('750.00')])
    expect(servicios.suma).toBe('1500.00')
    expect(servicios.porcentaje).toBe(3)
  })

  it('frontera: suma 1500.01 => 5%', () => {
    expect(calcularDescuentosPreview([servicio('750.00'), servicio('750.01')]).servicios.porcentaje).toBe(5)
  })

  it('2 servicios con suma > 1500 => 5%', () => {
    const { servicios } = calcularDescuentosPreview([servicio('850.00'), servicio('950.00')])
    expect(servicios.suma).toBe('1800.00')
    expect(servicios.porcentaje).toBe(5)
  })

  it('en centavos: 524.07 + 500.00 + 475.93 = 1500.00 exacto => 3%', () => {
    // Con decimales, la misma suma da 1500.0000000000002 y daría 5% por error
    expect(524.07 + 500.0 + 475.93).toBeGreaterThan(1500)

    const { servicios } = calcularDescuentosPreview([servicio('524.07'), servicio('500.00'), servicio('475.93')])
    expect(servicios.sumaCentavos).toBe(150000)
    expect(servicios.porcentaje).toBe(3)
  })

  it.each([
    [0, 0, 0],
    [1, 999900, 0],
    [2, 149999, 3],
    [2, 150000, 3],
    [2, 150001, 5],
    [7, 893000, 5],
  ])('porcentajeServicios(%i, %i centavos) => %i%%', (cantidad, centavos, esperado) => {
    expect(porcentajeServicios(cantidad, centavos)).toBe(esperado)
  })
})

describe('descuento de PRODUCTOS (mismas reglas que el backend)', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 3],
    [4, 3],
    [5, 5],
    [6, 5],
    [10, 5],
  ])('%i productos => %i%%', (cantidad, esperado) => {
    expect(calcularDescuentosPreview(nProductos(cantidad)).productos.porcentaje).toBe(esperado)
    expect(porcentajeProductos(cantidad)).toBe(esperado)
  })

  it('el porcentaje de productos depende de la cantidad, no del precio', () => {
    expect(calcularDescuentosPreview(nProductos(5, '0.01')).productos.porcentaje).toBe(5)
    expect(calcularDescuentosPreview(nProductos(2, '1250.00')).productos.porcentaje).toBe(0)
  })
})

describe('servicios y productos son independientes', () => {
  it('selección real del catálogo: 2 servicios (Q3350) + 5 productos => 5% y 5%', () => {
    const resultado = calcularDescuentosPreview([
      servicio('850.00'),
      servicio('2500.00'),
      producto('485.00'),
      producto('560.00'),
      producto('420.00'),
      producto('390.00'),
      producto('340.00'),
    ])
    expect(resultado.servicios).toMatchObject({ cantidad: 2, suma: '3350.00', porcentaje: 5 })
    expect(resultado.productos).toMatchObject({ cantidad: 5, suma: '2195.00', porcentaje: 5 })
  })

  it('4 servicios + 2 productos => los servicios no cuentan para el umbral de productos', () => {
    const resultado = calcularDescuentosPreview([
      servicio('850.00'),
      servicio('750.00'),
      servicio('950.00'),
      servicio('680.00'),
      ...nProductos(2),
    ])
    expect(resultado.servicios.porcentaje).toBe(5)
    expect(resultado.productos.porcentaje).toBe(0)
  })
})

describe('nivel (lectura del porcentaje, no una regla nueva)', () => {
  it.each([
    [0, 0],
    [3, 1],
    [5, 2],
  ] as const)('%i%% => nivel %i', (porcentaje, esperado) => {
    expect(nivelDe(porcentaje)).toBe(esperado)
  })
})

describe('progreso de SERVICIOS hacia el siguiente nivel', () => {
  const resumen = (items: ItemPreview[]) => calcularDescuentosPreview(items).servicios

  it('sin servicios: faltan los 2 del umbral', () => {
    expect(progresoServicios(resumen([]))).toMatchObject({ nivel: 0, itemsFaltantes: 2, centavosFaltantes: 0 })
  })

  it('con 1 servicio: falta 1, por caro que sea', () => {
    expect(progresoServicios(resumen([servicio('9999.00')]))).toMatchObject({ nivel: 0, itemsFaltantes: 1 })
  })

  it('en el nivel 1 lo que falta es SUMA, no cantidad', () => {
    const progreso = progresoServicios(resumen([servicio('750.00'), servicio('680.00')]))
    expect(progreso).toMatchObject({ nivel: 1, itemsFaltantes: 0 })
    // Q1,430.00 de suma: faltan Q70.00 para llegar a Q1,500 y un centavo más para superarlo
    expect(progreso.centavosFaltantes).toBe(7001)
    expect(aMonto(progreso.centavosFaltantes)).toBe('70.01')
  })

  it('frontera: con la suma EXACTA en Q1,500.00 todavía falta un centavo', () => {
    const progreso = progresoServicios(resumen([servicio('750.00'), servicio('750.00')]))
    expect(progreso.nivel).toBe(1)
    expect(progreso.centavosFaltantes).toBe(1)
  })

  it('en el máximo no falta nada', () => {
    expect(progresoServicios(resumen([servicio('850.00'), servicio('950.00')]))).toMatchObject({
      nivel: 2,
      itemsFaltantes: 0,
      centavosFaltantes: 0,
    })
  })
})

describe('progreso de PRODUCTOS hacia el siguiente nivel', () => {
  const resumen = (cantidad: number) => calcularDescuentosPreview(nProductos(cantidad)).productos

  it.each([
    [0, 0, 3],
    [1, 0, 2],
    [2, 0, 1],
    [3, 1, 2],
    [4, 1, 1],
    [5, 2, 0],
    [9, 2, 0],
  ])('%i productos => nivel %i, faltan %i', (cantidad, nivel, faltan) => {
    expect(progresoProductos(resumen(cantidad))).toMatchObject({ nivel, itemsFaltantes: faltan })
  })

  it('a los productos nunca les falta dinero, solo cantidad', () => {
    expect(progresoProductos(resumen(2)).centavosFaltantes).toBe(0)
  })
})
