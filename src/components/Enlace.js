"use client";

import { forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/IdiomaProvider';

// Igual que next/link, pero añade el prefijo de idioma a las rutas internas (/foro/ → /en/foro/)
const Enlace = forwardRef(function Enlace({ href, ...props }, ref) {
  const { ruta } = useT();
  return <Link ref={ref} href={typeof href === 'string' ? ruta(href) : href} {...props} />;
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
