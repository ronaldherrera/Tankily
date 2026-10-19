"use client";

import { evento } from '@/lib/analitica';

// Enlace a la página de donaciones que además cuenta el clic en la analítica (la página /apoyar/ se
// genera en el servidor y allí no puede haber manejadores de eventos)
export default function EnlaceApoyo({ href, children, ...resto }) {
  return <a href={href} target="_blank" rel="noopener" onClick={() => evento('apoyar')} {...resto}>{children}</a>;
}
