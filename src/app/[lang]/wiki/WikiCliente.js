"use client";

import React, { useMemo, useState } from 'react';
import Link from '@/components/Enlace';
import { Search, BookOpen, ArrowUpRight, Fish, ShieldCheck, Calculator } from 'lucide-react';
import { wikiTankTree } from '@/lib/wikiData';
import { especiesWiki } from '@/lib/especiesWiki';
import { tituloWiki } from './formato';
import { useT } from '@/i18n/IdiomaProvider';

const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Secciones y subsecciones de primer y segundo nivel, para el buscador
const PAGINAS = wikiTankTree.flatMap((n) => [
  { titulo: tituloWiki(n.title), ruta: n.slug, imagen: n.previewImage },
  ...(n.children || []).map((c) => ({ titulo: tituloWiki(c.title), ruta: `${n.slug}/${c.slug}`, imagen: c.previewImage, padre: tituloWiki(n.title) })),
]);

export default function WikiIndex({ numEspecies = 0, fotosEspecies = [] }) {
  const [q, setQ] = useState('');
  const { t } = useT();

  const contentTree = useMemo(() => {
    // El Glosario vive en el botón flotante (GlossaryWidget), no en el listado
    return wikiTankTree.filter((node) => node.slug !== 'glosario');
  }, []);

  const resultados = useMemo(() => {
    const t = normalizar(q.trim());
    if (t.length < 2) return [];
    const paginas = PAGINAS.filter((p) => normalizar(p.titulo).includes(t)).slice(0, 5)
      .map((p) => ({ ...p, href: `/wiki/explorer/${p.ruta}/`, imagen: p.imagen && `/wiki-media/${p.imagen}`, detalle: p.padre || t('wiki.seccion') }));
    const especies = especiesWiki.filter((e) => normalizar(e.nombre).includes(t)).slice(0, 6)
      .map((e) => ({ titulo: e.nombre, href: e.slug ? `/wiki/especies/${e.slug}/` : `/wiki/explorer/${e.ruta}/`, imagen: e.imagen, detalle: t('wiki.especie'), especie: true }));
    return [...paginas, ...especies];
     
  }, [q]);

  return (
    <>
      <header className="wiki-portada">
        <h1 className="wiki-logotipo">WikiTank</h1>
        <p>{t('wiki.lema')}</p>
        <div>
          <label className="wiki-buscador cristal">
            <Search size={18} className="texto-3" />
            <span className="sr-only">{t('wiki.buscar')}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('wiki.buscarEj')} />
          </label>
          {q.trim().length >= 2 && (
            <div className="wiki-resultados cristal" role="listbox" aria-label={t('wiki.resultados')}>
              {resultados.length === 0 ? (
                <p className="pequeno texto-3" style={{ padding: 10 }}>{t('wiki.nadaCon', { q })}</p>
              ) : resultados.map((r) => (
                <Link key={r.href + r.titulo} href={r.href}>
                  {r.imagen ? <img src={encodeURI(r.imagen)} alt="" /> : <span className="wiki-subseccion-icono" style={{ width: 40, height: 40 }}><BookOpen size={16} /></span>}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {r.especie ? <em>{r.titulo}</em> : <strong>{r.titulo}</strong>}
                    <span className="mini texto-3" style={{ display: 'block' }}>{r.detalle}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Las herramientas que usan las fichas de WikiTank, a mano desde la portada de la wiki */}
        <nav className="chips wiki-herramientas" aria-label={t('herr.titulo')}>
          <Link href="/herramientas/especies/" className="chip"><Fish size={14} aria-hidden="true" /> {t('herr.especies.corto')}</Link>
          <Link href="/herramientas/compatibilidad/" className="chip"><ShieldCheck size={14} aria-hidden="true" /> {t('herr.compatibilidad.corto')}</Link>
          <Link href="/herramientas/" className="chip"><Calculator size={14} aria-hidden="true" /> {t('herr.corto')}</Link>
        </nav>
      </header>

      {numEspecies > 0 && (
        <Link href="/wiki/especies/" className="wiki-catalogo cristal">
          <span className="wiki-catalogo-fotos" aria-hidden="true">
            {fotosEspecies.map((src) => <img key={src} src={encodeURI(src)} alt="" loading="lazy" />)}
          </span>
          <span className="wiki-catalogo-texto">
            <strong>{t('catalogo.titulo')}</strong>
            <span className="pequeno texto-2">{t('catalogo.intro', { n: numEspecies })}</span>
          </span>
          <span className="btn btn-primario btn-s">{t('catalogo.verCatalogo')}</span>
        </Link>
      )}

      <div className="wiki-secciones">
        {contentTree.map((node) => (
          <Link key={node.slug} href={`/wiki/explorer/${node.slug}`} className="wiki-seccion">
            {node.previewImage && <img src={encodeURI(`/wiki-media/${node.previewImage}`)} alt="" loading="lazy" />}
            <div className="wiki-seccion-pie vidrio-tarjeta">
              <strong>{tituloWiki(node.title)}</strong>
              <span className="mini texto-3" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {node.children?.length ? t('wiki.temas', { n: node.children.length }) : ''} <ArrowUpRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
