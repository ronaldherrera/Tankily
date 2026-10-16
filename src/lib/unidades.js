"use client";

import { useCallback, useEffect, useState } from 'react';
import { LOCALES, idiomaActual } from '@/i18n/config';
import { paisProbable } from './paises';

// En la base de datos todo se guarda en métrico (litros, cm, °C). Aquí solo se convierte
// para mostrar y para leer lo que escribe el usuario.
const CLAVE = 'tk-unidades';
const L_A_GAL = 0.264172;
const CM_A_IN = 0.393701;

// Sistema imperial en los países que lo usan (EE. UU., Liberia, Myanmar), deducidos por la zona
// horaria o el idioma: alguien en EE. UU. con el navegador en español también ve galones y °F.
function porDefecto() {
  const idioma = (typeof navigator !== 'undefined' && navigator.language) || '';
  return /^en-(US|LR|MM)$/i.test(idioma) || ['US', 'LR', 'MM'].includes(paisProbable()) ? 'imperial' : 'metrico';
}

function leer() {
  try { return localStorage.getItem(CLAVE) || porDefecto(); } catch { return porDefecto(); }
}

const num = (v, dec = 1) => Number(v).toLocaleString(LOCALES[idiomaActual()], { maximumFractionDigits: dec });
const redondear = (v, dec) => Math.round(v * 10 ** dec) / 10 ** dec;

export function useUnidades() {
  const [sistema, setSistema] = useState('metrico');

  useEffect(() => {
    setSistema(leer());
    const alCambiar = (e) => setSistema(e.detail);
    window.addEventListener('tk:unidades', alCambiar);
    return () => window.removeEventListener('tk:unidades', alCambiar);
  }, []);

  const elegir = useCallback((nuevo) => {
    try { localStorage.setItem(CLAVE, nuevo); } catch {}
    setSistema(nuevo);
    window.dispatchEvent(new CustomEvent('tk:unidades', { detail: nuevo }));
  }, []);

  const imperial = sistema === 'imperial';

  return {
    sistema,
    elegir,
    // Volumen
    unidadVolumen: imperial ? 'gal' : 'l',
    deLitros: (l) => (l == null ? null : imperial ? redondear(l * L_A_GAL, 1) : l),
    aLitros: (v) => (v == null || v === '' ? null : Math.round(imperial ? Number(v) / L_A_GAL : Number(v))),
    volumen: (l) => (l == null ? '' : imperial ? `${num(l * L_A_GAL, 0)} gal` : `${num(l, 0)} l`),
    // Longitud
    unidadLongitud: imperial ? 'in' : 'cm',
    deCm: (cm) => (cm == null ? null : imperial ? redondear(cm * CM_A_IN, 1) : cm),
    aCm: (v) => (v == null || v === '' ? null : Math.round(imperial ? Number(v) / CM_A_IN : Number(v))),
    // Temperatura
    unidadTemp: imperial ? '°F' : '°C',
    deC: (c) => (c == null ? null : imperial ? redondear(c * 9 / 5 + 32, 1) : c),
    aC: (v) => (v == null || v === '' ? null : imperial ? redondear((Number(v) - 32) * 5 / 9, 2) : Number(v)),
  };
}
