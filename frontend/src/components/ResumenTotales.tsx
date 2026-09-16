import { formatearQuetzales } from '../lib/formato'
import type { Descuentos, Totales } from '../types/api'

interface Props {
  descuentos: Descuentos
  totales: Totales
}

/**
 * Los dos descuentos por separado y el total final.
 * Todos los montos vienen del backend como string y se formatean tal cual.
 */
export function ResumenTotales({ descuentos, totales }: Props) {
  const filas = [
    {
      titulo: 'Servicios',
      resumen: descuentos.servicios,
      totalesTipo: totales.servicios,
      acento: 'text-disagro-verde',
    },
    {
      titulo: 'Productos',
      resumen: descuentos.productos,
      totalesTipo: totales.productos,
      acento: 'text-disagro-lima-oscuro',
    },
  ]

  return (
    <section
      className="rounded-3xl bg-white p-6 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]"
      data-testid="resumen-totales"
    >
      <h2 className="font-titulo text-base font-bold text-disagro-tinta">Resumen</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {filas.map(({ titulo, resumen, totalesTipo, acento }) => (
          <div key={titulo} className="rounded-2xl bg-disagro-campo p-4">
            <div className="flex items-center justify-between">
              <p className="font-titulo text-sm font-bold text-disagro-tinta">{titulo}</p>
              <span className={`font-titulo text-lg font-extrabold ${acento}`}>
                {resumen.porcentaje > 0 ? `${resumen.porcentaje}%` : 'Sin descuento'}
              </span>
            </div>
            <dl className="mt-2.5 space-y-1 text-[12.5px] text-disagro-suave">
              <div className="flex justify-between">
                <dt>Elegidos</dt>
                <dd>{resumen.cantidad}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Suma</dt>
                <dd>{formatearQuetzales(resumen.suma)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Descuento</dt>
                <dd className={acento}>− {formatearQuetzales(totalesTipo.descuento)}</dd>
              </div>
              <div className="flex justify-between border-t border-disagro-borde pt-1 font-semibold text-disagro-tinta">
                <dt>Total</dt>
                <dd>{formatearQuetzales(totalesTipo.total)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-1.5 text-sm">
        <div className="flex justify-between text-disagro-suave">
          <span>Subtotal</span>
          <span data-testid="subtotal">{formatearQuetzales(totales.subtotal)}</span>
        </div>
        <div className="flex justify-between text-disagro-suave">
          <span>Descuento aplicado</span>
          <span className="text-disagro-verde" data-testid="descuento-total">
            − {formatearQuetzales(totales.descuento)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-disagro-borde pt-3">
          <span className="font-titulo font-bold text-disagro-tinta">Total con descuento</span>
          <span className="font-titulo text-2xl font-extrabold text-disagro-tinta" data-testid="total-final">
            {formatearQuetzales(totales.total)}
          </span>
        </div>
      </div>
    </section>
  )
}
