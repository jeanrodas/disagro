import type { DescuentosPreview } from '../lib/descuentos-preview'
import type { Item, TipoItem } from '../types/api'
import { IncentivosDescuento } from './IncentivosDescuento'
import { TarjetaItem } from './TarjetaItem'

export type FiltroTipo = 'TODOS' | TipoItem

interface Props {
  items: Item[]
  cargando: boolean
  seleccionados: Set<string>
  busqueda: string
  filtro: FiltroTipo
  descuentos: DescuentosPreview
  /** Con el email todavía inválido, el panel se bloquea. */
  bloqueado: boolean
  onBuscar: (texto: string) => void
  onFiltrar: (filtro: FiltroTipo) => void
  onAlternar: (id: string) => void
}

const FILTROS: { valor: FiltroTipo; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'SERVICIO', etiqueta: 'Servicios' },
  { valor: 'PRODUCTO', etiqueta: 'Productos' },
]

export function PanelSeleccion({
  items,
  cargando,
  seleccionados,
  busqueda,
  filtro,
  descuentos,
  bloqueado,
  onBuscar,
  onFiltrar,
  onAlternar,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
      {/* Buscador y filtros */}
      <div
        className="px-4 pt-4 pb-1.5 transition-opacity"
        style={{ opacity: bloqueado ? 0.5 : 1, pointerEvents: bloqueado ? 'none' : 'auto' }}
      >
        <div className="flex items-center gap-2 rounded-full bg-disagro-campo px-4 py-2.5">
          <span className="text-disagro-tenue" aria-hidden="true">
            ⌕
          </span>
          <input
            value={busqueda}
            onChange={(evento) => onBuscar(evento.target.value)}
            placeholder="Buscar servicios y productos"
            aria-label="Buscar servicios y productos"
            className="flex-1 bg-transparent text-sm text-disagro-tinta outline-none placeholder:text-disagro-tenue"
          />
        </div>

        <div className="mt-3 flex gap-1.5">
          {FILTROS.map(({ valor, etiqueta }) => (
            <button
              key={valor}
              type="button"
              onClick={() => onFiltrar(valor)}
              aria-pressed={filtro === valor}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filtro === valor
                  ? 'bg-disagro-verde text-white'
                  : 'bg-disagro-campo text-disagro-texto hover:bg-disagro-borde'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div
        className="max-h-[320px] overflow-y-auto py-1.5 transition-opacity"
        style={{ opacity: bloqueado ? 0.5 : 1, pointerEvents: bloqueado ? 'none' : 'auto' }}
        data-testid="lista-items"
      >
        {cargando && <p className="px-4 py-8 text-center text-sm text-disagro-tenue">Cargando el catálogo…</p>}
        {!cargando && items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-disagro-tenue">Sin resultados para tu búsqueda.</p>
        )}
        {items.map((item) => (
          <TarjetaItem
            key={item.id}
            item={item}
            seleccionado={seleccionados.has(item.id)}
            onAlternar={onAlternar}
          />
        ))}
      </div>

      {/* Incentivo de descuento: cuánto lleva y cuánto le falta para el siguiente nivel */}
      <div style={{ opacity: bloqueado ? 0.5 : 1 }} className="transition-opacity">
        <IncentivosDescuento descuentos={descuentos} />
      </div>

      {/* Bloqueo hasta que el email sea válido */}
      {bloqueado && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-disagro-campo/70 px-6 text-center backdrop-blur-[2px]"
          data-testid="bloqueo-seleccion"
        >
          <span className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg">
            🔒
          </span>
          <p className="font-titulo text-[15px] font-bold text-disagro-tinta">Primero identifícate</p>
          <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-disagro-suave">
            Ingresa un <b>email válido</b> para habilitar la selección de servicios y productos.
          </p>
        </div>
      )}
    </div>
  )
}
