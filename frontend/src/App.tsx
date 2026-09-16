import { useState } from 'react'
import { CodigosConfirmados } from './pages/CodigosConfirmados'
import { Confirmacion } from './pages/Confirmacion'
import type { RespuestaConfirmacion } from './types/api'

/**
 * Por ahora la app alterna entre el formulario y la pantalla de códigos con un
 * estado local. Cuando lleguen el portafolio y el panel admin se cambiará por
 * rutas de verdad (el enlace del correo abre /portafolio#token=...).
 */
export default function App() {
  const [confirmacion, setConfirmacion] = useState<RespuestaConfirmacion | null>(null)

  if (confirmacion) {
    return <CodigosConfirmados respuesta={confirmacion} onVolver={() => setConfirmacion(null)} />
  }

  return <Confirmacion onConfirmado={setConfirmacion} />
}
