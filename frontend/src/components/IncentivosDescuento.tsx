import { useEffect, useRef, useState } from 'react'
import {
  MINIMO_PRODUCTOS_CINCO_POR_CIENTO,
  MINIMO_PRODUCTOS_TRES_POR_CIENTO,
  MINIMO_SERVICIOS,
  SUMA_SERVICIOS_MAYOR_A_CENTAVOS,
  aMonto,
  progresoProductos,
  progresoServicios,
  type DescuentosPreview,
  type NivelDescuento,
  type ProgresoNivel,
  type ResumenPreview,
} from '../lib/descuentos-preview'
import { formatearQuetzales } from '../lib/formato'
import { TarjetaIncentivo } from './TarjetaIncentivo'

interface Props {
  descuentos: DescuentosPreview
}

/**
 * Relleno de la barra (0..1). Es PRESENTACIÓN, no una regla: la barra reparte el
 * recorrido en dos mitades, 0%→3% y 3%→5%. Usa los umbrales exportados por
 * descuentos-preview en vez de repetir los números, para que si cambian allá
 * (siguiendo al backend) la barra siga marcando el punto correcto.
 */
function rellenoServicios(resumen: ResumenPreview, { nivel }: ProgresoNivel): number {
  if (nivel === 0) return (resumen.cantidad / MINIMO_SERVICIOS) * 0.5
  if (nivel === 1) {
    const objetivo = SUMA_SERVICIOS_MAYOR_A_CENTAVOS + 1 // el primer centavo que ya da 5%
    return 0.5 + Math.min(resumen.sumaCentavos / objetivo, 1) * 0.5
  }
  return 1
}

function rellenoProductos(resumen: ResumenPreview, { nivel }: ProgresoNivel): number {
  if (nivel === 0) return (resumen.cantidad / MINIMO_PRODUCTOS_TRES_POR_CIENTO) * 0.5
  if (nivel === 1) {
    const tramo = MINIMO_PRODUCTOS_CINCO_POR_CIENTO - MINIMO_PRODUCTOS_TRES_POR_CIENTO
    return 0.5 + ((resumen.cantidad - MINIMO_PRODUCTOS_TRES_POR_CIENTO) / tramo) * 0.5
  }
  return 1
}

const MAXIMO_DESBLOQUEADO = '¡Descuento máximo desbloqueado!'

/** Textos del handoff. El "cuánto falta" viene calculado; aquí solo se redacta. */
function nudgeServicios({ nivel, itemsFaltantes, centavosFaltantes }: ProgresoNivel): string {
  if (nivel === 0) {
    return itemsFaltantes === 1 ? 'Agrega 1 servicio más para 3%' : `Agrega ${itemsFaltantes} servicios para 3%`
  }
  if (nivel === 1) return `${formatearQuetzales(aMonto(centavosFaltantes))} más en servicios para 5%`
  return MAXIMO_DESBLOQUEADO
}

function nudgeProductos({ nivel, itemsFaltantes }: ProgresoNivel): string {
  if (nivel === 0) {
    return itemsFaltantes === 1 ? 'Agrega 1 producto más para 3%' : `Agrega ${itemsFaltantes} productos para 3%`
  }
  if (nivel === 1) return `${itemsFaltantes} producto${itemsFaltantes === 1 ? '' : 's'} más para 5%`
  return MAXIMO_DESBLOQUEADO
}

/**
 * Enciende la celebración durante 900 ms cuando el nivel SUBE.
 *
 * Al bajar no celebra: quitar un item no es un logro. En el primer render tampoco,
 * porque el nivel de partida se guarda como "anterior" sin comparar; así quien
 * vuelve al formulario con una selección ya hecha no ve fuegos artificiales.
 */
function useCelebracion(nivel: NivelDescuento): boolean {
  const anterior = useRef(nivel)
  const [celebrar, setCelebrar] = useState(false)

  useEffect(() => {
    const subio = nivel > anterior.current
    anterior.current = nivel
    if (!subio) return

    // Intencionado: el nivel viene de la selección del usuario y la celebración es
    // un efecto temporal que se apaga solo. No se puede derivar en render porque
    // depende de comparar con el valor anterior y de un temporizador.
    // oxlint-disable-next-line react/set-state-in-effect
    setCelebrar(true)
    const temporizador = setTimeout(() => setCelebrar(false), 900)
    return () => clearTimeout(temporizador)
  }, [nivel])

  return celebrar
}

/**
 * Los dos incentivos de descuento, uno por tipo. Deriva nivel y porcentaje de
 * descuentos-preview (la única réplica de las reglas del backend en el frontend)
 * y añade solo lo de presentación: relleno de la barra, textos y celebración.
 */
export function IncentivosDescuento({ descuentos }: Props) {
  const servicios = progresoServicios(descuentos.servicios)
  const productos = progresoProductos(descuentos.productos)
  const celebrarServicios = useCelebracion(servicios.nivel)
  const celebrarProductos = useCelebracion(productos.nivel)

  // Dos columnas desde `sm`, una en móvil.
  //
  // El handoff usaba auto-fit con minmax(280px, 1fr), pero aquí el contenedor es la
  // columna de selección del formulario, que en escritorio mide ~472px: dos columnas
  // de 280px más el gap piden 578px, así que auto-fit colapsaba a una sola y las
  // tarjetas quedaban enormes y la segunda fuera de vista. Con el breakpoint, cada
  // tarjeta ocupa ~227px en escritorio y la fila entra completa.
  return (
    <div
      className="grid grid-cols-1 gap-3 bg-disagro-campo px-3.5 py-4 sm:grid-cols-2 sm:gap-[18px]"
      data-testid="incentivos-descuento"
    >
      <TarjetaIncentivo
        tipo="Servicios"
        nivel={servicios.nivel}
        porcentaje={servicios.porcentaje}
        relleno={rellenoServicios(descuentos.servicios, servicios)}
        nudge={nudgeServicios(servicios)}
        celebrar={celebrarServicios}
      />
      <TarjetaIncentivo
        tipo="Productos"
        nivel={productos.nivel}
        porcentaje={productos.porcentaje}
        relleno={rellenoProductos(descuentos.productos, productos)}
        nudge={nudgeProductos(productos)}
        celebrar={celebrarProductos}
      />
    </div>
  )
}
