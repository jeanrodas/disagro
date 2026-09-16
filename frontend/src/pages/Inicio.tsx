import { EstadoApi } from '../components/EstadoApi'

/**
 * Pantalla de prueba del andamiaje: confirma que Tailwind aplica estilos y que el
 * proxy de desarrollo llega al backend. Se reemplazará por el formulario de la feria.
 */
export function Inicio() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-disagro-arena px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-disagro-verde/20 bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-disagro-verde">Feria de Promociones</p>
        <h1 className="mt-2 text-4xl font-bold text-disagro-verde-oscuro sm:text-5xl">Disagro</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Confirma tu asistencia, elige los productos y servicios que te interesan y recibe tus códigos de descuento.
        </p>
        <EstadoApi />
      </div>
    </main>
  )
}
