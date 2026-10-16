"use client";

import { useEffect } from 'react';
import { useNavegar } from '@/components/Enlace';

// Dirección antigua (/foro/categoria/?c=reef): redirige a la página propia de la categoría
export default function CategoriaAntigua() {
  const navegar = useNavegar();
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c');
    navegar.replace(c ? `/foro/${encodeURIComponent(c)}/` : '/foro/');
  }, [navegar]);
  return null;
}
