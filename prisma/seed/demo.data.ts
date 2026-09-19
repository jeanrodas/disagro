import type { TipoItem } from '../../src/domain/descuentos';

/**
 * Clientes de DEMOSTRACIÓN.
 *
 * Son datos de prueba y viajan en el repositorio a propósito: quien clone el
 * proyecto ve el panel de administración con datos desde el primer arranque, en
 * lugar de vacío. Se pueden omitir con SEED_DEMO=false.
 *
 * Personas ficticias. Los correos usan dominios .gt que NO existen (se comprobó por
 * DNS: sin registro SOA, NXDOMAIN), así que ningún mensaje podría llegarle a alguien
 * real. Se descartaron @correo.gt, que sí existe, y @gmail.com, donde casi cualquier
 * nombre corresponde ya a una bandeja real.
 *
 * Aquí NO hay porcentajes ni códigos: el seed los obtiene del flujo real de
 * confirmación, con los precios de la base de datos. El campo `esperado` solo
 * documenta qué caso cubre cada cliente, y demo.data.test.ts comprueba que las reglas
 * del dominio, con los precios del catálogo, dan de verdad ese resultado.
 */
export interface ClienteDemo {
  nombre: string;
  apellidos: string;
  email: string;
  /** Nombres exactos del catálogo (catalogo.data.ts). */
  items: readonly string[];
  /**
   * Hace cuántos días confirmó. Las fechas son relativas al momento del seed para que
   * sigan siendo creíbles lo ejecute quien lo ejecute y cuando sea.
   */
  diasDesdeConfirmacion: number;
  /** Dentro de cuántos días es su evento. 0 = hoy: los que ya canjearon estuvieron en él. */
  diasHastaEvento: number;
  /** Códigos que ya canjeó. Los códigos se canjean EN el evento, así que su evento es hoy. */
  canjear?: readonly TipoItem[];
  /** Qué caso del sistema representa. */
  caso: string;
  /** Solo documentación y test: el seed no lo usa para calcular nada. */
  esperado: { servicios: 0 | 3 | 5; productos: 0 | 3 | 5 };
}

export const CLIENTES_DEMO: readonly ClienteDemo[] = [
  {
    nombre: 'Carlos Estuardo',
    apellidos: 'Méndez Ruiz',
    email: 'cmendez@fincaelporvenir.gt',
    // Q850 + Q1,100 = Q1,950 en servicios, por encima de Q1,500. Un solo producto: no llega al 3%.
    items: ['Análisis de suelos (fertilidad)', 'Análisis foliar y de frutos', 'Fungicida'],
    diasDesdeConfirmacion: 9,
    diasHastaEvento: 0,
    canjear: ['SERVICIO'],
    caso: '5% en servicios',
    esperado: { servicios: 5, productos: 0 },
  },
  {
    nombre: 'Ana Lucía',
    apellidos: 'Xicará Tzul',
    email: 'ana.xicara@agricolalaesperanza.gt',
    // Exactamente 2 servicios: Q750 + Q680 = Q1,430, por debajo de Q1,500
    items: ['Análisis de aguas para riego', 'Análisis de insumos agrícolas'],
    diasDesdeConfirmacion: 7,
    diasHastaEvento: 12,
    caso: '3% en servicios',
    esperado: { servicios: 3, productos: 0 },
  },
  {
    nombre: 'Mynor Alexander',
    apellidos: 'Chávez Orellana',
    email: 'mchavez@cafetalsanrafael.gt',
    // 5 productos de nutrición
    items: [
      'Fertilizante FertiCROP (saco 50kg)',
      'NITRO XTEND XP (saco 50kg)',
      'PELICANO al suelo (saco 50kg)',
      'ULTRAFERT soluble',
      'Bioestimulante',
    ],
    diasDesdeConfirmacion: 6,
    diasHastaEvento: 19,
    caso: '5% en productos',
    esperado: { servicios: 0, productos: 5 },
  },
  {
    nombre: 'Sofía Alejandra',
    apellidos: 'Barrios Juárez',
    email: 'sbarrios@hortalizasdelaltiplano.gt',
    // 4 productos: semilla y protección de cultivo
    items: ['Semilla de hortalizas (sobre)', 'Insecticida', 'Fungicida', 'Herbicida'],
    diasDesdeConfirmacion: 4,
    diasHastaEvento: 26,
    caso: '3% en productos',
    esperado: { servicios: 0, productos: 3 },
  },
  {
    nombre: 'Julio César',
    apellidos: 'Coy Batz',
    email: 'jcoy@cooperativaxela.gt',
    // Servicios: Q2,500 + Q850 = Q3,350 (5%). Productos: 4 (3%). Los dos descuentos a la vez.
    items: [
      'Diagnóstico AgritecGEO (agricultura digital)',
      'Análisis de suelos (fertilidad)',
      'Semilla de maíz híbrido PRIME (bolsa)',
      'Fertilizante FertiCROP (saco 50kg)',
      'Bioestimulante',
      'Herbicida',
    ],
    diasDesdeConfirmacion: 3,
    diasHastaEvento: 0,
    canjear: ['PRODUCTO'],
    caso: 'descuento en servicios y en productos',
    esperado: { servicios: 5, productos: 3 },
  },
  {
    nombre: 'Rosa María',
    apellidos: 'Pérez Guzmán',
    email: 'rperez@agroexportadorachimaltenango.gt',
    // Un servicio y dos productos: no alcanza ningún umbral
    items: ['Análisis de solución de suelos', 'Semilla de hortalizas (sobre)', 'ULTRAFERT soluble'],
    diasDesdeConfirmacion: 1,
    diasHastaEvento: 33,
    caso: 'sin descuento',
    esperado: { servicios: 0, productos: 0 },
  },
];
