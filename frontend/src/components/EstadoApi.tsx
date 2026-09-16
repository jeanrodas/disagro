import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from '../lib/api/http'
import type { RespuestaItems } from '../types/api'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'ok'; total: number }
  | { fase: 'error'; mensaje: string }

/**
 * Consulta el catálogo al backend a través del proxy de desarrollo.
 * Sirve como comprobación visible de que el frontend habla con la API.
 */
export function EstadoApi() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })

  useEffect(() => {
    apiFetch<RespuestaItems>('/api/items')
      .then((respuesta) => setEstado({ fase: 'ok', total: respuesta.total }))
      .catch((error: unknown) =>
        setEstado({
          fase: 'error',
          mensaje: error instanceof ApiError ? `${error.status} · ${error.message}` : 'El backend no responde',
        }),
      )
  }, [])

  const estilos = {
    cargando: 'border-slate-200 bg-slate-50 text-slate-500',
    ok: 'border-disagro-verde/30 bg-disagro-verde/10 text-disagro-verde-oscuro',
    error: 'border-amber-300 bg-amber-50 text-amber-800',
  }[estado.fase]

  return (
    <p className={`mt-8 rounded-lg border px-4 py-3 text-sm font-medium ${estilos}`} data-testid="estado-api">
      {estado.fase === 'cargando' && 'Consultando el catálogo…'}
      {estado.fase === 'ok' && `API conectada: ${estado.total} productos y servicios en el catálogo.`}
      {estado.fase === 'error' && `Sin conexión con la API (${estado.mensaje}). ¿Está corriendo el backend?`}
    </p>
  )
}
