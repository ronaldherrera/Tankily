"use client";

import { forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/IdiomaProvider';

// Igual que next/link, pero añade el prefijo de idioma a las rutas internas (/foro/ → /en/foro/).
// Sin precarga salvo que se pida (prefetch): next/link descarga de antemano la página de cada enlace
// visible y en el muro eran más de 150 descargas compitiendo con los datos al abrir la web.
// El menú principal sí precarga, con prefetch="auto" (son pocas rutas y las más usadas). Nunca prefetch={true}:
// en el export estático pide /ruta/?_rsc=, el servidor devuelve el HTML y el enlace deja de navegar.
const Enlace = forwardRef(function Enlace({ href, prefetch = false, ...props }, ref) {
  const { ruta } = useT();
  return <Link ref={ref} href={typeof href === 'string' ? ruta(href) : href} prefetch={prefetch} {...props} />;
});

export default Enlace;

// useRouter con prefijo de idioma en push/replace
export function useNavegar() {
  const router = useRouter();
  const { ruta } = useT();
  return useMemo(() => ({
    ...router,
    push: (href, opciones) => router.push(ruta(href), opciones),
    replace: (href, opciones) => router.replace(ruta(href), opciones),
  }), [router, ruta]);
}
