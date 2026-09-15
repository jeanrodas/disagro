import { leerCredencialesAdmin } from '../../src/config/env';
import { hashearPassword, verificarPassword } from '../../src/lib/password';
import { prisma } from '../../src/lib/prisma';

export type ResultadoSeedAdmin = 'creado' | 'actualizado' | 'sin cambios';

/**
 * Crea o sincroniza el administrador desde ADMIN_USER y ADMIN_PASSWORD.
 * No hay registro público de administradores: esta es la única forma de crearlos.
 *
 * - No existe                       => se crea con el hash bcrypt.
 * - Existe y la contraseña coincide => no se toca (bcrypt genera un hash distinto
 *                                      cada vez, así que no se re-hashea sin motivo).
 * - Existe y la contraseña cambió   => se actualiza el hash.
 */
export async function sembrarAdmin(): Promise<{ usuario: string; resultado: ResultadoSeedAdmin }> {
  const { usuario, password } = leerCredencialesAdmin();

  const existente = await prisma.admin.findUnique({ where: { usuario }, select: { passwordHash: true } });
  if (existente && (await verificarPassword(password, existente.passwordHash))) {
    return { usuario, resultado: 'sin cambios' };
  }

  const passwordHash = await hashearPassword(password);
  await prisma.admin.upsert({
    where: { usuario },
    update: { passwordHash },
    create: { usuario, passwordHash },
  });

  return { usuario, resultado: existente ? 'actualizado' : 'creado' };
}

// Ejecución directa: npm run db:seed:admin
if (require.main === module) {
  sembrarAdmin()
    .then(({ usuario, resultado }) => console.log(`[seed] Admin "${usuario}": ${resultado}`))
    .catch((err) => {
      console.error(`[seed] Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
