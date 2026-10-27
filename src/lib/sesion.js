"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
    // Un solo punto de entrada: INITIAL_SESSION al abrir y luego SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT…
    // El usuario solo cambia (y con él todo lo que depende de [usuario]) si cambia la persona: al
    // renovar el token llega un objeto nuevo de la misma persona y eso repetía todas las consultas.
    // Las consultas van fuera del callback (setTimeout), como pide supabase-js, para no quedarse
    // esperando al bloqueo de la sesión.
    let actualId; // undefined hasta el primer evento; luego el id de la persona o null
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      const u = session?.user ?? null;
      setUsuario((antes) => (antes?.id === u?.id ? antes : u));
      if (actualId !== undefined && (u?.id ?? null) === actualId) return;
      actualId = u?.id ?? null;
      setTimeout(async () => {
        await cargarPerfil(u);
        setCargando(false);
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, [cargarPerfil]);

  const recargarPerfil = useCallback(() => cargarPerfil(usuario), [cargarPerfil, usuario]);
  const valor = useMemo(() => ({ usuario, perfil, cargando, recargarPerfil }), [usuario, perfil, cargando, recargarPerfil]);

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);
