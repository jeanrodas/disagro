import type { Prisma, TipoItem } from '../../src/generated/prisma/client';

/**
 * Catálogo de la feria: categorías, servicios y productos de Disagro.
 * Las fichas técnicas son valores de referencia para la demo; las dosis de
 * agroquímicos siempre deben tomarse de la etiqueta registrada del producto.
 */

export const CATEGORIAS = [
  { nombre: 'Servicios Analíticos', tipo: 'SERVICIO' },
  { nombre: 'Tecnología', tipo: 'SERVICIO' },
  { nombre: 'Asesoría', tipo: 'SERVICIO' },
  { nombre: 'Nutrición', tipo: 'PRODUCTO' },
  { nombre: 'Semillas', tipo: 'PRODUCTO' },
  { nombre: 'Bioestimulantes', tipo: 'PRODUCTO' },
  { nombre: 'Protección', tipo: 'PRODUCTO' },
] as const satisfies readonly { nombre: string; tipo: TipoItem }[];

/** Solo se aceptan nombres de categoría existentes: un typo no compila. */
type NombreCategoria = (typeof CATEGORIAS)[number]['nombre'];

export type ItemSeed = Omit<Prisma.ItemCreateInput, 'id' | 'categoria' | 'selecciones'> & {
  precio: string;
  beneficios: string[];
  categoria: NombreCategoria;
};

const NOTA_ETIQUETA = 'Dosis de referencia. Leer y seguir siempre las indicaciones de la etiqueta registrada.';

