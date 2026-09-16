import { formatearFecha } from '../lib/formato'
import type { Cliente } from '../types/api'

interface Props {
  cliente: Cliente
}

/** Encabezado del portafolio: confirmación, saludo y fecha del evento. */
export function BannerPortafolio({ cliente }: Props) {
  return (
    <header className="rounded-3xl bg-linear-120 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro px-7 py-7 shadow-[0_26px_54px_-30px_rgba(23,155,68,0.6)]">
      <img src="/disagro-blanco.png" alt="Disagro" className="mb-4 h-6" />
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/20 text-xl text-white">
          ✓
        </span>
        <div>
          <h1 className="font-titulo text-[23px] leading-tight font-extrabold text-white">
            ¡Tu portafolio está listo, {cliente.nombre}!
          </h1>
          <p className="text-[13.5px] text-[#d6f5df]">
            Asistencia confirmada para el {formatearFecha(cliente.fechaEvento)} · Propuesta comercial a tu medida
          </p>
        </div>
      </div>
    </header>
  )
}
