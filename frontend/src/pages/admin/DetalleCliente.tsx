import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { EncabezadoAdmin } from '../../components/EncabezadoAdmin'
import { EstadoPantalla } from '../../components/EstadoPantalla'
import { ResumenTotales } from '../../components/ResumenTotales'
import type { ContextoAdmin } from '../../components/RutaProtegidaAdmin'
import { TarjetaCodigo } from '../../components/TarjetaCodigo'
import { TarjetaItemDetalle } from '../../components/TarjetaItemDetalle'
import { obtenerCliente } from '../../lib/api/admin'
import { esNoAutenticado, esNoEncontrado } from '../../lib/api/http'
import { formatearFecha } from '../../lib/formato'
import type { Portafolio } from '../../types/api'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; detalle: Portafolio }
  | { fase: 'no-encontrado' }
  | { fase: 'error' }

const volverALaLista = (
  <Link
    to="/admin"
    className="inline-block rounded-full bg-linear-135 from-disagro-verde to-disagro-verde-claro px-6 py-3 font-titulo text-sm font-bold text-white transition hover:brightness-105"
  >
    Volver a la lista
  </Link>
)

export function DetalleCliente() {
  const { admin } = useOutletContext<ContextoAdmin>()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })

  const cargar = useCallback(async () => {
    if (!id) {
      setEstado({ fase: 'no-encontrado' })
      return
    }
    setEstado({ fase: 'cargando' })
    try {
      setEstado({ fase: 'listo', detalle: await obtenerCliente(id) })
    } catch (error: unknown) {
      if (esNoAutenticado(error)) {
        navigate('/admin/login', { state: { expirada: true, desde: `/admin/clientes/${id}` }, replace: true })
      } else if (esNoEncontrado(error)) {
        setEstado({ fase: 'no-encontrado' })
      } else {
        setEstado({ fase: 'error' })
      }
    }
  }, [id, navigate])

  useEffect(() => {
    // Intencionado: `cargar` pone la fase en 'cargando' antes de pedir el cliente al
    // backend. Es el arranque de una sincronización con un sistema externo, y depende
    // del :id de la ruta, así que no puede resolverse en render ni en useState.
    // oxlint-disable-next-line react/set-state-in-effect
    void cargar()
  }, [cargar])

  if (estado.fase === 'cargando') {
    return <EstadoPantalla icono="⏳" titulo="Cargando el cliente…" mensaje="Un momento, por favor." />
  }

  if (estado.fase === 'no-encontrado') {
    return (
      <EstadoPantalla
        icono="🔎"
        titulo="Cliente no encontrado"
        mensaje="Ese cliente no existe o el enlace es incorrecto."
        accion={volverALaLista}
      />
    )
  }

  if (estado.fase === 'error') {
    return (
      <EstadoPantalla
        icono="⚠️"
        titulo="No pudimos cargar el cliente"
        mensaje="Revisa tu conexión e inténtalo otra vez."
        accion={
          <button
            type="button"
            onClick={() => void cargar()}
            className="rounded-full bg-linear-135 from-disagro-verde to-disagro-verde-claro px-6 py-3 font-titulo text-sm font-bold text-white transition hover:brightness-105"
          >
            Reintentar
          </button>
        }
      />
    )
  }

  const { cliente, items, codigos, descuentos, totales } = estado.detalle
  const canjeados = codigos.filter((codigo) => codigo.estado === 'CANJEADO').length

  return (
    <main className="mx-auto max-w-[1080px] px-5 pt-6 pb-16">
      <EncabezadoAdmin usuario={admin.usuario} />

      <Link to="/admin" className="text-[13px] font-semibold text-disagro-verde hover:underline">
        ← Volver a la lista
      </Link>

      {/* Datos del cliente */}
      <section className="mt-3 rounded-3xl bg-white p-6 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
        <h1 className="font-titulo text-xl font-bold text-disagro-tinta">
          {cliente.nombre} {cliente.apellidos}
        </h1>
        <p className="text-sm text-disagro-suave">{cliente.email}</p>
        <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-disagro-tenue">Fecha del evento</dt>
            <dd className="font-semibold text-disagro-tinta">{formatearFecha(cliente.fechaEvento)}</dd>
          </div>
          <div>
            <dt className="text-disagro-tenue">Confirmó el</dt>
            <dd className="font-semibold text-disagro-tinta">{formatearFecha(cliente.confirmadoEn)}</dd>
          </div>
          <div>
            <dt className="text-disagro-tenue">Items elegidos</dt>
            <dd className="font-semibold text-disagro-tinta">{items.length}</dd>
          </div>
        </dl>
      </section>

      {/* Códigos con su estado */}
      <section className="mt-7">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-titulo text-base font-bold text-disagro-tinta">Códigos de descuento</h2>
          {codigos.length > 0 && (
            <span className="text-[12.5px] text-disagro-suave" data-testid="resumen-codigos">
              {canjeados} de {codigos.length} canjeado(s)
            </span>
          )}
        </div>

        {codigos.length === 0 ? (
          <p className="rounded-2xl bg-white px-5 py-4 text-sm text-disagro-suave shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
            Este cliente no obtuvo descuentos con su selección.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {codigos.map((codigo) => (
              <TarjetaCodigo key={codigo.codigo} codigo={codigo} />
            ))}
          </div>
        )}
      </section>

      {/* Selección del cliente */}
      <section className="mt-8">
        <h2 className="font-titulo text-base font-bold text-disagro-tinta">Selección del cliente</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" data-testid="items-cliente">
          {items.map((item) => (
            <TarjetaItemDetalle key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-8">
        <ResumenTotales descuentos={descuentos} totales={totales} />
      </div>
    </main>
  )
}
