"use client";

// Traducción del contenido de los usuarios, por capas (de la más barata a la más cara):
//  1. Caché local del navegador y caché compartida en la base de datos (tabla traducciones).
//  2. Traductor integrado de Chrome (en el dispositivo, gratis y privado) si el idioma ya está descargado.
//  3. Función `traducir` de Supabase (DeepL o, sin clave, MyMemory), que guarda el resultado para todos.
//  4. Si nada está disponible: botón "Ver traducción" (descarga el idioma en Chrome o abre Google Translate).
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { MENCION } from '@/lib/usuario';

// --- Detección del idioma al publicar -------------------------------------------
// Con el detector de Chrome si está; si no, se asume el idioma de la interfaz.
export async function detectarIdioma(texto, porDefecto) {
  try {
    if (texto && texto.trim().length >= 12 && 'LanguageDetector' in self && (await self.LanguageDetector.availability()) === 'available') {
      const detector = await self.LanguageDetector.create();
      const [mejor] = await detector.detect(texto);
      if (mejor && mejor.confidence > 0.6 && /^[a-z]{2}/.test(mejor.detectedLanguage)) return mejor.detectedLanguage.slice(0, 2);
    }
  } catch {}
  return porDefecto;
}

// --- Cachés ---------------------------------------------------------------------
const memoria = new Map();
const PREFIJO = 'tk-tr:';
async function huella(texto) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const leerLocal = (k) => { try { return localStorage.getItem(PREFIJO + k); } catch { return null; } };
const guardarLocal = (k, v) => { try { localStorage.setItem(PREFIJO + k, v); } catch {} };

// Servidor: si la función no existe, no se vuelve a llamar en esta visita. Como mucho dos
// traducciones a la vez (un muro con muchos textos extranjeros no debe disparar el límite del
// proveedor) y, si una falla, se reintenta una vez pasados unos segundos.
let servidorDisponible = true;
let enCurso = 0;
const esperando = [];
async function conTurno(tarea) {
  if (enCurso >= 2) await new Promise((ok) => esperando.push(ok));
  enCurso++;
  try { return await tarea(); } finally { enCurso--; esperando.shift()?.(); }
}
const pausa = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function traducirEnServidor(cuerpo) {
  for (let intento = 0; intento < 2; intento++) {
    const { data, error } = await conTurno(() => supabase.functions.invoke('traducir', { body: cuerpo }));
    if (!error && data?.texto) return data.texto;
    const estadoHttp = error?.context?.status;
    if (estadoHttp === 404) { servidorDisponible = false; return null; }
    if (estadoHttp === 400 || estadoHttp === 413) return null;
    await pausa(4000 + Math.random() * 3000);
  }
  return null;
}

// #etiquetas, @menciones y enlaces no se traducen: se traducen solo los trozos de texto que hay entre ellos
const PROTEGER = new RegExp(String.raw`(#[\p{L}\p{N}_]{2,40}|${MENCION}|https?:\/\/[^\s]+)`, 'gu');
async function traducirConChrome(texto, de, a) {
  const traductor = await self.Translator.create({ sourceLanguage: de, targetLanguage: a });
  const partes = texto.split(PROTEGER);
  const traducidas = await Promise.all(partes.map(async (p, i) => {
    if (i % 2 === 1 || !p.trim()) return p;
    const [, antes, medio, despues] = p.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return antes + (await traductor.translate(medio)) + despues;
  }));
  return traducidas.join('');
}

async function traductorChrome(de, a) {
  if (!('Translator' in self)) return { estado: 'no' };
  try {
    const estado = await self.Translator.availability({ sourceLanguage: de, targetLanguage: a });
    return { estado };
  } catch { return { estado: 'no' }; }
}

/**
 * @param fuente { tabla, id, campo = 'contenido', texto, idioma }  idioma = en el que se escribió
 * @param lang   idioma de la interfaz (destino)
 * @returns { necesita, estado: 'traduciendo'|'listo'|'manual'|'error', traducido, traducirAhora }
 */
export function useTraduccion({ tabla, id, campo = 'contenido', texto, idioma }, lang) {
  const necesita = !!(texto && idioma && lang && idioma !== lang && id);
  const [estado, setEstado] = useState(necesita ? 'traduciendo' : 'nada');
  const [traducido, setTraducido] = useState(null);

  useEffect(() => {
    if (!necesita) { setEstado('nada'); return undefined; }
    let vivo = true;
    (async () => {
      const h = await huella(texto);
      const clave = `${tabla}:${id}:${campo}:${lang}:${h.slice(0, 16)}`;
      const listo = (t) => { if (!vivo) return; memoria.set(clave, t); guardarLocal(clave, t); setTraducido(t); setEstado('listo'); };

      // 1. Cachés
      const enCache = memoria.get(clave) || leerLocal(clave);
      if (enCache) return listo(enCache);
      const { data } = await supabase.from('traducciones').select('texto, huella')
        .match({ tabla, fila_id: id, campo, idioma: lang }).maybeSingle();
      if (data && data.huella === h) return listo(data.texto);

      // 2. Traductor de Chrome con el idioma ya descargado
      const chrome = await traductorChrome(idioma, lang);
      if (chrome.estado === 'available') {
        try {
          return listo(await traducirConChrome(texto, idioma, lang));
        } catch {}
      }

      // 3. Servidor (DeepL o MyMemory), que además guarda la traducción para todos
      if (servidorDisponible) {
        const t = await traducirEnServidor({ tabla, id, campo, idioma: lang });
        if (t) return listo(t);
      }

      // 4. A petición del usuario
      if (vivo) setEstado('manual');
    })().catch(() => vivo && setEstado('manual'));
    return () => { vivo = false; };
  }, [necesita, tabla, id, campo, texto, idioma, lang]);

  // "Ver traducción": con el gesto del usuario Chrome puede descargar el idioma;
  // si no hay traductor en el navegador, se abre Google Translate en otra pestaña
  // (nunca con un mensaje privado: su texto iría en la dirección de Google).
  const traducirAhora = useCallback(async () => {
    const chrome = await traductorChrome(idioma, lang);
    if (['available', 'downloadable', 'downloading'].includes(chrome.estado)) {
      setEstado('traduciendo');
      try {
        const t = await traducirConChrome(texto, idioma, lang);
        setTraducido(t);
        setEstado('listo');
        return;
      } catch { setEstado('manual'); }
    }
    if (tabla === 'mensajes') { setEstado('error'); return; }
    window.open(`https://translate.google.com/?sl=${idioma}&tl=${lang}&text=${encodeURIComponent(texto)}&op=translate`, '_blank', 'noopener');
  }, [tabla, idioma, lang, texto]);

  return { necesita, estado, traducido, traducirAhora };
}
