import { Link } from 'react-router-dom'
import { formatearFecha, formatearQuetzales } from '../lib/formato'
import type { ClienteResumen } from '../types/api'

interface Props {
  clientes: ClienteResumen[]
  cargando: boolean
}

const Porcentaje = ({ valor, tipo }: { valor: number; tipo: 'servicios' | 'productos' }) => (
  <span
    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
      valor === 0
        ? 'bg-disagro-campo text-disagro-tenue'
        : tipo === 'servicios'
          ? 'bg-disagro-verde/10 text-disagro-verde-oscuro'
          : 'bg-disagro-lima/20 text-disagro-lima-oscuro'
    }`}
    title={tipo}
  >
    {valor}%
  </span>
)

/**
 * Lista de clientes confirmados. En pantallas chicas la tabla se desplaza en
 * horizontal dentro de su tarjeta: mantiene las columnas legibles sin romper la página.
 */
export function TablaClientes({ clientes, cargando }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left" data-testid="tabla-clientes">
          <thead>
            <tr className="border-b border-disagro-borde text-[11px] tracking-wide text-disagro-tenue uppercase">
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-3 py-3 font-semibold">Fecha del evento</th>
              <th className="px-3 py-3 text-center font-semibold">Items</th>
              <th className="px-3 py-3 text-center font-semibold">Descuentos</th>
              <th className="px-3 py-3 text-center font-semibold">Códigos</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-disagro-tenue">
                  Cargando clientes…
                </td>
              </tr>
            )}

            {!cargando && clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-disagro-tenue">
                  No hay clientes que coincidan con la búsqueda.
                </td>
              </tr>
            )}

            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b border-disagro-borde/60 transition last:border-b-0 hover:bg-disagro-campo">
                <td className="px-5 py-3.5">
                  <Link to={`/admin/clientes/${cliente.id}`} className="block">
                    <span className="block text-sm font-semibold text-disagro-tinta">
                      {cliente.nombre} {cliente.apellidos}
                    </span>
                    <span className="block text-[12px] text-disagro-tenue">{cliente.email}</span>
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-[12.5px] text-disagro-suave">{formatearFecha(cliente.fechaEvento)}</td>
                <td className="px-3 py-3.5 text-center text-sm text-disagro-tinta">{cliente.cantidadItems}</td>
                <td className="px-3 py-3.5 text-center">
                  <div className="flex justify-center gap-1.5">
                    <Porcentaje valor={cliente.descuentos.servicios} tipo="servicios" />
                    <Porcentaje valor={cliente.descuentos.productos} tipo="productos" />
                  </div>
                </td>
                <td className="px-3 py-3.5 text-center text-sm text-disagro-tinta">{cliente.cantidadCodigos}</td>
                <td className="px-5 py-3.5 text-right font-titulo text-sm font-bold text-disagro-tinta">
                  {formatearQuetzales(cliente.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
