/** Barra superior de la feria, con el gradiente verde de la propuesta de diseño. */
export function Encabezado() {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3.5 rounded-3xl bg-linear-115 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro px-7 py-6 shadow-[0_24px_50px_-30px_rgba(23,155,68,0.8)]">
      <div className="flex items-center gap-4">
        <img src="/disagro-blanco.png" alt="Disagro" className="h-7" />
        <span className="h-7 w-px bg-white/35" />
        <div className="leading-tight">
          <p className="font-titulo text-lg font-bold text-white">Feria de Promociones</p>
          <p className="text-[13px] text-[#d6f5df]">Edición 2026 · Confirma tu asistencia</p>
        </div>
      </div>
      <span className="rounded-full bg-white/15 px-4 py-1.5 text-[12.5px] text-[#eafff0]">
        Atención al cliente: 2223-2425
      </span>
    </header>
  )
}
