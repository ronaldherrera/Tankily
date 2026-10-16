"use client";

import { useNavegar } from '@/components/Enlace';
import { useEffect } from 'react';
import { useSesion } from '@/lib/sesion';
import { Cargando } from '@/components/ui';

// /perfil/ lleva al perfil público propio (o a entrar)
export default function MiPerfil() {
  const { usuario, perfil, cargando } = useSesion();
  const router = useNavegar();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) router.replace('/acceder/');
    else if (perfil) router.replace(`/u/?n=${perfil.usuario}`);
  }, [cargando, usuario, perfil, router]);

  return <div className="contenido"><div className="columna"><Cargando alto={200} n={1} /></div></div>;
}
