import type { ReactNode } from 'react'

/**
 * Iconos por categoría, reproducidos como SVG en línea a partir del componente
 * CatIcon del diseño (propuesta-diseno/CatIcon.dc.html). Van en el código y no
 * como imágenes externas: heredan el color con currentColor y no piden red.
 */
const TRAZOS: Record<string, ReactNode> = {
  // Gota de nutrición
  Nutrición: (
    <>
      <path d="M12 2.8c0 0-6.3 6.8-6.3 11.2a6.3 6.3 0 0 0 12.6 0C18.3 9.6 12 2.8 12 2.8Z" />
      <path d="M12 8.5v7" />
      <path d="M12 12.6c1.5-.4 2.6-1.6 3-3.3" />
      <path d="M12 12.6c-1.5-.4-2.6-1.6-3-3.3" />
    </>
  ),
  // Brote
  Semillas: (
    <>
      <path d="M4 20h16" />
      <path d="M12 20v-8" />
      <path d="M12 13.5C9 13.5 7 11.5 7 8.3c3 0 5 2 5 5.2Z" />
      <path d="M12 12.5c3 0 5-2 5-5.2-3 0-5 2-5 5.2Z" />
    </>
  ),
  // Escudo con visto
  Protección: (
    <>
      <path d="M12 3 19 5.6V11c0 4.4-3 7.8-7 9.6-4-1.8-7-5.2-7-9.6V5.6Z" />
      <path d="M9 11.6l2.2 2.2L15 10" />
    </>
  ),
  // Planta con hojas
  Bioestimulantes: (
    <>
      <path d="M12 20V6" />
      <path d="M9.4 8.2 12 5.6l2.6 2.6" />
      <path d="M12 14.5C9.5 14.5 8 12.6 8 9.9c2.7 0 4 1.9 4 4.6Z" />
      <path d="M12 13.5c2.5 0 4-1.9 4-4.6-2.7 0-4 1.9-4 4.6Z" />
    </>
  ),
  // Matraz de laboratorio
  'Servicios Analíticos': (
    <>
      <path d="M9.2 3h5.6" />
      <path d="M10 3v6.2L5.7 17.8A2 2 0 0 0 7.5 20.8h9A2 2 0 0 0 18.3 17.8L14 9.2V3" />
      <path d="M7.4 15.2h9.2" />
    </>
  ),
  // Señal satelital
  Tecnología: (
    <>
      <circle cx="12" cy="16.5" r="1.4" />
      <path d="M8.3 13.2a5.2 5.2 0 0 1 7.4 0" />
      <path d="M6.1 11a8.4 8.4 0 0 1 11.8 0" />
      <path d="M4.2 9a11.2 11.2 0 0 1 15.6 0" />
    </>
  ),
  // Portapapeles agronómico
  Asesoría: (
    <>
      <path d="M8 4.5H7A1.5 1.5 0 0 0 5.5 6v13A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19V6A1.5 1.5 0 0 0 17 4.5h-1" />
      <path d="M9.5 3.2h5a.8.8 0 0 1 .8.8v1.8a.8.8 0 0 1-.8.8h-5a.8.8 0 0 1-.8-.8V4a.8.8 0 0 1 .8-.8Z" />
      <path d="M12 17.5v-3.7" />
      <path d="M12 14.8c-2 0-3.3-1.3-3.3-3.3 2 0 3.3 1.3 3.3 3.3Z" />
      <path d="M12 14.1c1.7 0 2.9-1.2 2.9-2.9-1.7 0-2.9 1.2-2.9 2.9Z" />
    </>
  ),
}

interface Props {
  categoria: string
  className?: string
}

export function IconoCategoria({ categoria, className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {TRAZOS[categoria] ?? TRAZOS['Nutrición']}
    </svg>
  )
}
