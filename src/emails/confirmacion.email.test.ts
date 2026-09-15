import { describe, expect, it } from 'vitest';
import { escaparHtml, plantillaConfirmacion, type DatosCorreoConfirmacion } from './confirmacion.email';

const base: DatosCorreoConfirmacion = {
  nombre: 'María José',
  fechaEvento: new Date('2026-10-15T00:00:00-06:00'),
  codigos: [
    { codigo: 'DISAGRO-SERV-25PJ87', tipo: 'SERVICIO', porcentaje: 5 },
    { codigo: 'DISAGRO-PROD-4M9CYW', tipo: 'PRODUCTO', porcentaje: 3 },
  ],
  enlacePortafolio: 'http://localhost:5173/portafolio#token=abc_DEF-123',
};

describe('plantillaConfirmacion', () => {
  it('incluye saludo, confirmación y fecha en español de Guatemala', () => {
    const { asunto, html, texto } = plantillaConfirmacion(base);
    expect(asunto).toContain('Feria Disagro');
    expect(html).toContain('Hola, María José');
    expect(texto).toContain('Confirmamos tu asistencia a la Feria Disagro');
    expect(texto).toContain('15 de octubre de 2026');
  });

  it('muestra cada código con su porcentaje y tipo, en HTML y en texto', () => {
    const { html, texto } = plantillaConfirmacion(base);
    for (const codigo of ['DISAGRO-SERV-25PJ87', 'DISAGRO-PROD-4M9CYW']) {
      expect(html).toContain(codigo);
      expect(texto).toContain(codigo);
    }
    expect(texto).toContain('DISAGRO-SERV-25PJ87: 5% de descuento en servicios');
    expect(texto).toContain('DISAGRO-PROD-4M9CYW: 3% de descuento en productos');
  });

  it('incluye el enlace al portafolio', () => {
    const { html, texto } = plantillaConfirmacion(base);
    expect(html).toContain('href="http://localhost:5173/portafolio#token=abc_DEF-123"');
    expect(texto).toContain('Ver mi portafolio: http://localhost:5173/portafolio#token=abc_DEF-123');
  });

  it('escapa el nombre para evitar inyección de HTML', () => {
    const { html } = plantillaConfirmacion({ ...base, nombre: '<img src=x onerror="alert(1)">' });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('sin códigos: lo explica y no muestra ningún código', () => {
    const { html, texto } = plantillaConfirmacion({ ...base, codigos: [] });
    expect(html).not.toContain('DISAGRO-');
    expect(texto).toContain('no alcanzó un descuento');
  });
});

describe('escaparHtml', () => {
  it('escapa los 5 caracteres especiales', () => {
    expect(escaparHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});
