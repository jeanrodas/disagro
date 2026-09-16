import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { EncabezadoAdmin } from '../../components/EncabezadoAdmin'
import { EstadoPantalla } from '../../components/EstadoPantalla'
import type { ContextoAdmin } from '../../components/RutaProtegidaAdmin'
import { TablaClientes } from '../../components/TablaClientes'
import { TarjetaMetrica } from '../../components/TarjetaMetrica'
import { listarClientes, obtenerMetricas } from '../../lib/api/admin'
import { esNoAutenticado } from '../../lib/api/http'
import { formatearQuetzales } from '../../lib/formato'
import type { Metricas, RespuestaClientes } from '../../types/api'

const POR_PAGINA = 10

export function PanelAdmin() {
  const { admin } = useOutletContext<ContextoAdmin>()
  const navigate = useNavigate()

  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [lista, setLista] = useState<RespuestaClientes | null>(null)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState<string | null>(null)

  /** Si la sesión caduca en pleno uso, al login con aviso en lugar de un error crudo. */
  const alLogin = useCallback(() => {
    navigate('/admin/login', { state: { expirada: true, desde: '/admin' }, replace: true })
  }, [navigate])

  useEffect(() => {
    let vigente = true
    obtenerMetricas()
      .then((datos) => vigente && setMetricas(datos))
      .catch((errorMetricas: unknown) => {
        if (!vigente) return
        if (esNoAutenticado(errorMetricas)) alLogin()
        else setError('No pudimos cargar las métricas.')
      })
    return () => {
      vigente = false
    }
  }, [alLogin])

  // La búsqueda espera a que el usuario deje de escribir: una petición por término,
  // no una por tecla.
  useEffect(() => {
    let vigente = true
    setCargandoLista(true)
    const temporizador = setTimeout(() => {
      listarClientes({ page: pagina, limit: POR_PAGINA, buscar: busqueda.trim() || undefined })
        .then((datos) => vigente && setLista(datos))
        .catch((errorLista: unknown) => {
          if (!vigente) return
          if (esNoAutenticado(errorLista)) alLogin()
          else setError('No pudimos cargar la lista de clientes.')
        })
        .finally(() => {
          if (vigente) setCargandoLista(false)
        })
    }, 300)

    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [busqueda, pagina, alLogin])

  if (error) {
    return (
      <EstadoPantalla
        icono="⚠️"
        titulo="Algo salió mal"
        mensaje={`${error} Revisa tu conexión e inténtalo otra vez.`}
        accion={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-linear-135 from-disagro-verde to-disagro-verde-claro px-6 py-3 font-titulo text-sm font-bold text-white"
          >
            Reintentar
          </button>
        }
      />
    )
  }

  const paginacion = lista?.paginacion
  const desde = paginacion && paginacion.total > 0 ? (paginacion.page - 1) * paginacion.limit + 1 : 0
  const hasta = paginacion ? Math.min(paginacion.page * paginacion.limit, paginacion.total) : 0

  return (
    <main className="mx-auto max-w-[1160px] px-5 pt-6 pb-16">
      <EncabezadoAdmin usuario={admin.usuario} />

      {/* Métricas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="metricas">
        <TarjetaMetrica
          etiqueta="Clientes confirmados"
          valor={metricas ? String(metricas.totalClientes) : '—'}
          nota="Asistencias registradas"
        />
        <TarjetaMetrica
          etiqueta="Ingreso potencial"
          valor={metricas ? formatearQuetzales(metricas.ingresos.ingresoPotencial) : '—'}
          nota={metricas ? `Subtotal ${formatearQuetzales(metricas.ingresos.subtotal)}` : undefined}
          destacada
        />
        <TarjetaMetrica
          etiqueta="Descuento otorgado"
          valor={metricas ? formatearQuetzales(metricas.ingresos.descuento) : '—'}
          nota="Sobre el subtotal del catálogo"
        />
        <TarjetaMetrica
          etiqueta="Códigos"
          valor={metricas ? `${metricas.codigos.canjeados} / ${metricas.codigos.total}` : '—'}
          nota={metricas ? `${metricas.codigos.emitidos} sin canjear` : undefined}
        />
      </section>

      {/* min-w-0 en las tarjetas: un item de grid trae min-width:auto, así que la
          pista se dimensiona al min-content del contenido (los nombres largos de los
          items) y no al contenedor. Sin esto la página desborda en horizontal a 375px. */}
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Top de items */}
        <div className="min-w-0 rounded-3xl bg-white p-5 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
          <h2 className="font-titulo text-base font-bold text-disagro-tinta">Items más elegidos</h2>
          <ol className="mt-3 space-y-2" data-testid="top-items">
            {(metricas?.itemsMasElegidos ?? []).map((item, indice) => (
              <li key={item.itemId} className="flex items-center gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-disagro-campo font-titulo text-[11px] font-bold text-disagro-verde">
                  {indice + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-disagro-tinta">{item.nombre}</span>
                <span className="text-[12px] font-semibold text-disagro-suave">{item.selecciones}</span>
              </li>
            ))}
            {!metricas && <li className="text-[13px] text-disagro-tenue">Cargando…</li>}
          </ol>
        </div>

        {/* Niveles de descuento */}
        <div className="min-w-0 rounded-3xl bg-white p-5 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
          <h2 className="font-titulo text-base font-bold text-disagro-tinta">Clientes por nivel de descuento</h2>
          <div className="mt-3 grid grid-cols-2 gap-4" data-testid="niveles-descuento">
            {(['servicios', 'productos'] as const).map((tipo) => (
              <div key={tipo}>
                <p className="text-[11px] font-semibold tracking-wide text-disagro-tenue uppercase">{tipo}</p>
                <ul className="mt-1.5 space-y-1">
                  {(metricas?.nivelesDescuento[tipo] ?? []).map((nivel) => (
                    <li key={nivel.porcentaje} className="flex items-center justify-between text-[13px]">
                      <span className="text-disagro-suave">{nivel.porcentaje}%</span>
                      <span className="font-semibold text-disagro-tinta">{nivel.clientes}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clientes */}
      <section className="mt-8">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-titulo text-base font-bold text-disagro-tinta">Clientes confirmados</h2>
          <input
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              setPagina(1)
            }}
            placeholder="Buscar por nombre o email"
            aria-label="Buscar clientes"
            data-testid="buscar-clientes"
            className="w-full rounded-full border-[1.5px] border-disagro-borde bg-white px-4 py-2.5 text-sm outline-none focus:border-disagro-verde-claro sm:w-72"
          />
        </div>

        <TablaClientes clientes={lista?.data ?? []} cargando={cargandoLista} />

        {paginacion && (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-disagro-suave" data-testid="paginacion-texto">
              Mostrando {desde}–{hasta} de {paginacion.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
                disabled={paginacion.page <= 1}
                data-testid="pagina-anterior"
                className="rounded-full border-[1.5px] border-disagro-borde bg-white px-4 py-2 text-[12.5px] font-semibold text-disagro-texto transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-[12.5px] text-disagro-suave">
                Página {paginacion.page} de {Math.max(1, paginacion.totalPaginas)}
              </span>
              <button
                type="button"
                onClick={() => setPagina((actual) => actual + 1)}
                disabled={paginacion.page >= paginacion.totalPaginas}
                data-testid="pagina-siguiente"
                className="rounded-full border-[1.5px] border-disagro-borde bg-white px-4 py-2 text-[12.5px] font-semibold text-disagro-texto transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
