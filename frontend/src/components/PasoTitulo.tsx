interface Props {
  numero: 1 | 2
  titulo: string
  /** El paso 2 se ve gris mientras la selección está bloqueada. */
  apagado?: boolean
}

/** Numerito + título de cada columna del formulario. */
export function PasoTitulo({ numero, titulo, apagado }: Props) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span
        className={`flex h-7.5 w-7.5 items-center justify-center rounded-full font-titulo text-sm font-bold text-white transition ${
          apagado ? 'bg-[#c2d3c8]' : 'bg-linear-135 from-disagro-verde to-disagro-verde-claro'
        }`}
        data-testid={`paso-${numero}`}
      >
        {numero}
      </span>
      <h2 className="font-titulo text-[17px] font-bold text-disagro-tinta">{titulo}</h2>
    </div>
  )
}
