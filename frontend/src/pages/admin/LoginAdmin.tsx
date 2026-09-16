import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginAdmin, obtenerAdminActual } from '../../lib/api/admin'
import { esApiError } from '../../lib/api/http'

interface EstadoDeNavegacion {
  desde?: string
  expirada?: boolean
}

export function LoginAdmin() {
  const navigate = useNavigate()
  const location = useLocation()
  const estadoPrevio = (location.state ?? null) as EstadoDeNavegacion | null
  const destino = estadoPrevio?.desde ?? '/admin'

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** El 429 del rate limiting se muestra distinto a un error de credenciales. */
  const [demasiadosIntentos, setDemasiadosIntentos] = useState<string | null>(null)

  // Si ya hay sesión, no tiene sentido pedir credenciales otra vez
  useEffect(() => {
    let vigente = true
    obtenerAdminActual()
      .then(() => vigente && navigate(destino, { replace: true }))
      .catch(() => vigente && setVerificando(false))
    return () => {
      vigente = false
    }
  }, [destino, navigate])

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault()
    setError(null)
    setDemasiadosIntentos(null)
    setEnviando(true)

    try {
      await loginAdmin(usuario, password)
      navigate(destino, { replace: true })
    } catch (errorLogin: unknown) {
      if (esApiError(errorLogin) && errorLogin.status === 429) {
        // Mensaje del backend: no inventamos cuántos intentos quedan
        setDemasiadosIntentos(errorLogin.message)
      } else if (esApiError(errorLogin) && errorLogin.status === 401) {
        // Mismo mensaje exista o no el usuario, igual que el backend
        setError('Usuario o contraseña incorrectos')
      } else {
        setError('No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="text-sm text-disagro-tenue">Verificando sesión…</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 rounded-3xl bg-linear-120 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro px-6 py-6 text-center">
          <img src="/disagro-blanco.png" alt="Disagro" className="mx-auto mb-3 h-6" />
          <p className="font-titulo text-lg font-bold text-white">Panel de administración</p>
          <p className="text-[13px] text-[#d6f5df]">Feria de Promociones · Edición 2026</p>
        </div>

        {estadoPrevio?.expirada && (
          <p
            className="mb-4 rounded-2xl border-[1.5px] border-[#f4d78a] bg-[#fff7e6] px-4 py-3 text-[13px] font-medium text-[#7a5a12]"
            data-testid="aviso-sesion-expirada"
          >
            Tu sesión terminó. Vuelve a iniciar sesión para continuar.
          </p>
        )}

        <form
          onSubmit={enviar}
          className="rounded-3xl bg-white p-6 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]"
        >
          <label htmlFor="usuario" className="mb-1.5 block text-xs font-semibold text-disagro-texto">
            Usuario
          </label>
          <input
            id="usuario"
            name="usuario"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            autoComplete="username"
            placeholder="admin"
            className="mb-4 w-full rounded-xl border-[1.5px] border-disagro-borde bg-disagro-campo px-3.5 py-3 text-sm text-disagro-tinta outline-none focus:border-disagro-verde-claro"
          />

          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-disagro-texto">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border-[1.5px] border-disagro-borde bg-disagro-campo px-3.5 py-3 text-sm text-disagro-tinta outline-none focus:border-disagro-verde-claro"
          />

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700" data-testid="error-login">
              {error}
            </p>
          )}
          {demasiadosIntentos && (
            <p
              className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-800"
              data-testid="error-rate-limit"
            >
              {demasiadosIntentos}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            data-testid="boton-entrar"
            className={`mt-5 w-full rounded-full px-5 py-3.5 font-titulo text-sm font-bold text-white transition ${
              enviando
                ? 'cursor-not-allowed bg-[#b7c9bd]'
                : 'cursor-pointer bg-linear-135 from-disagro-verde to-disagro-verde-claro hover:brightness-105'
            }`}
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
