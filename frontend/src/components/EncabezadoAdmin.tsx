import { Link, useNavigate } from 'react-router-dom'
import { logoutAdmin } from '../lib/api/admin'

interface Props {
  usuario: string
}

/** Barra del panel: identifica al admin y permite cerrar sesión. */
export function EncabezadoAdmin({ usuario }: Props) {
  const navigate = useNavigate()

  const cerrarSesion = async () => {
    // logoutAdmin borra la cookie; no exige sesión válida, así que no puede fallar
    // por expiración y siempre deja al usuario en el login.
    await logoutAdmin().catch(() => undefined)
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-linear-115 from-disagro-verde-oscuro via-disagro-verde to-disagro-verde-claro px-6 py-5">
      <Link to="/admin" className="flex items-center gap-3.5">
        <img src="/disagro-blanco.png" alt="Disagro" className="h-6" />
        <span className="h-6 w-px bg-white/35" />
        <span className="font-titulo text-[15px] font-bold text-white">Panel de administración</span>
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-[12.5px] text-[#d6f5df]">
          Sesión de <b className="text-white">{usuario}</b>
        </span>
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          data-testid="cerrar-sesion"
          className="rounded-full bg-white/15 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-white/25"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
