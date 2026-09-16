import { formatearClaveFicha, formatearQuetzales, formatearValorFicha } from '../lib/formato'
import type { Item } from '../types/api'
import { IconoCategoria } from './IconoCategoria'

interface Props {
  item: Item
}

/** Tarjeta rica de un item elegido: descripción, beneficios y ficha técnica. */
export function TarjetaItemDetalle({ item }: Props) {
  const esServicio = item.tipo === 'SERVICIO'
  const ficha = Object.entries(item.fichaTecnica ?? {})

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
      {/* Cabecera de color con el icono de su categoría */}
      <div
        className={`relative flex h-28 items-center justify-center ${
          esServicio
            ? 'bg-linear-135 from-disagro-verde-claro to-disagro-lima'
            : 'bg-linear-135 from-disagro-lima-claro to-[#e0e97a]'
        }`}
      >
        <span className="absolute top-3.5 left-3.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold tracking-wide text-disagro-tinta uppercase">
          {esServicio ? 'Servicio' : 'Producto'}
        </span>
        <IconoCategoria categoria={item.categoria.nombre} className="h-12 w-12 text-white" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-titulo text-[15px] leading-snug font-bold text-disagro-tinta">{item.nombre}</h3>
          <span className="font-titulo text-[15px] font-bold whitespace-nowrap text-disagro-verde">
            {formatearQuetzales(item.precio)}
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-disagro-suave">{item.descripcion}</p>

        {item.beneficios.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {item.beneficios.map((beneficio) => (
              <li key={beneficio} className="flex gap-2 text-[12.5px] text-disagro-texto">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-disagro-verde" aria-hidden="true" />
                {beneficio}
              </li>
            ))}
          </ul>
        )}

        {ficha.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-disagro-borde pt-3 text-[11.5px]">
            {ficha.map(([clave, valor]) => (
              <div key={clave} className="flex gap-1.5">
                <dt className="font-semibold text-disagro-texto">{formatearClaveFicha(clave)}</dt>
                <dd className="text-disagro-tenue">{formatearValorFicha(valor)}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-auto pt-3 text-[11px] text-disagro-tenue">{item.categoria.nombre}</p>
      </div>
    </article>
  )
}
