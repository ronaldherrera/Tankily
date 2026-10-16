"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const SesionContext = createContext({ usuario: null, perfil: null, cargando: true, recargarPerfil: () => {} });

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (u) => {
    if (!u) { setPerfil(null); return; }
    const { data } = await supabase.from('perfiles').select('*').eq('id', u.id).maybeSingle();
    setPerfil(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      await cargarPerfil(session?.user);
      setCargando(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
      cargarPerfil(session?.user);
    });
    return () => subscription.unsubscribe();
  }, [cargarPerfil]);

  const recargarPerfil = useCallback(() => cargarPerfil(usuario), [cargarPerfil, usuario]);

  return (
    <SesionContext.Provider value={{ usuario, perfil, cargando, recargarPerfil }}>
      {children}
    </SesionContext.Provider>
  );
}

export const useSesion = () => useContext(SesionContext);