export const ITEMS: readonly ItemSeed[] = [
  // ───────────────────────────── SERVICIOS ─────────────────────────────
  {
    nombre: 'Análisis de suelos (fertilidad)',
    descripcion:
      'Determinación en laboratorio de la fertilidad del suelo: pH, materia orgánica, macro y micronutrientes y capacidad de intercambio catiónico, con interpretación agronómica.',
    precio: '850.00',
    tipo: 'SERVICIO',
    categoria: 'Servicios Analíticos',
    imagenUrl: '/images/analisis-suelos.jpg',
    beneficios: [
      'Base para un plan de fertilización ajustado a cada lote',
      'Evita aplicar nutrientes de más o de menos',
      'Informe con interpretación y recomendación agronómica',
    ],
    fichaTecnica: {
      tipoMuestra: 'Suelo, 1 kg compuesto de 15 a 20 submuestras por lote',
      profundidadMuestreo: '0-30 cm',
      parametros: ['pH', 'Materia orgánica', 'N', 'P', 'K', 'Ca', 'Mg', 'S', 'Fe', 'Cu', 'Zn', 'Mn', 'B', 'CIC'],
      metodologia: 'Extracción Mehlich III y Olsen modificado',
      tiempoEntregaDias: 7,
      entregable: 'Informe PDF con interpretación y recomendación',
    },
  },
  {
    nombre: 'Análisis foliar y de frutos',
    descripcion:
      'Análisis del contenido nutricional en hojas y frutos para detectar deficiencias o excesos que el suelo no muestra y corregirlos durante el ciclo.',
    precio: '1100.00',
    tipo: 'SERVICIO',
    categoria: 'Servicios Analíticos',
    imagenUrl: '/images/analisis-foliar.jpg',
    beneficios: [
      'Detecta deficiencias antes de que afecten el rendimiento',
      'Permite corregir la nutrición en plena temporada',
      'Complementa el análisis de suelo para decisiones más precisas',
    ],
    fichaTecnica: {
      tipoMuestra: 'Hojas recién maduras o frutos, según protocolo del cultivo',
      cantidadMuestra: '50-100 hojas o 6-10 frutos por lote',
      parametros: ['N', 'P', 'K', 'Ca', 'Mg', 'S', 'Fe', 'Cu', 'Zn', 'Mn', 'B'],
      cultivos: ['Café', 'Banano', 'Caña de azúcar', 'Aguacate', 'Hortalizas'],
      tiempoEntregaDias: 8,
    },
  },
  {
    nombre: 'Análisis de aguas para riego',
    descripcion:
      'Evaluación de la calidad del agua de riego: salinidad, sodicidad y iones que pueden dañar el suelo, obstruir goteros o afectar al cultivo.',
    precio: '750.00',
    tipo: 'SERVICIO',
    categoria: 'Servicios Analíticos',
    imagenUrl: '/images/analisis-aguas.jpg',
    beneficios: [
      'Previene problemas de salinización del suelo',
      'Protege el sistema de riego contra taponamientos',
      'Ajusta la fertirrigación a la calidad real del agua',
    ],
    fichaTecnica: {
      tipoMuestra: 'Agua, 1 L en envase limpio y refrigerado',
      parametros: ['pH', 'Conductividad eléctrica', 'Na', 'RAS', 'Bicarbonatos', 'Cloruros', 'Boro', 'Dureza'],
      clasificacion: 'Riverside (USDA) para riesgo de salinidad y sodicidad',
      tiempoEntregaDias: 5,
    },
  },
  {
    nombre: 'Análisis de solución de suelos',
    descripcion:
      'Medición de los nutrientes disponibles en la solución del suelo para monitorear y ajustar programas de fertirriego durante el ciclo del cultivo.',
    precio: '950.00',
    tipo: 'SERVICIO',
    categoria: 'Servicios Analíticos',
    imagenUrl: '/images/analisis-solucion-suelos.jpg',
    beneficios: [
      'Muestra lo que la raíz realmente tiene disponible',
      'Permite ajustar el fertirriego semana a semana',
    ],
    fichaTecnica: {
      tipoMuestra: 'Solución obtenida con lisímetro de succión o extracto de pasta saturada',
      parametros: ['pH', 'Conductividad eléctrica', 'NO3', 'NH4', 'K', 'Ca', 'Mg', 'SO4', 'Cl', 'Na'],
      aplicacion: 'Monitoreo de programas de fertirriego',
      frecuenciaRecomendada: 'Quincenal durante el ciclo',
      tiempoEntregaDias: 5,
    },
  },
  {
    nombre: 'Diagnóstico AgritecGEO (agricultura digital)',
    descripcion:
      'Diagnóstico de la finca con agricultura digital: imágenes satelitales y de dron, índices de vegetación y mapas de variabilidad para manejar el cultivo por zonas.',
    precio: '2500.00',
    tipo: 'SERVICIO',
    categoria: 'Tecnología',
    imagenUrl: '/images/agritecgeo.jpg',
    beneficios: [
      'Identifica zonas de bajo vigor sin recorrer toda la finca',
      'Dirige insumos solo donde se necesitan',
      'Mapas georreferenciados para dar seguimiento entre ciclos',
    ],
    fichaTecnica: {
      tecnologia: ['Imágenes satelitales multiespectrales', 'Vuelo de dron'],
      indices: ['NDVI', 'NDRE'],
      areaIncluida: 'Hasta 50 ha',
      entregables: ['Mapa de vigor', 'Mapa de zonas de manejo', 'Informe de recomendaciones'],
      tiempoEntregaDias: 10,
    },
  },
  {
    nombre: 'Asesoría agronómica FertiCROP (plan nutricional)',
    descripcion:
      'Acompañamiento de un agrónomo para diseñar un plan nutricional por etapa fenológica, basado en los análisis de la finca y el rendimiento esperado.',
    precio: '1800.00',
    tipo: 'SERVICIO',
    categoria: 'Asesoría',
    imagenUrl: '/images/asesoria-ferticrop.jpg',
    beneficios: [
      'Plan de fertilización hecho a la medida de la finca',
      'Mejor retorno por cada quetzal invertido en fertilizante',
      'Seguimiento técnico durante el ciclo',
    ],
    fichaTecnica: {
      modalidad: 'Visita de campo y seguimiento remoto',
      duracion: '1 ciclo de cultivo',
      incluye: ['Visita técnica de diagnóstico', 'Plan nutricional por etapa fenológica', '2 visitas de seguimiento'],
      requisitos: 'Análisis de suelo con menos de 12 meses de antigüedad',
    },
  },
  {
    nombre: 'Análisis de insumos agrícolas',
    descripcion:
      'Control de calidad de fertilizantes y enmiendas para verificar que su composición cumple con la garantía declarada en la etiqueta.',
    precio: '680.00',
    tipo: 'SERVICIO',
    categoria: 'Servicios Analíticos',
    imagenUrl: '/images/analisis-insumos.jpg',
    beneficios: [
      'Verifica que se recibe lo que se pagó',
      'Respalda reclamos a proveedores con datos de laboratorio',
    ],
    fichaTecnica: {
      tipoMuestra: 'Fertilizante sólido (500 g) o líquido (500 mL)',
      parametros: ['N total', 'P2O5', 'K2O', 'Humedad', 'Granulometría'],
      uso: 'Verificación de la garantía de composición',
      tiempoEntregaDias: 7,
    },
  },

  // ───────────────────────────── PRODUCTOS ─────────────────────────────
  {
    nombre: 'Fertilizante FertiCROP (saco 50kg)',
    descripcion:
      'Mezcla de fertilizante granulado formulada a la medida según el análisis de suelo y el requerimiento del cultivo.',
    precio: '485.00',
    tipo: 'PRODUCTO',
    categoria: 'Nutrición',
    imagenUrl: '/images/ferticrop.jpg',
    beneficios: [
      'Fórmula ajustada a la necesidad real del suelo',
      'Nutrición balanceada en una sola aplicación',
      'Gránulo uniforme para una distribución pareja',
    ],
    fichaTecnica: {
      presentacion: 'Saco de 50 kg',
      tipo: 'Mezcla física granulada',
      formulacion: 'A la medida según análisis (ejemplo: 18-6-12-3MgO)',
      cultivos: ['Café', 'Maíz', 'Caña de azúcar', 'Hortalizas'],
      dosisReferencia: '4-8 qq/mz por ciclo, según análisis de suelo',
      aplicacion: 'Al suelo, en banda o en corona',
    },
  },
  {
    nombre: 'NITRO XTEND XP (saco 50kg)',
    descripcion:
      'Fuente de nitrógeno estabilizada con inhibidor de ureasa que reduce las pérdidas por volatilización y mantiene el nitrógeno disponible por más tiempo.',
    precio: '560.00',
    tipo: 'PRODUCTO',
    categoria: 'Nutrición',
    imagenUrl: '/images/nitro-xtend-xp.jpg',
    beneficios: [
      'Menos pérdida de nitrógeno por volatilización',
      'Mayor eficiencia del nitrógeno aplicado',
      'Aplicaciones más flexibles ante la falta de lluvia',
    ],
    fichaTecnica: {
      presentacion: 'Saco de 50 kg',
      composicion: 'Urea 46% N estabilizada con inhibidor de ureasa (NBPT)',
      cultivos: ['Maíz', 'Caña de azúcar', 'Café', 'Pastos'],
      dosisReferencia: '2-4 qq/mz, fraccionado',
      aplicacion: 'Al voleo o incorporado al suelo',
    },
  },
  {
    nombre: 'PELICANO al suelo (saco 50kg)',
    descripcion:
      'Fertilizante complejo granulado para aplicación al suelo, pensado para la fertilización de siembra en granos básicos.',
    precio: '420.00',
    tipo: 'PRODUCTO',
    categoria: 'Nutrición',
    imagenUrl: '/images/pelicano.jpg',
    beneficios: [
      'Fósforo disponible para un buen arranque de la raíz',
      'Cada gránulo contiene todos los nutrientes de la fórmula',
    ],
    fichaTecnica: {
      presentacion: 'Saco de 50 kg',
      tipo: 'Fertilizante complejo granulado',
      formula: '20-20-0',
      cultivos: ['Maíz', 'Frijol', 'Sorgo'],
      dosisReferencia: '3-4 qq/mz a la siembra',
      aplicacion: 'Al suelo, en banda junto a la semilla sin contacto directo',
    },
  },
  {
    nombre: 'ULTRAFERT soluble',
    descripcion:
      'Fertilizante NPK 100% soluble con micronutrientes quelatados, para fertirriego y aplicaciones foliares.',
    precio: '390.00',
    tipo: 'PRODUCTO',
    categoria: 'Nutrición',
    imagenUrl: '/images/ultrafert.jpg',
    beneficios: [
      'Se disuelve por completo sin tapar goteros',
      'Micronutrientes quelatados de rápida absorción',
      'Sirve para fertirriego y aspersión foliar',
    ],
    fichaTecnica: {
      presentacion: 'Saco de 25 kg',
      formula: '19-19-19 + micronutrientes quelatados',
      solubilidad: '100% soluble en agua',
      cultivos: ['Hortalizas', 'Melón', 'Sandía', 'Ornamentales'],
      dosisReferencia: 'Fertirriego: 1-2 kg por cada 1,000 L de agua. Foliar: 2-3 g/L',
      aplicacion: 'Fertirriego o aspersión foliar',
    },
  },
  {
    nombre: 'Semilla de maíz híbrido PRIME (bolsa)',
    descripcion:
      'Maíz híbrido de grano blanco con alto potencial de rendimiento y buena adaptación a las zonas maiceras de Guatemala.',
    precio: '1250.00',
    tipo: 'PRODUCTO',
    categoria: 'Semillas',
    imagenUrl: '/images/maiz-prime.jpg',
    beneficios: [
      'Alto potencial de rendimiento con manejo tecnificado',
      'Buena sanidad de mazorca y tolerancia al acame',
      'Semilla tratada para proteger la germinación',
    ],
    fichaTecnica: {
      presentacion: 'Bolsa de 60,000 semillas',
      tipoGrano: 'Blanco dentado',
      ciclo: 'Intermedio, 120-130 días a cosecha',
      densidadSiembra: '1 bolsa por manzana (~60,000 plantas/mz)',
      altitudRecomendada: '0-1,400 msnm',
      potencialRendimiento: 'Hasta 120 qq/mz con manejo tecnificado',
      tratamientoSemilla: 'Fungicida e insecticida',
    },
  },
  {
    nombre: 'Semilla de hortalizas (sobre)',
    descripcion:
      'Semilla certificada de hortalizas con alto porcentaje de germinación para producción en almácigo y trasplante.',
    precio: '180.00',
    tipo: 'PRODUCTO',
    categoria: 'Semillas',
    imagenUrl: '/images/semilla-hortalizas.jpg',
    beneficios: [
      'Germinación alta y uniforme',
      'Plántulas vigorosas para un trasplante exitoso',
    ],
    fichaTecnica: {
      presentacion: 'Sobre de 5,000 semillas',
      especiesDisponibles: ['Tomate', 'Chile pimiento', 'Repollo', 'Brócoli', 'Cebolla'],
      germinacionMinima: '85%',
      purezaFisica: '99%',
      recomendacion: 'Siembra en bandeja de almácigo y trasplante a los 25-30 días',
    },
  },
  {
    nombre: 'Bioestimulante',
    descripcion:
      'Bioestimulante a base de extracto de algas marinas y aminoácidos que ayuda al cultivo a superar el estrés y mejora la floración y el cuajado.',
    precio: '340.00',
    tipo: 'PRODUCTO',
    categoria: 'Bioestimulantes',
    imagenUrl: '/images/bioestimulante.jpg',
    beneficios: [
      'Mejor recuperación ante sequía, calor o trasplante',
      'Favorece la floración y el cuajado de frutos',
      'Compatible con la mayoría de fertilizantes foliares',
    ],
    fichaTecnica: {
      presentacion: 'Galón (3.785 L)',
      composicion: 'Extracto de algas marinas (Ascophyllum nodosum) y aminoácidos libres',
      cultivos: ['Café', 'Hortalizas', 'Frutales', 'Banano'],
      dosisReferencia: '1-2 L/ha por aplicación',
      momentoAplicacion: 'Prefloración, cuajado y momentos de estrés',
      aplicacion: 'Foliar o fertirriego',
    },
  },
  {
    nombre: 'Insecticida',
    descripcion:
      'Insecticida piretroide de amplio espectro para el control de plagas masticadoras y chupadoras en granos básicos y hortalizas.',
    precio: '295.00',
    tipo: 'PRODUCTO',
    categoria: 'Protección',
    imagenUrl: '/images/insecticida.jpg',
    beneficios: [
      'Acción rápida por contacto e ingestión',
      'Controla un amplio rango de plagas',
    ],
    fichaTecnica: {
      presentacion: 'Litro',
      ingredienteActivo: 'Lambda-cihalotrina 5% EC',
      modoAccion: 'Contacto e ingestión',
      plagasObjetivo: ['Gusano cogollero', 'Mosca blanca', 'Trips'],
      dosisReferencia: '0.3-0.5 L/ha',
      intervaloSeguridadDias: 14,
      nota: NOTA_ETIQUETA,
    },
  },
  {
    nombre: 'Fungicida',
    descripcion:
      'Fungicida sistémico con acción preventiva y curativa para el manejo de las principales enfermedades foliares.',
    precio: '310.00',
    tipo: 'PRODUCTO',
    categoria: 'Protección',
    imagenUrl: '/images/fungicida.jpg',
    beneficios: [
      'Protección preventiva y curativa',
      'Dos modos de acción que reducen el riesgo de resistencia',
      'Se mueve dentro de la planta y protege el follaje nuevo',
    ],
    fichaTecnica: {
      presentacion: 'Litro',
      ingredienteActivo: 'Azoxistrobina 20% + Difenoconazol 12.5% SC',
      modoAccion: 'Sistémico, preventivo y curativo',
      enfermedadesObjetivo: ['Roya del café', 'Sigatoka negra', 'Tizón temprano'],
      dosisReferencia: '0.5-0.75 L/ha',
      intervaloSeguridadDias: 14,
      nota: NOTA_ETIQUETA,
    },
  },
  {
    nombre: 'Herbicida',
    descripcion:
      'Herbicida sistémico no selectivo de postemergencia para el control de malezas gramíneas y de hoja ancha antes de la siembra.',
    precio: '275.00',
    tipo: 'PRODUCTO',
    categoria: 'Protección',
    imagenUrl: '/images/herbicida.jpg',
    beneficios: [
      'Controla malezas anuales y perennes desde la raíz',
      'Deja el terreno limpio para la siembra',
    ],
    fichaTecnica: {
      presentacion: 'Galón (3.785 L)',
      ingredienteActivo: 'Glifosato 35.6% SL',
      modoAccion: 'Sistémico, no selectivo, postemergente',
      malezasObjetivo: ['Gramíneas anuales y perennes', 'Malezas de hoja ancha'],
      dosisReferencia: '2-4 L/ha según tipo de maleza',
      nota: NOTA_ETIQUETA,
    },
  },
];
