import { prisma } from '../../src/lib/prisma';
import { sembrarAdmin } from './admin.seed';
import { CATEGORIAS, ITEMS } from './catalogo.data';

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
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
