import type { NivelDescuento, PorcentajePreview } from '../lib/descuentos-preview'

export interface PropsTarjetaIncentivo {
  tipo: 'Servicios' | 'Productos'
  nivel: NivelDescuento
  porcentaje: PorcentajePreview
  /** Fracción 0..1 de la barra de progreso. Es presentación: la calcula el contenedor. */
  relleno: number
  /** Texto motivador: qué falta para el siguiente nivel. */
  nudge: string
  /** Se enciende ~900 ms cuando el nivel SUBE, para las animaciones de celebración. */
  celebrar: boolean
}

/**
 * Paleta por estado, tomada del handoff (dirección 2A) sin cambios.
 *
 * Son colores calculados en tiempo de ejecución a partir del nivel —incluidos
 * gradientes de tres paradas— así que van como estilos en línea en vez de clases
 * de Tailwind: expresarlos con utilidades arbitrarias haría el JSX ilegible sin
 * ganar nada. El layout y la tipografía sí son clases, como en el resto del proyecto.
 */
const PALETA = {
  0: {
    tarjeta: { background: '#f1f4f1', border: '2px dashed #cdd8ce' },
    etiqueta: '#9db3a5',
    sufijo: '#a7b6ac',
    porcentaje: '#b3c1b8',
    pista: '#e2e8e3',
    // Apagada, pero el relleno mantiene el color de marca: enseña el premio que viene
    relleno: 'linear-gradient(90deg,#179B44,#37c463)',
    muesca: 'rgba(255,255,255,.9)',
    marcas: ['#8aa094', '#c0cdc4', '#c0cdc4'],
    divisor: '#d3ddd4',
    nudge: '#7d8f84',
  },
  1: {
    tarjeta: { background: 'linear-gradient(135deg,#0F7A34,#179B44 60%,#37c463)', border: '2px solid transparent' },
    etiqueta: '#d6f5df',
    sufijo: '#d6f5df',
    porcentaje: '#fff',
    pista: 'rgba(255,255,255,.28)',
    relleno: 'linear-gradient(90deg,#eafff0,#d6f5df)',
    muesca: 'rgba(255,255,255,.95)',
    marcas: ['#eafff0', '#fff', 'rgba(255,255,255,.55)'],
    divisor: 'rgba(255,255,255,.5)',
    nudge: '#eafff0',
  },
  2: {
    tarjeta: { background: 'linear-gradient(135deg,#127a35,#37c463 55%,#b6d94f)', border: '2px solid transparent' },
    etiqueta: '#eafff0',
    sufijo: '#f2ffe9',
    porcentaje: '#fff',
    pista: 'rgba(255,255,255,.3)',
    relleno: 'linear-gradient(90deg,#ffffff,#f2ffe9)',
    muesca: 'rgba(255,255,255,.55)',
    marcas: ['#f2ffe9', '#fff', '#fff'],
    divisor: 'rgba(255,255,255,.6)',
    nudge: '#fff',
  },
} as const satisfies Record<NivelDescuento, unknown>

/**
 * Tarjeta del incentivo de descuento: cuánto lleva, cuánto le falta y celebración
 * al desbloquear. Se instancia dos veces, una por tipo.
 *
 * Es un componente de PRESENTACIÓN: no sabe nada de las reglas de descuento, solo
 * pinta el nivel y el relleno que le pasan.
 */
export function TarjetaIncentivo({ tipo, nivel, porcentaje, relleno, nudge, celebrar }: PropsTarjetaIncentivo) {
  const paleta = PALETA[nivel]
  const enElMaximo = nivel === 2
  const anchoRelleno = `${Math.round(Math.min(Math.max(relleno, 0), 1) * 100)}%`
  const clave = tipo.toLowerCase()

  return (
    <div
      data-testid={`incentivo-${clave}`}
      data-nivel={nivel}
      className={`relative min-w-0 overflow-hidden rounded-[18px] px-5 py-[18px] shadow-[0_16px_36px_-24px_rgba(20,38,26,0.55)] transition-[background,border-color] duration-[450ms] ${
        celebrar && nivel > 0 ? 'animate-brillo' : ''
      }`}
      style={paleta.tarjeta}
    >
      {enElMaximo && (
        <span
          data-testid={`sello-maximo-${clave}`}
          className="animate-sello absolute top-3.5 right-3.5 rounded-lg border-2 border-white/80 px-[9px] py-1 font-titulo text-xs font-extrabold tracking-[0.06em] text-white"
          style={{ transform: 'rotate(-12deg)' }}
        >
          MÁXIMO ✓
        </span>
      )}

      {/*
        En el máximo, la etiqueta cede el sitio al sello: se le reserva el hueco (pr-20)
        y se le permite partir en dos líneas. El handoff la fija en una sola línea, pero
        eso vale para su lienzo ancho; en la columna del formulario la tarjeta mide ~213px
        y el sello rotado ocupa casi todo el ancho superior, así que en una línea el texto
        acababa por debajo del sello.
      */}
      <div
        className={`text-[11px] font-bold tracking-[0.06em] uppercase ${enElMaximo ? 'pr-20' : 'whitespace-nowrap'}`}
        style={{ color: paleta.etiqueta }}
      >
        Descuento {tipo}
      </div>

      <div className="mt-1 mb-4 flex items-baseline gap-2">
        <span
          data-testid={`porcentaje-${clave}`}
          className={`inline-block font-titulo text-[32px] leading-none font-extrabold ${celebrar ? 'animate-pop' : ''}`}
          style={{ color: paleta.porcentaje }}
        >
          {porcentaje}%
        </span>
        <span className="text-xs" style={{ color: paleta.sufijo }}>
          de descuento
        </span>
      </div>

      {/* Barra: el recorrido completo 0% → 3% → 5%, con el 3% en la mitad */}
      <div
        className="relative h-3 overflow-hidden rounded-lg"
        style={{ background: paleta.pista }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={porcentaje}
        aria-valuetext={`${porcentaje}% de descuento en ${tipo.toLowerCase()}`}
      >
        <div
          data-testid={`relleno-${clave}`}
          className="absolute inset-y-0 left-0 rounded-lg transition-[width] duration-[550ms] ease-[cubic-bezier(.5,1.4,.5,1)]"
          style={{ width: anchoRelleno, background: paleta.relleno }}
        />
        {/* Muesca del nivel intermedio (3%) */}
        <div className="absolute inset-y-0 left-1/2 w-0.5" style={{ background: paleta.muesca }} aria-hidden="true" />
      </div>

      <div className="mt-1.5 flex justify-between text-[10.5px] font-bold" aria-hidden="true">
        <span style={{ color: paleta.marcas[0] }}>0%</span>
        <span style={{ color: paleta.marcas[1] }}>3%</span>
        <span style={{ color: paleta.marcas[2] }}>5%</span>
      </div>

      <div className="mt-[13px] border-t-[1.5px] border-dashed" style={{ borderColor: paleta.divisor }} />

      <p
        data-testid={`nudge-${clave}`}
        className={`mt-[13px] text-[12.5px] font-semibold ${celebrar ? 'animate-subir' : ''}`}
        style={{ color: paleta.nudge }}
        aria-live="polite"
      >
        {nudge}
      </p>
    </div>
  )
}
