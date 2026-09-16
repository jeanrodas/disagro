import { hoyEnGuatemala, type DatosFormulario, type ErroresFormulario } from '../lib/validacion-formulario'
import { CampoFormulario } from './CampoFormulario'

interface Props {
  datos: DatosFormulario
  errores: ErroresFormulario
  emailValido: boolean
  onCambiar: (campo: keyof DatosFormulario, valor: string) => void
}

/** Columna ①: los datos del cliente. El email es la llave que habilita la selección. */
export function DatosCliente({ datos, errores, emailValido, onCambiar }: Props) {
  const ayudaEmail = emailValido
    ? '✓ Email válido — selección habilitada'
    : datos.email
      ? null
      : 'Tu correo habilita el paso 2'

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_14px_36px_-26px_rgba(20,38,26,0.5)]">
      <CampoFormulario
        etiqueta="Nombre"
        name="nombre"
        value={datos.nombre}
        onChange={(evento) => onCambiar('nombre', evento.target.value)}
        placeholder="Introduzca su nombre"
        autoComplete="given-name"
        error={errores.nombre}
      />
      <CampoFormulario
        etiqueta="Apellidos"
        name="apellidos"
        value={datos.apellidos}
        onChange={(evento) => onCambiar('apellidos', evento.target.value)}
        placeholder="Introduzca sus apellidos"
        autoComplete="family-name"
        error={errores.apellidos}
      />
      <CampoFormulario
        etiqueta="Email"
        nota="· identificador"
        name="email"
        type="email"
        value={datos.email}
        onChange={(evento) => onCambiar('email', evento.target.value)}
        placeholder="Introduzca su email"
        autoComplete="email"
        error={errores.email}
        ayuda={ayudaEmail}
        ayudaEnVerde={emailValido}
      />
      <CampoFormulario
        etiqueta="Fecha de asistencia"
        name="fechaEvento"
        type="date"
        min={hoyEnGuatemala()}
        value={datos.fechaEvento}
        onChange={(evento) => onCambiar('fechaEvento', evento.target.value)}
        error={errores.fechaEvento}
      />
    </div>
  )
}
