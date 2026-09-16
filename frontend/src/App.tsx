import { Navigate, Route, Routes } from 'react-router-dom'
import { Confirmacion } from './pages/Confirmacion'

/**
 * Rutas de la aplicación.
 *
 * El formulario deja de navegar por estado local: ahora hay rutas de verdad,
 * porque el enlace del correo apunta a una dirección concreta. La pantalla del
 * portafolio y las del panel de administración se agregan en los commits
 * siguientes.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Confirmacion />} />
      {/* Cualquier otra dirección vuelve al formulario */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
