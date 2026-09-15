/**
 * Prisma traduce `contains` a ILIKE '%texto%' sin escapar los comodines de LIKE:
 * sin esto, buscar "%" devolvería todos los registros y "_" cualquier carácter.
 */
export const escaparComodinesLike = (texto: string) => texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
