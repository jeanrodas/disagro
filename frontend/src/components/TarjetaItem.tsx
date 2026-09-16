import { formatearQuetzales } from '../lib/formato'
import type { Item } from '../types/api'
import { IconoCategoria } from './IconoCategoria'

interface Props {
  item: Item
  seleccionado: boolean
  onAlternar: (id: string) => void
}

/** Fila seleccionable del catálogo: icono de su categoría, nombre, tipo y precio. */
export function TarjetaItem({ item, seleccionado, onAlternar }: Props) {
  const esServicio = item.tipo === 'SERVICIO'

  return (
    <button
      type="button"
      onClick={() => onAlternar(item.id)}
      aria-pressed={seleccionado}
      className={`flex w-full items-center gap-3 border-b border-disagro-borde/70 px-4 py-3 text-left transition last:border-b-0 hover:bg-disagro-campo ${
        seleccionado ? 'bg-disagro-verde/5' : ''
      }`}
    >
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-[1.5px] text-[11px] font-bold text-white transition ${
          seleccionado ? 'border-disagro-verde bg-disagro-verde' : 'border-disagro-borde bg-white'
        }`}
      >
        {seleccionado ? '✓' : ''}
      </span>

      <span
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
          esServicio ? 'bg-disagro-verde/10 text-disagro-verde' : 'bg-disagro-lima/15 text-disagro-lima-oscuro'
        }`}
      >
        <IconoCategoria categoria={item.categoria.nombre} className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-disagro-tinta">{item.nombre}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
              esServicio ? 'bg-disagro-verde/10 text-disagro-verde-oscuro' : 'bg-disagro-lima/20 text-disagro-lima-oscuro'
            }`}
          >
            {esServicio ? 'Servicio' : 'Producto'}
          </span>
          <span className="truncate text-[11px] text-disagro-tenue">{item.categoria.nombre}</span>
        </span>
      </span>

      <span className="flex-none text-sm font-bold text-disagro-tinta">{formatearQuetzales(item.precio)}</span>
    </button>
  )
}
