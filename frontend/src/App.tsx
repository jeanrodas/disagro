import { Navigate, Route, Routes } from 'react-router-dom'
import { RutaProtegidaAdmin } from './components/RutaProtegidaAdmin'
import { Confirmacion } from './pages/Confirmacion'
import { Portafolio } from './pages/Portafolio'
import { DetalleCliente } from './pages/admin/DetalleCliente'
import { LoginAdmin } from './pages/admin/LoginAdmin'
import { PanelAdmin } from './pages/admin/PanelAdmin'

/**
 * Rutas de la aplicación.
 *
 * /portafolio es una ruta de verdad porque el enlace del correo apunta ahí
 * (/portafolio#token=...) y el aviso del 409 también lleva a esa dirección.
 *
 * Las rutas del panel cuelgan de RutaProtegidaAdmin, que comprueba la sesión
 * contra el backend antes de mostrar nada: la cookie del admin es httpOnly y el
 * frontend no puede leerla.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Confirmacion />} />
      <Route path="/portafolio" element={<Portafolio />} />

      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route element={<RutaProtegidaAdmin />}>
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/admin/clientes/:id" element={<DetalleCliente />} />
      </Route>

      {/* Cualquier otra dirección vuelve al formulario */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
