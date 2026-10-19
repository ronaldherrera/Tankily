"use client";

import React from 'react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';

const legible = (segmento) => {
  const t = segmento.replace(/-/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// `nombres`: títulos ya traducidos de cada tramo (WikiTank); si no llegan, se deducen del slug
export default function Breadcrumbs({ path = [], nombres }) {
  const { t } = useT();
  return (
    <nav className="wiki-migas cristal cristal-fijo" aria-label={t('wiki.ruta')}>
      <Link href="/wiki">WikiTank</Link>
      {path.map((segment, idx) => (
        <React.Fragment key={idx}>
          <span className="sep" aria-hidden="true">/</span>
          <Link
            href={`/wiki/explorer/${path.slice(0, idx + 1).join('/')}`}
            aria-current={idx === path.length - 1 ? 'page' : undefined}
          >
            {nombres?.[idx] || legible(segment)}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
