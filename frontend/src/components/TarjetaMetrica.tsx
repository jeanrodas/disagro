import type { ReactNode } from 'react'

interface Props {
  etiqueta: string
  valor: string
  nota?: string
  /** La tarjeta principal (ingreso potencial) va en verde. */
  destacada?: boolean
  extra?: ReactNode
}

export function TarjetaMetrica({ etiqueta, valor, nota, destacada, extra }: Props) {
  return (
    <div
      className={`rounded-3xl px-5 py-5 ${
        destacada
          ? 'bg-linear-135 from-disagro-verde to-disagro-verde-claro text-white shadow-[0_24px_48px_-28px_rgba(23,155,68,0.8)]'
          : 'bg-white text-disagro-tinta shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]'
      }`}
    >
      <p
        className={`text-[11px] font-semibold tracking-wide uppercase ${
          destacada ? 'text-white/85' : 'text-disagro-tenue'
        }`}
      >
        {etiqueta}
      </p>
      <p className="mt-1 font-titulo text-2xl font-extrabold">{valor}</p>
      {nota && <p className={`mt-1 text-[12px] ${destacada ? 'text-white/85' : 'text-disagro-suave'}`}>{nota}</p>}
      {extra}
    </div>
  )
}
