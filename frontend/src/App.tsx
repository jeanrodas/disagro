import { Navigate, Route, Routes } from 'react-router-dom'
import { Confirmacion } from './pages/Confirmacion'
import { Portafolio } from './pages/Portafolio'

/**
 * Rutas de la aplicación.
 *
 * /portafolio es una ruta de verdad porque el enlace del correo apunta ahí
 * (/portafolio#token=...) y el aviso del 409 también lleva a esa dirección.
 * Las rutas del panel de administración se agregarán aquí en la etapa siguiente.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Confirmacion />} />
      <Route path="/portafolio" element={<Portafolio />} />
      {/* Cualquier otra dirección vuelve al formulario */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
