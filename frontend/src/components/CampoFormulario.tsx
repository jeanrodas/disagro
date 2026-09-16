import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  /** Texto gris junto a la etiqueta, ej. "· identificador". */
  nota?: string
  error?: string | null
  /** Mensaje de ayuda bajo el campo (se oculta si hay error). */
  ayuda?: string | null
  ayudaEnVerde?: boolean
}

/** Campo de texto del formulario, con su etiqueta, error y ayuda. */
export function CampoFormulario({ etiqueta, nota, error, ayuda, ayudaEnVerde, id, ...props }: Props) {
  const idCampo = id ?? props.name ?? etiqueta
  const borde = error
    ? 'border-red-300 bg-red-50/60 focus:border-red-400'
    : 'border-disagro-borde bg-disagro-campo focus:border-disagro-verde-claro'

  return (
    <div className="mb-4">
      <label htmlFor={idCampo} className="mb-1.5 block text-xs font-semibold text-disagro-texto">
        {etiqueta}
        {nota && <span className="font-medium text-disagro-tenue"> {nota}</span>}
      </label>
      <input
        id={idCampo}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-xl border-[1.5px] px-3.5 py-3 text-sm text-disagro-tinta outline-none transition placeholder:text-disagro-tenue ${borde}`}
        {...props}
      />
      <p
        className={`min-h-[18px] pt-1 text-[11.5px] ${
          error ? 'font-medium text-red-600' : ayudaEnVerde ? 'font-semibold text-disagro-verde' : 'text-disagro-tenue'
        }`}
      >
        {error ?? ayuda ?? ''}
      </p>
    </div>
  )
}
