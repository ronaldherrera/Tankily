import { LOCALES, idiomaActual } from '@/i18n/config';
import { tActual } from '@/i18n/actual';

const locale = () => LOCALES[idiomaActual()];
const t = (clave, vars) => tActual(clave, vars);

export function formatRelativeTime(fecha) {
  if (!fecha) return '';
  const segundos = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (segundos < 60) return t('tiempo.ahora');
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return t('tiempo.min', { n: minutos });
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return t('tiempo.h', { n: horas });
  const dias = Math.floor(horas / 24);
  if (dias < 7) return t('tiempo.d', { n: dias });
  return new Date(fecha).toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
    year: dias > 300 ? 'numeric' : undefined,
  });
}

export function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatFechaHora(fecha, opciones = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) {
  return new Date(fecha).toLocaleString(locale(), opciones);
}

export function formatNumero(valor, decimales = 2) {
  return Number(valor).toLocaleString(locale(), { maximumFractionDigits: decimales });
}

export function formatPrecio(precio, modalidad, moneda = 'EUR') {
  if (modalidad === 'regalo') return t('mercado.modalidades.regalo');
  if (modalidad === 'cambio' && precio == null) return t('mercado.modalidades.cambio');
  if (precio == null) return t('mercado.aConvenir');
  return new Intl.NumberFormat(locale(), { style: 'currency', currency: moneda || 'EUR', maximumFractionDigits: precio % 1 ? 2 : 0 }).format(precio);
}

export function diasDesde(fecha) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
}
