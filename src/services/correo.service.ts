import { Resend } from 'resend';
import { env } from '../config/env';
import { plantillaConfirmacion, type DatosCorreoConfirmacion } from '../emails/confirmacion.email';

/**
 * Envío del correo de confirmación con Resend.
 *
 * Es un canal de RESPALDO: los códigos ya se entregaron en la respuesta HTTP.
 * Por eso esta función nunca lanza: registra el resultado en el log y devuelve
 * 'enviado', 'omitido' o 'fallido'.
 */

export type ResultadoEnvio = 'enviado' | 'omitido' | 'fallido';

let clienteResend: Resend | undefined;

/**
 * Enlace al portafolio con el token en el fragmento (#token=...).
 * El navegador nunca envía el fragmento al servidor, así que el token no queda
 * en logs de acceso ni en el header Referer; el frontend lo canjea con POST /api/sesion.
 */
export function construirEnlacePortafolio(tokenSesion: string): string {
  const url = new URL('/portafolio', env.APP_URL);
  url.hash = `token=${tokenSesion}`;
  return url.toString();
}

/** Correo parcialmente oculto para los logs: maria.gonzalez@x.com => ma***@x.com */
export function enmascararEmail(email: string): string {
  const [usuario = '', dominio = ''] = email.split('@');
  return `${usuario.slice(0, 2)}***@${dominio}`;
}

export async function enviarCorreoConfirmacion(
  destinatario: string,
  datos: DatosCorreoConfirmacion,
): Promise<ResultadoEnvio> {
  const para = enmascararEmail(destinatario);

  if (!env.RESEND_API_KEY) {
    console.warn(`[correo] Correo omitido: falta RESEND_API_KEY (destinatario ${para})`);
    return 'omitido';
  }

  try {
    clienteResend ??= new Resend(env.RESEND_API_KEY);
    const { asunto, html, texto } = plantillaConfirmacion(datos);

    const { data, error } = await clienteResend.emails.send({
      from: env.MAIL_FROM,
      to: [destinatario],
      subject: asunto,
      html,
      text: texto,
    });

    if (error) {
      console.error(`[correo] Resend rechazó el envío a ${para}: ${error.name} - ${error.message}`);
      return 'fallido';
    }

    console.log(`[correo] Enviado a ${para} (id ${data?.id ?? 'sin id'})`);
    return 'enviado';
  } catch (err) {
    console.error(`[correo] Error al enviar a ${para}: ${err instanceof Error ? err.message : String(err)}`);
    return 'fallido';
  }
}
