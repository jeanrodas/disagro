import { prisma } from '../../src/lib/prisma';
import { sembrarAdmin } from './admin.seed';
import { CATEGORIAS, ITEMS } from './catalogo.data';
import { sembrarClientesDemo } from './demo.seed';

/**
 * Seed idempotente del catálogo.
 * Usa upsert por nombre (único en BD): correrlo varias veces no duplica, y si
 * cambia un precio o una descripción en catalogo.data.ts, se actualiza.
 * Todo corre en una transacción: o se aplica el catálogo completo o nada.
 */
async function main() {
  await prisma.$transaction(async (tx) => {
    const categoriaPorNombre = new Map<string, { id: string; tipo: string }>();

    for (const categoria of CATEGORIAS) {
      const { id } = await tx.categoria.upsert({
        where: { nombre: categoria.nombre },
        update: { tipo: categoria.tipo },
        create: categoria,
        select: { id: true },
      });
      categoriaPorNombre.set(categoria.nombre, { id, tipo: categoria.tipo });
    }

    for (const { categoria, ...item } of ITEMS) {
      const destino = categoriaPorNombre.get(categoria);
      if (!destino) throw new Error(`Categoría inexistente para "${item.nombre}": ${categoria}`);
      // Item.tipo y Categoria.tipo están duplicados en el esquema: aquí se garantiza que coincidan
      if (destino.tipo !== item.tipo) {
        throw new Error(`"${item.nombre}" es ${item.tipo} pero su categoría "${categoria}" es ${destino.tipo}`);
      }

      const datos = { ...item, categoriaId: destino.id };
      await tx.item.upsert({ where: { nombre: item.nombre }, update: datos, create: datos });
    }
  });

  const [categorias, servicios, productos] = await Promise.all([
    prisma.categoria.count(),
    prisma.item.count({ where: { tipo: 'SERVICIO' } }),
    prisma.item.count({ where: { tipo: 'PRODUCTO' } }),
  ]);
  console.log(
    `[seed] Catálogo sincronizado: ${categorias} categorías, ${servicios + productos} items ` +
      `(${servicios} servicios, ${productos} productos)`,
  );

  // Admin inicial desde ADMIN_USER y ADMIN_PASSWORD (única vía para crear administradores)
  const admin = await sembrarAdmin();
  console.log(`[seed] Admin "${admin.usuario}": ${admin.resultado}`);

  // Clientes de demostración (datos de prueba, ver demo.data.ts). Van por defecto
  // para que el panel no arranque vacío; SEED_DEMO=false los omite, por ejemplo en
  // un lanzamiento real donde no deben mezclarse con las métricas de clientes reales.
  if (process.env.SEED_DEMO === 'false') {
    console.log('[seed] Clientes de demo: omitidos (SEED_DEMO=false)');
    return;
  }

  const demo = await sembrarClientesDemo();
  for (const cliente of demo) {
    const codigos = cliente.codigos.length
      ? cliente.codigos.map((c) => `${c.codigo} (${c.porcentaje}%, ${c.estado})`).join(', ')
      : 'sin códigos';
    console.log(`[seed] Demo ${cliente.resultado.padEnd(10)} ${cliente.nombre} <${cliente.email}>: ${codigos}`);
  }
  const cuantos = (resultado: string) => demo.filter((cliente) => cliente.resultado === resultado).length;
  console.log(
    `[seed] Clientes de demo: ${cuantos('creado')} creados, ${cuantos('ya existía')} ya existían` +
      (cuantos('ocupado') > 0 ? `, ${cuantos('ocupado')} con el correo ocupado por otro cliente (no se tocan)` : ''),
  );
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
