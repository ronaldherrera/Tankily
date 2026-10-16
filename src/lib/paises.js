// Países (ISO 3166-1 alfa-2). Los nombres se generan en el idioma de la página con Intl.DisplayNames.
export const CODIGOS_PAIS = [
  'AD', 'AE', 'AF', 'AG', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ',
  'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU',
  'CV', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FR', 'GA', 'GB',
  'GD', 'GE', 'GH', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IN', 'IQ',
  'IR', 'IS', 'IT', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KM', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
  'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MR', 'MT', 'MU', 'MV', 'MW', 'MX',
  'MY', 'MZ', 'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NZ', 'OM', 'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PR', 'PS', 'PT',
  'PY', 'QA', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SV',
  'SY', 'SZ', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VC',
  'VE', 'VN', 'VU', 'WS', 'YE', 'ZA', 'ZM', 'ZW',
];

// Moneda habitual por país (para sugerir al publicar un anuncio)
const EURO = ['AD', 'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MC', 'ME', 'MT', 'NL', 'PT', 'SI', 'SK', 'SM'];
const MONEDA_PAIS = {
  US: 'USD', PR: 'USD', EC: 'USD', SV: 'USD', PA: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', MX: 'MXN', AR: 'ARS',
  CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU', BR: 'BRL', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK',
  HU: 'HUF', RO: 'RON', JP: 'JPY', CN: 'CNY', IN: 'INR', SG: 'SGD', HK: 'HKD', ZA: 'ZAR', TR: 'TRY', IL: 'ILS', AE: 'AED',
};
export const monedaDe = (pais) => (EURO.includes(pais) ? 'EUR' : MONEDA_PAIS[pais] || 'USD');

export const MONEDAS = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'BRL', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'JPY'];

const cache = {};
export function listaPaises(locale) {
  if (!cache[locale]) {
    const nombres = new Intl.DisplayNames([locale], { type: 'region' });
    cache[locale] = CODIGOS_PAIS
      .map((codigo) => ({ codigo, nombre: nombres.of(codigo) || codigo }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, locale));
  }
  return cache[locale];
}

export function nombrePais(codigo, locale) {
  if (!codigo) return '';
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(codigo) || codigo; } catch { return codigo; }
}

// Zona horaria → país, para las zonas de los países donde más se usará Tankily. Es más fiable que el
// idioma (un mexicano con el navegador en "es" no es de España) y no pide ningún permiso.
const ZONAS = {
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES', 'Europe/Lisbon': 'PT', 'Atlantic/Madeira': 'PT', 'Atlantic/Azores': 'PT',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Warsaw': 'PL',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT', 'Europe/Prague': 'CZ', 'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Athens': 'GR', 'Europe/Bucharest': 'RO', 'Europe/Budapest': 'HU',
  'Europe/Luxembourg': 'LU', 'Europe/Andorra': 'AD', 'Europe/Monaco': 'MC', 'Europe/Malta': 'MT',
  'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santiago': 'CL', 'America/Montevideo': 'UY', 'America/Caracas': 'VE', 'America/Guayaquil': 'EC',
  'America/La_Paz': 'BO', 'America/Asuncion': 'PY', 'America/Panama': 'PA', 'America/Costa_Rica': 'CR', 'America/Guatemala': 'GT',
  'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN', 'America/Managua': 'NI', 'America/Santo_Domingo': 'DO', 'America/Havana': 'CU',
  'America/Puerto_Rico': 'PR', 'Pacific/Auckland': 'NZ', 'Asia/Tokyo': 'JP', 'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK',
};
// Zonas que comparten prefijo dentro de un mismo país
const PREFIJOS_ZONA = [
  [/^America\/Argentina\//, 'AR'], [/^America\/(Mexico_City|Monterrey|Cancun|Tijuana|Merida|Chihuahua|Mazatlan|Hermosillo|Matamoros|Bahia_Banderas)$/, 'MX'],
  [/^America\/(Sao_Paulo|Fortaleza|Recife|Bahia|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Maceio|Araguaina|Santarem|Noronha)$/, 'BR'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton|Whitehorse|Yellowknife|Iqaluit)$/, 'CA'],
  [/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana\/.+|Kentucky\/.+)|Pacific\/Honolulu)$/, 'US'],
  [/^Australia\//, 'AU'],
];

// País probable del visitante sin perfil: zona horaria y, si no se reconoce, la región del idioma (es-MX → MX)
export function paisProbable() {
  if (typeof navigator === 'undefined') return 'ES';
  try {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const porZona = ZONAS[zona] || PREFIJOS_ZONA.find(([patron]) => patron.test(zona))?.[1];
    if (porZona) return porZona;
  } catch { /* sin Intl: se usa el idioma */ }
  const region = (navigator.language || '').split('-')[1]?.toUpperCase();
  return CODIGOS_PAIS.includes(region) ? region : navigator.language?.startsWith('en') ? 'US' : 'ES';
}

// Une las partes de una ubicación sin repetir las que coinciden ("Madrid, Madrid, España" → "Madrid, España")
export function unirLugar(partes) {
  const vistas = new Set();
  return partes.filter((p) => {
    const clave = String(p || '').trim().toLocaleLowerCase();
    if (!clave || vistas.has(clave)) return false;
    vistas.add(clave);
    return true;
  }).join(', ');
}
