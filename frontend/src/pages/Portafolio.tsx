import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BannerPortafolio } from '../components/BannerPortafolio'
import { EstadoPantalla } from '../components/EstadoPantalla'
import { ResumenTotales } from '../components/ResumenTotales'
import { TarjetaCodigo } from '../components/TarjetaCodigo'
import { TarjetaItemDetalle } from '../components/TarjetaItemDetalle'
import { esNoAutenticado } from '../lib/api/http'
import { canjearSesion, leerTokenDelEnlace, limpiarTokenDeLaUrl, obtenerPortafolio } from '../lib/api/portafolio'
import type { Portafolio as PortafolioDto } from '../types/api'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; portafolio: PortafolioDto }
  | { fase: 'sin-sesion' }
  | { fase: 'enlace-invalido' }
  | { fase: 'error'; mensaje: string }

const enlaceAlFormulario = (
  <Link
    to="/"
    className="inline-block rounded-full bg-linear-135 from-disagro-verde to-disagro-verde-claro px-6 py-3 font-titulo text-sm font-bold text-white transition hover:brightness-105"
  >
    Ir al formulario
  </Link>
)

export function Portafolio() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const { hash } = useLocation()
  /**
   * Clave de lo último que se cargó. Sirve para dos cosas:
   * - StrictMode ejecuta los efectos dos veces en desarrollo y el token se
   *   intentaría canjear dos veces;
   * - si alguien pega el enlace del correo estando ya en /portafolio, solo
   *   cambia el fragmento: la página no se recarga, así que hay que volver a
   *   cargar cuando el fragmento cambia.
   */
  const cargado = useRef<string | null>(null)

  const cargar = useCallback(async () => {
    setEstado({ fase: 'cargando' })

    // El token del enlace del correo viaja en el fragmento (#token=...), que el
    // navegador nunca envía al servidor: se lee aquí y se canjea por la cookie.
    const token = leerTokenDelEnlace()
    if (token) {
      try {
        await canjearSesion(token)
        limpiarTokenDeLaUrl()
        // La URL ya no tiene token: se marca como cargado para no repetir la carga
        cargado.current = 'sin-token'
      } catch {
        setEstado({ fase: 'enlace-invalido' })
        return
      }
    }

    try {
      setEstado({ fase: 'listo', portafolio: await obtenerPortafolio() })
    } catch (error) {
      if (esNoAutenticado(error)) setEstado({ fase: 'sin-sesion' })
      else setEstado({ fase: 'error', mensaje: 'No pudimos cargar tu portafolio.' })
    }
  }, [])

  useEffect(() => {
    const clave = hash || 'sin-token'
    if (cargado.current === clave) return
    cargado.current = clave
    void cargar()
  }, [cargar, hash])

  if (estado.fase === 'cargando') {
    return <EstadoPantalla icono="⏳" titulo="Cargando tu portafolio…" mensaje="Estamos recuperando tu selección." />
  }

  if (estado.fase === 'sin-sesion') {
    return (
      <EstadoPantalla
        icono="🔒"
        titulo="No encontramos tu sesión"
        mensaje="Confirma tu asistencia o abre el enlace que te enviamos por correo para ver tu portafolio."
        accion={enlaceAlFormulario}
      />
    )
  }

  if (estado.fase === 'enlace-invalido') {
    return (
      <EstadoPantalla
        icono="⛓️‍💥"
        titulo="El enlace no es válido"
        mensaje="El enlace de tu correo no funcionó o ya venció. Puedes confirmar tu asistencia de nuevo desde el formulario."
        accion={enlaceAlFormulario}
      />
    )
  }

  if (estado.fase === 'error') {
    return (
      <EstadoPantalla
        icono="⚠️"
        titulo="Algo salió mal"
        mensaje={`${estado.mensaje} Revisa tu conexión e inténtalo otra vez.`}
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

  const { cliente, items, codigos, descuentos, totales } = estado.portafolio

  return (
    <main className="mx-auto max-w-[1080px] px-5 pt-6 pb-16">
      <BannerPortafolio cliente={cliente} />

      <section className="mt-7">
        <div className="text-center">
          <span className="inline-block rounded-full bg-[#e6f4ea] px-4 py-1.5 font-titulo text-xs font-bold tracking-[0.14em] text-disagro-verde uppercase">
            Tus códigos de descuento
          </span>
          <p className="mt-2.5 text-[13px] text-disagro-suave">
            {codigos.length > 0
              ? 'Presenta estos códigos en el evento para aplicar tus promociones. Cópialos o guárdalos.'
              : 'Tu selección quedó registrada. Esta vez no alcanzó un descuento, pero te esperamos en la feria.'}
          </p>
        </div>

        {codigos.length > 0 && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {codigos.map((codigo) => (
              <TarjetaCodigo key={codigo.codigo} codigo={codigo} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-9">
        <h2 className="font-titulo text-base font-bold text-disagro-tinta">Tu selección personalizada</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" data-testid="items-portafolio">
          {items.map((item) => (
            <TarjetaItemDetalle key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className="mt-9">
        <ResumenTotales descuentos={descuentos} totales={totales} />
      </div>

      <p className="mt-7 text-center text-[12.5px] text-disagro-tenue">
        ¿Quieres cambiar tu selección? Escríbenos al 2223-2425 antes del evento.
      </p>
    </main>
  )
}
