import { formatearQuetzales } from '../lib/formato'
import type { RespuestaConfirmacion } from '../types/api'

interface Props {
  respuesta: RespuestaConfirmacion
  onVolver: () => void
}

/**
 * Pantalla temporal de esta etapa: muestra los códigos que devolvió el backend
 * apenas se confirma. El portafolio completo se construye en la etapa siguiente;
 * la navegación ya queda aquí.
 */
export function CodigosConfirmados({ respuesta, onVolver }: Props) {
  const { portafolio } = respuesta
  const esServicio = (tipo: string) => tipo === 'SERVICIO'

  return (
    <main className="mx-auto max-w-[900px] px-5 pt-6 pb-16">
      <div className="rounded-3xl bg-linear-120 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro px-8 py-7 shadow-[0_26px_54px_-30px_rgba(23,155,68,0.6)]">
        <img src="/disagro-blanco.png" alt="Disagro" className="mb-4 h-6" />
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl text-white">✓</span>
          <div>
            <p className="font-titulo text-[23px] font-extrabold text-white">
              ¡Tu portafolio está listo, {portafolio.cliente.nombre}!
            </p>
            <p className="text-[13.5px] text-[#d6f5df]">{respuesta.mensaje}</p>
          </div>
        </div>
      </div>

      <div className="mt-7 text-center">
        <span className="inline-block rounded-full bg-[#e6f4ea] px-4 py-1.5 font-titulo text-xs font-bold tracking-[0.14em] text-disagro-verde uppercase">
          Tus códigos de descuento
        </span>
        <p className="mt-2.5 text-[13px] text-disagro-suave">
          Presenta estos códigos en el evento para aplicar tus promociones.
        </p>
      </div>

      {respuesta.codigos.length === 0 && (
        <p className="mt-5 rounded-2xl bg-white px-5 py-4 text-center text-sm text-disagro-suave">
          Tu selección no alcanzó un descuento esta vez.
        </p>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {respuesta.codigos.map((codigo) => (
          <div
            key={codigo.codigo}
            data-testid="tarjeta-codigo"
            className={`rounded-3xl px-6 py-6 ${
              esServicio(codigo.tipo)
                ? 'bg-linear-135 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro text-white'
                : 'bg-linear-135 from-disagro-lima-oscuro via-disagro-lima to-disagro-lima-claro text-[#20340f]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide uppercase opacity-90">
                Descuento en {esServicio(codigo.tipo) ? 'servicios' : 'productos'}
              </span>
              <span className="font-titulo text-3xl font-extrabold text-white">{codigo.porcentaje}%</span>
            </div>
            <div className="my-4 border-t-[1.5px] border-dashed border-white/40" />
            <span className="font-titulo text-xl font-extrabold tracking-wider text-white">{codigo.codigo}</span>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-3xl bg-white px-6 py-5 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
        <div className="flex items-center justify-between text-sm text-disagro-suave">
          <span>Subtotal</span>
          <span>{formatearQuetzales(portafolio.totales.subtotal)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-sm text-disagro-suave">
          <span>Descuento</span>
          <span className="text-disagro-verde">− {formatearQuetzales(portafolio.totales.descuento)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-disagro-borde pt-3">
          <span className="font-titulo font-bold text-disagro-tinta">Total</span>
          <span className="font-titulo text-xl font-extrabold text-disagro-tinta">
            {formatearQuetzales(portafolio.totales.total)}
          </span>
        </div>
      </div>

      <p className="mt-6 rounded-2xl border border-dashed border-disagro-borde px-4 py-3 text-center text-[12.5px] text-disagro-tenue">
        El portafolio completo, con el detalle de cada item elegido, llega en la siguiente etapa.
      </p>

      <button
        type="button"
        onClick={onVolver}
        className="mt-5 w-full rounded-full border-[1.5px] border-disagro-borde bg-white px-5 py-3 font-titulo text-sm font-bold text-disagro-texto transition hover:bg-disagro-campo"
      >
        Volver al formulario
      </button>
    </main>
  )
}
