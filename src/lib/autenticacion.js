"use client";

// Inicio de sesión con cuentas externas (Google, Apple, Facebook, Microsoft) y con enlace por email.
// Los botones solo aparecen para los proveedores activados en Supabase (Authentication → Providers):
// se consulta /auth/v1/settings, que es público, así que activar uno no requiere tocar código.
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { evento } from './analitica';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Orden por mercado: Facebook pesa más en Latinoamérica, Brasil y Polonia; Apple, en el resto
const ORDEN = {
  es: ['google', 'apple', 'facebook', 'azure'],
  pt: ['google', 'facebook', 'apple', 'azure'],
  pl: ['google', 'facebook', 'apple', 'azure'],
};
const ORDEN_GENERAL = ['google', 'apple', 'facebook', 'azure'];

let activosCache = null;

export function useProveedores(lang) {
  const [activos, setActivos] = useState(activosCache);
  useEffect(() => {
    if (activosCache) return;
    fetch(`${URL}/auth/v1/settings`, { headers: { apikey: CLAVE } })
      .then((r) => r.json())
      .then((j) => { activosCache = Object.entries(j.external || {}).filter(([, v]) => v).map(([k]) => k); setActivos(activosCache); })
      .catch(() => setActivos([]));
  }, []);
  if (!activos) return null;
  return (ORDEN[lang] || ORDEN_GENERAL).filter((p) => activos.includes(p));
}

// Tras volver del proveedor, Supabase deja la sesión iniciada y se aterriza en el muro del idioma actual
export async function entrarCon(proveedor, lang) {
  evento('acceso_social', { proveedor });
  return supabase.auth.signInWithOAuth({
    provider: proveedor,
    options: {
      redirectTo: `${window.location.origin}/${lang}/`,
      // Microsoft no envía el email si no se pide expresamente
      ...(proveedor === 'azure' ? { scopes: 'email' } : {}),
    },
  });
}

// Enlace mágico: entrar sin contraseña. No crea cuentas nuevas (para eso está el registro).
export async function enviarEnlace(email, lang) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/${lang}/`, shouldCreateUser: false },
  });
}
