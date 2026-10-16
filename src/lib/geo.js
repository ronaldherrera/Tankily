// Distancias aproximadas para ordenar el mercado y las tiendas por cercanía.
// Los anuncios de particulares se sitúan en el centro (la capital) de su provincia, nunca en su dirección;
// las tiendas, en sus coordenadas reales (obtenidas de su dirección pública). De momento las provincias
// son las de España; en otros países solo se sitúan las tiendas con coordenadas.

// Capital de cada provincia española: [latitud, longitud]
const CENTROS_ES = {
  'a coruna': [43.362, -8.411], alava: [42.846, -2.672], albacete: [38.994, -1.858], alicante: [38.345, -0.481],
  almeria: [36.834, -2.463], asturias: [43.361, -5.849], avila: [40.656, -4.700], badajoz: [38.879, -6.970],
  barcelona: [41.385, 2.173], bizkaia: [43.263, -2.935], burgos: [42.344, -3.697], caceres: [39.475, -6.372],
  cadiz: [36.527, -6.288], cantabria: [43.462, -3.810], castellon: [39.986, -0.051], ceuta: [35.889, -5.321],
  'ciudad real': [38.986, -3.927], cordoba: [37.888, -4.779], cuenca: [40.070, -2.137], gipuzkoa: [43.318, -1.981],
  girona: [41.979, 2.821], granada: [37.177, -3.599], guadalajara: [40.633, -3.167], huelva: [37.261, -6.945],
  huesca: [42.136, -0.409], 'illes balears': [39.570, 2.650], jaen: [37.779, -3.785], 'la rioja': [42.466, -2.445],
  'las palmas': [28.124, -15.430], leon: [42.599, -5.567], lleida: [41.617, 0.620], lugo: [43.012, -7.556],
  madrid: [40.417, -3.704], malaga: [36.721, -4.421], melilla: [35.292, -2.938], murcia: [37.992, -1.131],
  navarra: [42.812, -1.646], ourense: [42.336, -7.864], palencia: [42.010, -4.528], pontevedra: [42.431, -8.645],
  salamanca: [40.970, -5.663], 'santa cruz de tenerife': [28.464, -16.251], segovia: [40.948, -4.118],
  sevilla: [37.389, -5.984], soria: [41.764, -2.465], tarragona: [41.119, 1.245], teruel: [40.344, -1.106],
  toledo: [39.863, -4.027], valencia: [39.470, -0.376], valladolid: [41.652, -4.724], zamora: [41.503, -5.744],
  zaragoza: [41.649, -0.889],
};
// Otros nombres con los que se escriben (en otras lenguas oficiales o en castellano)
const ALIAS_ES = {
  'la coruna': 'a coruna', coruna: 'a coruna', araba: 'alava', 'araba/alava': 'alava', alacant: 'alicante', vizcaya: 'bizkaia',
  castello: 'castellon', guipuzcoa: 'gipuzkoa', gerona: 'girona', baleares: 'illes balears', 'islas baleares': 'illes balears',
  lerida: 'lleida', orense: 'ourense', 'valencia/valencia': 'valencia', tenerife: 'santa cruz de tenerife', 'gran canaria': 'las palmas',
};

const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Centro de una provincia (solo España de momento) o null
export function centroProvincia(pais, provincia) {
  if (pais !== 'ES' || !provincia) return null;
  const clave = normalizar(provincia);
  return CENTROS_ES[clave] || CENTROS_ES[ALIAS_ES[clave]] || null;
}

// Coordenadas de un anuncio o una tienda: las propias si las tiene (tiendas), las de su tienda si es un
// anuncio de tienda y, si no, las del centro de su provincia
export function coordenadasDe(item) {
  if (item?.lat != null && item?.lng != null) return [item.lat, item.lng];
  if (item?.tienda?.lat != null && item?.tienda?.lng != null) return [item.tienda.lat, item.tienda.lng];
  return centroProvincia(item?.pais, item?.provincia);
}

// Distancia en km entre dos puntos [lat, lng] (fórmula del haversine)
export function distanciaKm(a, b) {
  if (!a || !b) return null;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Ordena por distancia al punto `desde` (los que no se pueden situar, al final y en su orden original).
// Devuelve una lista nueva con `distancia` (km) y `aproximada` (situado en el centro de su provincia)
export function ordenarPorDistancia(lista, desde) {
  const exactas = (item) => (item?.lat != null && item?.lng != null) || (item?.tienda?.lat != null && item?.tienda?.lng != null);
  return lista
    .map((item, i) => ({ item, i, d: distanciaKm(desde, coordenadasDe(item)) }))
    .sort((a, b) => (a.d == null) - (b.d == null) || (a.d ?? 0) - (b.d ?? 0) || a.i - b.i)
    .map(({ item, d }) => ({ ...item, distancia: d, aproximada: d != null && !exactas(item) }));
}
