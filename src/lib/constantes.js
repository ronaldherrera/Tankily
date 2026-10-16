// Catálogos compartidos. Los valores (claves) coinciden con los CHECK de la base de datos.

// Cada tipo de tanque tiene su "color de agua": la interfaz se tiñe con él al ver ese tanque.
// Los nombres visibles están en los diccionarios (tipos.<clave>).
export const TIPOS_TANQUE = {
  reef: { agua: '#3fa9ff', grupo: 'Marino' },
  marino_peces: { agua: '#4f8dff', grupo: 'Marino' },
  nano_marino: { agua: '#6cc4ff', grupo: 'Marino' },
  comunidad: { agua: '#46d6c4', grupo: 'Agua dulce' },
  plantado: { agua: '#7cdc8c', grupo: 'Agua dulce' },
  gambas: { agua: '#ff9a7a', grupo: 'Agua dulce' },
  ciclidos: { agua: '#b79cff', grupo: 'Agua dulce' },
  discos: { agua: '#ff86b4', grupo: 'Agua dulce' },
  agua_fria: { agua: '#ffc65c', grupo: 'Agua fría' },
  estanque: { agua: '#a8d672', grupo: 'Agua fría' },
  biotopo: { agua: '#d6a76c', grupo: 'Agua dulce' },
  paludario: { agua: '#8fd6a8', grupo: 'Otros' },
  otro: { agua: '#9fe7f5', grupo: 'Otros' },
};

// Dirección de la página de cada tipo (/tanques/agua-fria/) y vuelta al tipo; 'otro' no tiene página
export const slugTipo = (tipo) => tipo.replace(/_/g, '-');
export const tipoDeSlug = (slug) => Object.keys(TIPOS_TANQUE).find((k) => k !== 'otro' && slugTipo(k) === slug);

// Fotos por defecto según el tipo, tomadas de las imágenes de WikiTank. Cada tipo tiene varias
// para que dos tanques del mismo tipo sin foto propia no salgan iguales; la elección depende del
// id del tanque, así que siempre es la misma para cada uno.
const A = 'Acuarios/';
const E = 'Especies habituales/';
const IMAGENES_TIPO = {
  reef: [A + 'Acuario marino — arrecife de coral (reef)/Acuario_marino_reef.webp', A + 'Acuario marino — arrecife de coral (reef)/' + E + 'Corales/Euphyllia_ancora.webp', A + 'Acuario marino — arrecife de coral (reef)/' + E + 'Corales/Montipora_spp.webp'],
  marino_peces: [A + 'Acuario marino — fowlr/Acuario_marino_fowlr.webp', A + 'Acuario marino — arrecife de coral (reef)/' + E + 'Peces/Amphiprion_ocellaris.webp'],
  nano_marino: [A + 'Nano acuario/Nano_acuario.webp', A + 'Acuario marino — arrecife de coral (reef)/' + E + 'Corales/Discosoma_spp.webp'],
  comunidad: ['Aquascaping/Estilos/Dutch_style/Dutch_style.webp', 'Aquascaping/Estilos/Jungle_style/Jungle_style.webp', A + 'Acuario dulce tropical de comunidad/' + E + 'Peces/Corydoras_panda.webp', A + 'Acuario dulce tropical de comunidad/' + E + 'Peces/Danio_rerio.webp'],
  plantado: [A + 'Acuario plantado/Acuario_plantado.webp', 'Aquascaping/Estilos/Nature_aquarium/Nature_aquarium.webp', 'Aquascaping/Estilos/Iwagumi/Iwagumi.webp', 'Aquascaping/Principios/Principios.webp'],
  gambas: [A + 'Acuario de gambas/Acuario_gambas.webp', A + 'Acuario de gambas/' + E + 'Invertebrados/Neocaridina_davidi_Red.webp', A + 'Acuario de gambas/' + E + 'Invertebrados/Neocaridina_davidi_Yellow.webp', A + 'Acuario de gambas/' + E + 'Invertebrados/Neocaridina_davidi_Blue.webp', A + 'Acuario de gambas/' + E + 'Invertebrados/Caridina_cantonensis_CRS.webp', A + 'Acuario de gambas/' + E + 'Plantas/Taxiphyllum_barbieri.webp'],
  ciclidos: [A + 'Acuario plantado/' + E + 'Peces/Pterophyllum_scalare.webp', A + 'Acuario dulce tropical de comunidad/' + E + 'Peces/Apistogramma_cacatuoides.webp'],
  discos: [A + 'Acuario de discus/Acuario_discus.webp', A + 'Acuario de discus/' + E + 'Peces/Symphysodon_aequifasciatus.webp', A + 'Acuario de discus/' + E + 'Peces/Symphysodon_discus.webp'],
  agua_fria: [A + 'Acuario de agua fría  goldfish/Acuario_agua_fria_goldfish.webp', A + 'Acuario de agua fría  goldfish/' + E + 'Peces/Goldfish_oranda.webp', A + 'Acuario de agua fría  goldfish/' + E + 'Peces/Goldfish_fantail_ryukin.webp'],
  estanque: [A + 'Estanques koi/Estanque_koi.webp', A + 'Estanques koi/' + E + 'Variedades de koi/Kohaku.webp', A + 'Estanques koi/' + E + 'Variedades de koi/Showa.webp'],
  biotopo: ['Aquascaping/Estilos/Biotopo/Biotopo.webp', A + 'Acuario salobre/Acuario_salobre.webp'],
  paludario: [A + 'Paludario/Paludario.webp'],
};
export const imagenTanque = (t) => {
  if (t?.foto_url) return t.foto_url;
  const fotos = IMAGENES_TIPO[t?.tipo] || IMAGENES_TIPO.comunidad;
  // Mezcla multiplicativa: ids consecutivos caen en fotos distintas
  const mezcla = Math.imul(Math.abs(Number(t?.id) || 0), 2654435761) >>> 0;
  return encodeURI('/wiki-media/' + fotos[(mezcla >>> 16) % fotos.length]);
};

