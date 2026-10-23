"use client";

// Quién está en línea ahora mismo, en toda la web (aro verde en el avatar, components/ui.js).
// Usa la presencia en tiempo real de Supabase: cada persona con sesión se anuncia en el canal "en-linea"
// mientras tiene la web a la vista y desaparece al ocultarla o cerrarla. No se guarda nada en la base de datos.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';

let conectados = new Set();
let yo = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());
const suscribir = (f) => { oyentes.add(f); return () => oyentes.delete(f); };

// La llama AppShell al haber sesión; devuelve la función para salir del canal
export function anunciarPresencia(usuarioId) {
  yo = usuarioId;
  const canal = supabase.channel('en-linea', { config: { presence: { key: usuarioId } } });
  const actualizar = () => { conectados = new Set(Object.keys(canal.presenceState())); avisar(); };
  const segunVista = () => (document.visibilityState === 'visible' ? canal.track({}) : canal.untrack());
  canal.on('presence', { event: 'sync' }, actualizar)
    .subscribe((estado) => { if (estado === 'SUBSCRIBED') segunVista(); });
  document.addEventListener('visibilitychange', segunVista);
  return () => {
    document.removeEventListener('visibilitychange', segunVista);
    supabase.removeChannel(canal);
    conectados = new Set();
    yo = null;
    avisar();
  };
}

// ¿Está en línea esta persona? (nunca uno mismo: el aro es para ver a los demás)
export function useEnLinea(id) {
  return useSyncExternalStore(suscribir, () => !!id && id !== yo && conectados.has(id), () => false);
}

// Todas las personas en línea ahora mismo (el conjunto cambia de referencia solo cuando cambia)
export function useConectados() {
  return useSyncExternalStore(suscribir, () => conectados, () => VACIO);
}
const VACIO = new Set();
