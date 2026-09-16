import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { obtenerAdminActual } from '../lib/api/admin'
import { esNoAutenticado } from '../lib/api/http'
import type { Admin } from '../types/api'
import { EstadoPantalla } from './EstadoPantalla'

/** Lo que el guardián entrega a las pantallas protegidas, para que no vuelvan a pedir /me. */
export interface ContextoAdmin {
  admin: Admin
}

type Estado =
  | { fase: 'verificando' }
  | { fase: 'autenticado'; admin: Admin }
  | { fase: 'sin-sesion' }
  | { fase: 'error' }

/**
 * Guardián de las rutas del panel.
 *
 * Pregunta al backend si hay sesión (GET /api/admin/me) antes de mostrar nada:
 * el frontend no puede confiar en la cookie porque es httpOnly y no la ve. Mientras
 * verifica muestra un estado de carga, para no parpadear contenido protegido.
 */
export function RutaProtegidaAdmin() {
  const location = useLocation()
  const [estado, setEstado] = useState<Estado>({ fase: 'verificando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    setEstado({ fase: 'verificando' })

    obtenerAdminActual()
      .then((respuesta) => {
        if (vigente) setEstado({ fase: 'autenticado', admin: respuesta.admin })
      })
      .catch((error: unknown) => {
        if (!vigente) return
        setEstado(esNoAutenticado(error) ? { fase: 'sin-sesion' } : { fase: 'error' })
      })

    // Si la pantalla se desmonta antes de la respuesta, no se actualiza el estado
    return () => {
      vigente = false
    }
  }, [intento])

  if (estado.fase === 'verificando') {
    return <EstadoPantalla icono="⏳" titulo="Verificando tu sesión…" mensaje="Un momento, por favor." />
  }

  if (estado.fase === 'sin-sesion') {
    // Se recuerda a dónde iba para volver ahí después de iniciar sesión
    return <Navigate to="/admin/login" state={{ desde: location.pathname }} replace />
  }

  if (estado.fase === 'error') {
    return (
      <EstadoPantalla
        icono="⚠️"
        titulo="No pudimos verificar tu sesión"
        mensaje="Revisa tu conexión con el servidor e inténtalo otra vez."
        accion={
          <button
            type="button"
            onClick={() => setIntento((anterior) => anterior + 1)}
            className="rounded-full bg-linear-135 from-disagro-verde to-disagro-verde-claro px-6 py-3 font-titulo text-sm font-bold text-white transition hover:brightness-105"
          >
            Reintentar
          </button>
        }
      />
    )
  }

  return <Outlet context={{ admin: estado.admin } satisfies ContextoAdmin} />
}
