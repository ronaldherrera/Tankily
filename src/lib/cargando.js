"use client";

// ¿Está la web cargando algo? Cuenta las peticiones en curso (cambios de página de Next y consultas a
// Supabase usan fetch) para animar el logo de la cabecera. No cuenta la analítica ni la publicidad.
import { useEffect, useState } from 'react';

const IGNORAR = /umami|googlesyndication|doubleclick|google-analytics|adtrafficquality/;
const RETRASO = 250; // ms: las cargas más rápidas no animan nada (evita parpadeos)

let enCurso = 0;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f(enCurso > 0));

function instalar() {
  if (typeof window === 'undefined' || window.__tkFetchContado) return;
  window.__tkFetchContado = true;
  const original = window.fetch.bind(window);
  window.fetch = (entrada, opciones) => {
    const url = typeof entrada === 'string' ? entrada : entrada?.url || String(entrada);
    if (IGNORAR.test(url)) return original(entrada, opciones);
    enCurso++;
    avisar();
    return original(entrada, opciones).finally(() => { enCurso--; avisar(); });
  };
}

// true mientras haya alguna carga que dure más de RETRASO ms
export function useCargando() {
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    instalar();
    let reloj = null;
    const alCambiar = (hay) => {
      clearTimeout(reloj);
      if (hay) reloj = setTimeout(() => setCargando(true), RETRASO);
      else setCargando(false);
    };
    oyentes.add(alCambiar);
    return () => { oyentes.delete(alCambiar); clearTimeout(reloj); };
  }, []);
  return cargando;
}
