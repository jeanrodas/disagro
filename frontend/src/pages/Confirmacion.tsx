import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatosCliente } from '../components/DatosCliente'
import { Encabezado } from '../components/Encabezado'
import { PanelSeleccion, type FiltroTipo } from '../components/PanelSeleccion'
import { PasoTitulo } from '../components/PasoTitulo'
import { obtenerItems } from '../lib/api/catalogo'
import { CorreoYaConfirmadoError, confirmarAsistencia } from '../lib/api/confirmacion'
import { esApiError, mensajeDeCampo } from '../lib/api/http'
import { calcularDescuentosPreview } from '../lib/descuentos-preview'
import { emailValido as esEmailValido, validarFormulario, type DatosFormulario, type ErroresFormulario } from '../lib/validacion-formulario'
import type { Item } from '../types/api'

const DATOS_VACIOS: DatosFormulario = { nombre: '', apellidos: '', email: '', fechaEvento: '' }

export function Confirmacion() {
  const navigate = useNavigate()
  const [datos, setDatos] = useState<DatosFormulario>(DATOS_VACIOS)
  const [erroresLocales, setErroresLocales] = useState<ErroresFormulario>({})
  const [items, setItems] = useState<Item[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroTipo>('TODOS')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enviando, setEnviando] = useState(false)
  /** Error del backend: de aquí salen los mensajes por campo de un 400. */
  const [errorApi, setErrorApi] = useState<unknown>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [yaConfirmado, setYaConfirmado] = useState<{ mensaje: string; url: string | null } | null>(null)
  const avisoRef = useRef<HTMLDivElement>(null)

  /**
   * El aviso del 409 vive arriba del formulario, pero el botón de confirmar está
   * abajo: sin esto, quien confirma desde el final de la página no ve la respuesta.
   * El efecto depende de `yaConfirmado`, que solo cambia cuando llega un 409, así
   * que el desplazamiento ocurre al aparecer el aviso y no en cada render.
   */
  useEffect(() => {
    if (!yaConfirmado) return
    avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [yaConfirmado])

  // El catálogo se pide una sola vez y se filtra en memoria: son 17 items y así
  // el buscador responde al instante, sin una petición por tecla.
  useEffect(() => {
    obtenerItems()
      .then((respuesta) => setItems(respuesta.items))
      .catch(() => setErrorGeneral('No se pudo cargar el catálogo. ¿Está corriendo el backend?'))
      .finally(() => setCargando(false))
  }, [])

  const emailValido = esEmailValido(datos.email)
  const bloqueado = !emailValido

  const itemsFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return items.filter((item) => {
      if (filtro !== 'TODOS' && item.tipo !== filtro) return false
      if (!texto) return true
      return item.nombre.toLowerCase().includes(texto) || item.descripcion.toLowerCase().includes(texto)
    })
  }, [items, filtro, busqueda])

  const seleccion = useMemo(() => items.filter((item) => seleccionados.has(item.id)), [items, seleccionados])
  const descuentos = useMemo(() => calcularDescuentosPreview(seleccion), [seleccion])

  const cambiarDato = (campo: keyof DatosFormulario, valor: string) => {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }))
    setErroresLocales((anteriores) => ({ ...anteriores, [campo]: undefined }))
    setYaConfirmado(null)
  }

  const alternarItem = (id: string) => {
    setSeleccionados((anteriores) => {
      const copia = new Set(anteriores)
      if (copia.has(id)) copia.delete(id)
      else copia.add(id)
      return copia
    })
  }

  const errores: ErroresFormulario = {
    nombre: erroresLocales.nombre ?? mensajeDeCampo(errorApi, 'nombre') ?? undefined,
    apellidos: erroresLocales.apellidos ?? mensajeDeCampo(errorApi, 'apellidos') ?? undefined,
    email: erroresLocales.email ?? mensajeDeCampo(errorApi, 'email') ?? undefined,
    fechaEvento: erroresLocales.fechaEvento ?? mensajeDeCampo(errorApi, 'fechaEvento') ?? undefined,
  }

  const puedeConfirmar = emailValido && seleccionados.size > 0 && !enviando

  /**
   * El backend devuelve una URL absoluta en el 409. Si es de este mismo origen se
   * navega con el router, sin recargar la página; si algún día apuntara a otro
   * dominio, se abre tal cual.
   */
  const irAlPortafolio = () => {
    const destino = yaConfirmado?.url
    if (!destino) {
      navigate('/portafolio')
      return
    }
    try {
      const url = new URL(destino)
      if (url.origin === window.location.origin) navigate(url.pathname + url.search + url.hash)
      else window.location.assign(destino)
    } catch {
      navigate('/portafolio')
    }
  }

  const confirmar = async () => {
    setErrorApi(null)
    setErrorGeneral(null)
    setYaConfirmado(null)

    const erroresDelFormulario = validarFormulario(datos)
    if (Object.keys(erroresDelFormulario).length > 0) {
      setErroresLocales(erroresDelFormulario)
      return
    }

    setEnviando(true)
    try {
      await confirmarAsistencia({ ...datos, itemIds: [...seleccionados] })
      // La confirmación deja la cookie de sesión: el portafolio se carga con ella
      navigate('/portafolio')
    } catch (error) {
      if (error instanceof CorreoYaConfirmadoError) {
        setYaConfirmado({ mensaje: error.message, url: error.portafolioUrl })
      } else if (esApiError(error) && error.status === 400) {
        setErrorApi(error)
        setErrorGeneral('Revisa los datos marcados.')
      } else {
        setErrorGeneral(esApiError(error) ? error.message : 'No se pudo confirmar. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-[1160px] px-5 pt-6 pb-16">
      <Encabezado />

      {yaConfirmado && (
        <div
          ref={avisoRef}
          className="mb-6 flex flex-wrap items-center gap-3.5 rounded-2xl border-[1.5px] border-[#f4d78a] bg-[#fff7e6] px-4 py-4"
          data-testid="aviso-ya-confirmado"
        >
          <span className="text-xl" aria-hidden="true">
            ✉️
          </span>
          <div className="min-w-[220px] flex-1">
            <p className="font-titulo text-sm font-bold text-[#7a5a12]">Este correo ya confirmó su asistencia</p>
            <p className="text-[12.5px] text-[#8a6a2a]">{yaConfirmado.mensaje}</p>
          </div>
          <button
            type="button"
            onClick={irAlPortafolio}
            data-testid="ver-portafolio"
            className="rounded-full bg-disagro-verde px-4 py-2.5 font-titulo text-[13px] font-bold text-white transition hover:bg-disagro-verde-oscuro"
          >
            Ver mi portafolio →
          </button>
        </div>
      )}

      {errorGeneral && (
        <p className="mb-6 rounded-2xl border-[1.5px] border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorGeneral}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* ① Datos del cliente */}
        <section>
          <PasoTitulo numero={1} titulo="Ingrese su información" />
          <DatosCliente datos={datos} errores={errores} emailValido={emailValido} onCambiar={cambiarDato} />
        </section>

        {/* ② Selección, bloqueada hasta que el email sea válido */}
        <section>
          <PasoTitulo numero={2} titulo="Seleccione servicios y productos" apagado={bloqueado} />
          <PanelSeleccion
            items={itemsFiltrados}
            cargando={cargando}
            seleccionados={seleccionados}
            busqueda={busqueda}
            filtro={filtro}
            descuentos={descuentos}
            bloqueado={bloqueado}
            onBuscar={setBusqueda}
            onFiltrar={setFiltro}
            onAlternar={alternarItem}
          />

          <button
            type="button"
            onClick={confirmar}
            disabled={!puedeConfirmar}
            data-testid="boton-confirmar"
            className={`mt-4 w-full rounded-full px-5 py-4 font-titulo text-[15px] font-bold text-white transition ${
              puedeConfirmar
                ? 'cursor-pointer bg-linear-135 from-disagro-verde to-disagro-verde-claro shadow-[0_18px_32px_-18px_rgba(23,155,68,0.9)] hover:brightness-105'
                : 'cursor-not-allowed bg-[#b7c9bd]'
            }`}
          >
            {enviando ? 'Confirmando…' : 'Confirmar asistencia →'}
          </button>
          <p className="mt-2.5 text-center text-[11.5px] text-disagro-tenue">
            {seleccionados.size} elemento(s) seleccionado(s)
          </p>
        </section>
      </div>
    </main>
  )
}
