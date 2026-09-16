import { useState } from 'react'
import { formatearFecha } from '../lib/formato'
import type { CodigoDescuento } from '../types/api'

interface Props {
  codigo: CodigoDescuento
}

/** Tarjeta de un código de descuento, con botón para copiarlo. */
export function TarjetaCodigo({ codigo }: Props) {
  const [copiado, setCopiado] = useState(false)
  const esServicio = codigo.tipo === 'SERVICIO'
  const canjeado = codigo.estado === 'CANJEADO'

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo.codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // El navegador puede negar el portapapeles (permisos o contexto no seguro):
      // el código sigue visible en pantalla para copiarlo a mano.
    }
  }

  return (
    <div
      data-testid="tarjeta-codigo"
      className={`relative overflow-hidden rounded-3xl px-6 py-6 shadow-[0_28px_56px_-22px_rgba(23,155,68,0.6)] ${
        esServicio
          ? 'bg-linear-135 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro'
          : 'bg-linear-135 from-disagro-lima-oscuro via-disagro-lima to-disagro-lima-claro'
      }`}
    >
      <span className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-3">
        <span className={`text-xs font-bold tracking-wide uppercase ${esServicio ? 'text-[#d6f5df]' : 'text-[#20340f]'}`}>
          Descuento en {esServicio ? 'servicios' : 'productos'}
        </span>
        <span className="font-titulo text-3xl leading-none font-extrabold text-white">{codigo.porcentaje}%</span>
      </div>

      <div
        className={`relative my-4 border-t-[1.5px] border-dashed ${esServicio ? 'border-white/40' : 'border-[#20340f]/35'}`}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span className="font-titulo text-xl font-extrabold tracking-wider text-white" data-testid="valor-codigo">
          {codigo.codigo}
        </span>
        <button
          type="button"
          onClick={copiar}
          data-testid="boton-copiar"
          className={`rounded-full bg-white px-4.5 py-2 text-[12.5px] font-bold whitespace-nowrap transition hover:brightness-95 ${
            esServicio ? 'text-disagro-verde-oscuro' : 'text-[#3c5410]'
          }`}
        >
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>

      {/* El estado se muestra siempre: al cliente le dice si ya lo usó y al admin
          le permite distinguir de un vistazo los canjeados de los pendientes. */}
      <p
        className={`relative mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${
          canjeado ? 'bg-black/25 text-white' : 'bg-white/25 text-white'
        }`}
        data-testid="estado-codigo"
      >
        {canjeado
          ? `Canjeado${codigo.canjeadoEn ? ` el ${formatearFecha(codigo.canjeadoEn)}` : ''}`
          : 'Sin canjear'}
      </p>
    </div>
  )
}
