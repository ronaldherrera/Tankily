"use client";

import { useEffect } from 'react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';

// Si un componente falla al pintarse, se muestra esto dentro del diseño (menú incluido)
// en lugar de una página en blanco, con una salida: reintentar o volver al inicio.
export default function ErrorPagina({ error, reset }) {
  const { t } = useT();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="contenido">
      <div className="columna">
        <section className="cristal" role="alert" style={{ padding: 28, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 className="titulo-m">{t('errorPagina.titulo')}</h1>
          <p className="texto-2">{t('errorPagina.texto')}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <button type="button" className="btn btn-primario" onClick={() => reset()}>{t('errorPagina.reintentar')}</button>
            <Link href="/" className="btn">{t('errorPagina.inicio')}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
