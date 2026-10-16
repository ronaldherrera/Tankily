"use client";

import { useCallback, useEffect, useState } from 'react';
import { CLAVE_TEMA } from './scriptTema';

const COLOR_BARRA = { oscuro: '#050b14', claro: '#e9f1f7' };

function aplicar(preferencia) {
  const tema = preferencia === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro')
    : preferencia;
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema]);
  window.dispatchEvent(new CustomEvent('tk:tema', { detail: preferencia }));
}

function leer() {
  try { return localStorage.getItem(CLAVE_TEMA) || 'oscuro'; } catch { return 'oscuro'; }
}

// Preferencia del usuario: 'oscuro' (por defecto), 'claro' o 'auto' (según el sistema)
export function useTema() {
  const [preferencia, setPreferencia] = useState('oscuro');

  useEffect(() => {
    setPreferencia(leer());
    const alCambiar = (e) => setPreferencia(e.detail);
    window.addEventListener('tk:tema', alCambiar);
    const sistema = window.matchMedia('(prefers-color-scheme: light)');
    const alCambiarSistema = () => leer() === 'auto' && aplicar('auto');
    sistema.addEventListener('change', alCambiarSistema);
    return () => {
      window.removeEventListener('tk:tema', alCambiar);
      sistema.removeEventListener('change', alCambiarSistema);
    };
  }, []);

  const elegir = useCallback((nueva) => {
    try { localStorage.setItem(CLAVE_TEMA, nueva); } catch {}
    setPreferencia(nueva);
    aplicar(nueva);
  }, []);

  return [preferencia, elegir];
}
