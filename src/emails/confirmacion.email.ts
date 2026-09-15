/**
 * Plantilla del correo de confirmación (copia de respaldo de los códigos).
 * Función pura: recibe datos y devuelve asunto, HTML y texto plano, así que se
 * prueba sin enviar nada. Todo dato del usuario se escapa antes de ir al HTML.
 */

export interface CodigoCorreo {
  codigo: string;
  tipo: 'SERVICIO' | 'PRODUCTO';
  porcentaje: number;
}

export interface DatosCorreoConfirmacion {
  nombre: string;
  fechaEvento: Date;
  codigos: CodigoCorreo[];
  /** Enlace al portafolio con el token de sesión en el fragmento (#token=...). */
  enlacePortafolio: string;
}

export interface CorreoRenderizado {
  asunto: string;
  html: string;
  texto: string;
}

const COLOR_MARCA = '#00843D';

const ETIQUETA_TIPO: Record<CodigoCorreo['tipo'], string> = {
  SERVICIO: 'en servicios',
  PRODUCTO: 'en productos',
};

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const formatearFecha = (fecha: Date) =>
  new Intl.DateTimeFormat('es-GT', { dateStyle: 'full', timeZone: 'America/Guatemala' }).format(fecha);

export function plantillaConfirmacion(datos: DatosCorreoConfirmacion): CorreoRenderizado {
  const nombre = escaparHtml(datos.nombre);
  const fecha = formatearFecha(datos.fechaEvento);
  const enlace = escaparHtml(datos.enlacePortafolio);
  const hayCodigos = datos.codigos.length > 0;

  const asunto = 'Tu asistencia a la Feria Disagro está confirmada';

  const bloqueCodigos = hayCodigos
    ? datos.codigos
        .map(
          ({ codigo, tipo, porcentaje }) => `
          <tr>
            <td style="padding:16px;border:2px dashed ${COLOR_MARCA};border-radius:8px;text-align:center;">
              <div style="font-size:14px;color:#555;">${porcentaje}% de descuento ${ETIQUETA_TIPO[tipo]}</div>
              <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;letter-spacing:2px;color:#111;margin-top:6px;">${escaparHtml(codigo)}</div>
            </td>
          </tr>
          <tr><td style="height:12px;"></td></tr>`,
        )
        .join('')
    : `
          <tr>
            <td style="padding:12px;background:#f5f5f5;border-radius:8px;color:#555;">
              Tu selección no alcanzó un descuento esta vez, pero en tu portafolio tienes el detalle de todo lo que elegiste.
            </td>
          </tr>`;

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f0f2f0;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${COLOR_MARCA};padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold;">Feria de Promociones Disagro</td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="font-size:16px;margin:0 0 12px;">Hola, ${nombre}:</p>
                <p style="font-size:15px;line-height:1.5;margin:0 0 20px;">
                  Confirmamos tu asistencia a la Feria Disagro el <strong>${fecha}</strong>.
                  ${hayCodigos ? 'Estos son tus códigos de descuento; preséntalos en la feria:' : ''}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bloqueCodigos}
                </table>
                <p style="text-align:center;margin:24px 0 8px;">
                  <a href="${enlace}" style="display:inline-block;background:${COLOR_MARCA};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">Ver mi portafolio</a>
                </p>
                <p style="font-size:12px;color:#777;line-height:1.4;margin:16px 0 0;">
                  Cada código se puede usar una sola vez. Este enlace abre tu portafolio personal: no lo compartas.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const lineasCodigos = hayCodigos
    ? datos.codigos.map(({ codigo, tipo, porcentaje }) => `  - ${codigo}: ${porcentaje}% de descuento ${ETIQUETA_TIPO[tipo]}`)
    : ['  Tu selección no alcanzó un descuento esta vez.'];

  const texto = [
    `Hola, ${datos.nombre}:`,
    '',
    `Confirmamos tu asistencia a la Feria Disagro el ${fecha}.`,
    '',
    hayCodigos ? 'Tus códigos de descuento:' : 'Códigos de descuento:',
    ...lineasCodigos,
    '',
    `Ver mi portafolio: ${datos.enlacePortafolio}`,
    '',
    'Cada código se puede usar una sola vez. Este enlace abre tu portafolio personal: no lo compartas.',
  ].join('\n');

  return { asunto, html, texto };
}
