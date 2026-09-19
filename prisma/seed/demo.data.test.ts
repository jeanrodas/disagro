import { describe, expect, it } from 'vitest';
import { calcularDescuentos } from '../../src/domain/descuentos';
import { ITEMS } from './catalogo.data';
import { CLIENTES_DEMO, type ClienteDemo } from './demo.data';

/**
 * Los clientes de demo existen para enseñar TODOS los casos del sistema. Si alguien
 * cambia un precio del catálogo o una regla de descuento, un cliente podría dejar de
 * representar su caso sin que nadie lo note: este test lo detecta.
 *
 * Usa la función de dominio real con los precios del catálogo real.
 */

const itemPorNombre = new Map(ITEMS.map((item) => [item.nombre, item]));

function itemsDe(cliente: ClienteDemo) {
  return cliente.items.map((nombre) => {
    const item = itemPorNombre.get(nombre);
    if (!item) throw new Error(`"${nombre}" no está en el catálogo`);
    return item;
  });
}

function porcentajesDe(cliente: ClienteDemo) {
  const { servicios, productos } = calcularDescuentos(itemsDe(cliente));
  return { servicios: servicios.porcentaje, productos: productos.porcentaje };
}

describe('clientes de demostración', () => {
  it.each(CLIENTES_DEMO.map((cliente) => [cliente.caso, cliente] as const))(
    '%s: las reglas del dominio dan el resultado que dice cubrir',
    (_caso, cliente) => {
      expect(porcentajesDe(cliente)).toEqual(cliente.esperado);
    },
  );

  it('entre todos cubren cada caso del sistema', () => {
    const resultados = CLIENTES_DEMO.map((cliente) => ({ cliente, ...porcentajesDe(cliente) }));

    expect(resultados.some((r) => r.servicios === 5)).toBe(true);
    expect(resultados.some((r) => r.productos === 5)).toBe(true);
    expect(resultados.some((r) => r.productos === 3)).toBe(true);
    expect(resultados.some((r) => r.servicios > 0 && r.productos > 0)).toBe(true);
    expect(resultados.some((r) => r.servicios === 0 && r.productos === 0)).toBe(true);

    // El 3% de servicios con exactamente 2 servicios que suman Q1,500 o menos
    const tresEnServicios = resultados.find((r) => r.servicios === 3);
    expect(tresEnServicios).toBeDefined();
    const servicios = itemsDe(tresEnServicios!.cliente).filter((item) => item.tipo === 'SERVICIO');
    expect(servicios).toHaveLength(2);
    expect(servicios.reduce((suma, item) => suma + Number(item.precio), 0)).toBeLessThanOrEqual(1500);
  });

  it('solo se canjean códigos que el cliente de verdad obtiene', () => {
    for (const cliente of CLIENTES_DEMO) {
      for (const tipo of cliente.canjear ?? []) {
        const porcentaje = tipo === 'SERVICIO' ? cliente.esperado.servicios : cliente.esperado.productos;
        expect(porcentaje, `${cliente.email} canjea un código de ${tipo} que no tiene`).toBeGreaterThan(0);
      }
    }
  });

  it('quien canjeó tiene su evento hoy: los códigos se canjean en el evento', () => {
    const canjearon = CLIENTES_DEMO.filter((cliente) => (cliente.canjear?.length ?? 0) > 0);
    expect(canjearon.length).toBeGreaterThanOrEqual(1);
    for (const cliente of canjearon) expect(cliente.diasHastaEvento).toBe(0);
  });

  it('los demás tienen el evento en el futuro y confirmaron antes', () => {
    for (const cliente of CLIENTES_DEMO) {
      expect(cliente.diasDesdeConfirmacion).toBeGreaterThan(0);
      if (!cliente.canjear?.length) expect(cliente.diasHastaEvento).toBeGreaterThan(0);
    }
  });

  it('correos únicos, en minúsculas y con dominios que no son de ejemplo ni de correo público', () => {
    const emails = CLIENTES_DEMO.map((cliente) => cliente.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const email of emails) {
      expect(email).toBe(email.toLowerCase());
      expect(email).not.toMatch(/@(example\.(com|org|net)|gmail\.com|hotmail\.com|yahoo\.com|correo\.gt)$/);
    }
  });
});
