import { notaProductos, notaServicios, type DescuentosPreview } from '../lib/descuentos-preview'

interface Props {
  descuentos: DescuentosPreview
}

/**
 * Vista previa de los dos descuentos mientras el cliente elige.
 * El porcentaje definitivo lo calcula el backend al confirmar.
 */
export function TarjetasDescuento({ descuentos }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 bg-disagro-campo px-3.5 py-3">
      <div className="rounded-2xl bg-linear-135 from-disagro-verde to-disagro-verde-claro px-3.5 py-3 text-white">
        <p className="text-[10.5px] font-semibold tracking-wide uppercase opacity-90">Descuento servicios</p>
        <p className="font-titulo text-2xl leading-tight font-extrabold" data-testid="porcentaje-servicios">
          {descuentos.servicios.porcentaje > 0 ? `${descuentos.servicios.porcentaje}%` : '—'}
        </p>
        <p className="text-[10px] opacity-85">{notaServicios(descuentos.servicios)}</p>
      </div>

      <div className="rounded-2xl bg-linear-135 from-disagro-lima to-disagro-lima-claro px-3.5 py-3 text-[#20340f]">
        <p className="text-[10.5px] font-bold tracking-wide uppercase">Descuento productos</p>
        <p className="font-titulo text-2xl leading-tight font-extrabold" data-testid="porcentaje-productos">
          {descuentos.productos.porcentaje > 0 ? `${descuentos.productos.porcentaje}%` : '—'}
        </p>
        <p className="text-[10px] opacity-80">{notaProductos(descuentos.productos)}</p>
      </div>
    </div>
  )
}