export const colorAgua = (tipo) => TIPOS_TANQUE[tipo]?.agua || '#9fe7f5';

export const ES_MARINO = (tipo) => ['reef', 'marino_peces', 'nano_marino'].includes(tipo);

// Parámetros de agua (nombres en parametros.<clave>). "rango" es orientativo para dulce/marino y sirve para avisar de valores raros.
export const PARAMETROS = {
  temperatura: { unidad: '°C', dulce: [22, 28], marino: [24, 27] },
  ph: { unidad: '', dulce: [6.5, 7.8], marino: [7.9, 8.4] },
  kh: { unidad: 'dKH', dulce: [3, 10], marino: [7, 11] },
  gh: { unidad: 'dGH', dulce: [4, 14] },
  amonio: { unidad: 'mg/l', dulce: [0, 0.05], marino: [0, 0.05] },
  nitrito: { unidad: 'mg/l', dulce: [0, 0.05], marino: [0, 0.05] },
  nitrato: { unidad: 'mg/l', dulce: [0, 25], marino: [1, 10] },
  fosfato: { unidad: 'mg/l', dulce: [0, 1], marino: [0.02, 0.1] },
  salinidad: { unidad: 'ppt', marino: [33, 36] },
  calcio: { unidad: 'mg/l', marino: [400, 450] },
  magnesio: { unidad: 'mg/l', marino: [1250, 1400] },
  silicato: { unidad: 'mg/l', marino: [0, 0.5] },
  co2: { unidad: 'mg/l', dulce: [15, 30] },
  tds: { unidad: 'ppm' },
  otro: { unidad: '' },
};

export const PARAMETROS_DULCE = ['temperatura', 'ph', 'kh', 'gh', 'amonio', 'nitrito', 'nitrato', 'fosfato', 'co2', 'tds'];
export const PARAMETROS_MARINO = ['temperatura', 'salinidad', 'ph', 'kh', 'calcio', 'magnesio', 'nitrato', 'fosfato', 'amonio', 'nitrito', 'silicato'];

export function parametrosDe(tipo) {
  return ES_MARINO(tipo) ? PARAMETROS_MARINO : PARAMETROS_DULCE;
}

export function fueraDeRango(parametro, valor, tipo) {
  const def = PARAMETROS[parametro];
  const rango = def?.[ES_MARINO(tipo) ? 'marino' : 'dulce'];
  if (!rango) return false;
  return valor < rango[0] || valor > rango[1];
}

// Textos en habitantes.<clave>
export const CATEGORIAS_HABITANTE = ['pez', 'coral', 'invertebrado', 'planta', 'anfibio', 'otro'];

// Textos en eventos.<clave>
export const TIPOS_EVENTO = ['cambio_agua', 'limpieza', 'filtro', 'dosificacion', 'alta', 'baja', 'tratamiento', 'poda', 'otro'];

// Textos en visibilidad.<clave> y visibilidad.<clave>Ayuda
export const VISIBILIDADES = ['publico', 'seguidores', 'privado'];

// Textos en mercado.categorias.<clave>
export const CATEGORIAS_ANUNCIO = ['peces', 'corales', 'invertebrados', 'plantas', 'acuarios', 'iluminacion', 'filtracion', 'equipamiento', 'alimentacion', 'otros'];

// Textos en mercado.modalidades.<clave>
export const MODALIDADES = ['venta', 'cambio', 'regalo'];

// Textos en tiendas.especialidades.<clave>
export const ESPECIALIDADES_TIENDA = ['marino', 'corales', 'dulce', 'plantado', 'gambas', 'estanques', 'equipamiento', 'alimentacion'];

// Textos en perfil.niveles.<clave>
export const NIVELES = ['principiante', 'intermedio', 'avanzado', 'profesional'];

export const PROVINCIAS = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
  'Bizkaia', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba',
  'Cuenca', 'Gipuzkoa', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén',
  'La Rioja', 'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra',
  'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza',
];

export const MOTIVOS_REPORTE = ['spam', 'ofensivo', 'fraude', 'maltrato_animal', 'especie_protegida', 'otro'];

// Categorías del foro (mismas claves que la tabla foro_categorias). Van en el código para
// pintarse al instante; los nombres y descripciones están en foro.categorias.<slug>.
export const FORO_CATEGORIAS = [
  { slug: 'reef', grupo: 'marino' },
  { slug: 'marino-peces', grupo: 'marino' },
  { slug: 'nano-marino', grupo: 'marino' },
  { slug: 'comunidad', grupo: 'dulce' },
  { slug: 'plantado', grupo: 'dulce' },
  { slug: 'gambas', grupo: 'dulce' },
  { slug: 'ciclidos', grupo: 'dulce' },
  { slug: 'agua-fria', grupo: 'dulce' },
  { slug: 'enfermedades', grupo: 'ayuda' },
  { slug: 'equipamiento', grupo: 'ayuda' },
  { slug: 'bricolaje', grupo: 'ayuda' },
  { slug: 'principiantes', grupo: 'ayuda' },
  { slug: 'presentaciones', grupo: 'comunidad' },
  { slug: 'quedadas', grupo: 'comunidad' },
];
export const categoriaForo = (slug) => FORO_CATEGORIAS.find((c) => c.slug === slug);
