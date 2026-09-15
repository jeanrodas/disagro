import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuración del CLI de Prisma (migraciones, generate, studio).
 * En Prisma 7 la URL de conexión se define aquí y no en schema.prisma.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // No se usa env('DATABASE_URL') porque lanza error si falta, y eso rompería
    // `prisma generate` (que no se conecta) durante `npm install` o el build de
    // Docker. Los comandos que sí se conectan (migrate) fallan si está vacía.
    url: process.env.DATABASE_URL ?? '',
  },
});
