import type { ReactNode } from 'react'

interface Props {
  icono: string
  titulo: string
  mensaje: string
  /** Botón o enlace de salida: siempre se ofrece un camino, nunca un callejón. */
  accion?: ReactNode
}

/** Pantalla centrada para los estados de carga, sin sesión y error. */
export function EstadoPantalla({ icono, titulo, mensaje, accion }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 text-center">
      <div className="w-full rounded-3xl bg-white px-7 py-10 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-disagro-campo text-2xl">
          {icono}
        </span>
        <h1 className="font-titulo text-xl font-bold text-disagro-tinta">{titulo}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-disagro-suave">{mensaje}</p>
        {accion && <div className="mt-6">{accion}</div>}
      </div>
    </main>
  )
}
