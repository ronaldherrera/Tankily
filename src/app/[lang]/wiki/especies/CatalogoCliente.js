"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Thermometer, Box } from 'lucide-react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import Selector from '@/components/Selector';

const CATEGORIAS = ['pez', 'invertebrado', 'coral', 'planta'];
const DIFICULTAD = { facil: (d) => d <= 2, media: (d) => d === 3, dificil: (d) => d >= 4 };
const ORDENES = {
  cientifico: (a, b) => (a.cientifico || a.comun).localeCompare(b.cientifico || b.comun),
  comun: (a, b) => (a.comun || a.cientifico).localeCompare(b.comun || b.cientifico),
  // Lo que no tiene el dato va al final
  facil: (a, b) => (a.ficha?.dif ?? 9) - (b.ficha?.dif ?? 9),
  tamano: (a, b) => (a.ficha?.cm ?? 1e9) - (b.ficha?.cm ?? 1e9),
  litros: (a, b) => (a.ficha?.l ?? 1e9) - (b.ficha?.l ?? 1e9),
};
// Tarjetas que se pintan de cada vez: con las ~1.850 a la vez el móvil iba lento y la página pesaba MB
const PASO = 48;
const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Catálogo de especies de WikiTank: búsqueda, filtros y orden sobre la lista que llega del servidor
export default function CatalogoCliente({ especies }) {
  const { t, locale } = useT();
  const [q, setQ] = useState('');
  const [agua, setAgua] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dificultad, setDificultad] = useState('');
  const [reef, setReef] = useState(false);
  const [pacificas, setPacificas] = useState(false);
  const [orden, setOrden] = useState('cientifico');
  const num = (n) => Number(n).toLocaleString(locale, { maximumFractionDigits: 1 });
  const [visibles, setVisibles] = useState(PASO);
  const centinela = useRef(null);

  // Al cambiar la búsqueda, los filtros o el orden se vuelve a empezar por las primeras
  const firma = [q, agua, categoria, dificultad, reef, pacificas, orden].join('|');
  const [firmaAnterior, setFirmaAnterior] = useState(firma);
  if (firma !== firmaAnterior) {
    setFirmaAnterior(firma);
    setVisibles(PASO);
  }

  const lista = useMemo(() => {
    const b = normalizar(q.trim());
    return especies.filter((e) => {
      const f = e.ficha || {};
      if (b && !normalizar([e.comun, e.cientifico, ...e.otrosNombres].join(' ')).includes(b)) return false;
      if (agua && f.agua !== agua) return false;
      if (categoria && e.categoria !== categoria) return false;
      if (dificultad && !(f.dif && DIFICULTAD[dificultad](f.dif))) return false;
      if (reef && f.reef !== 'si') return false;
      if (pacificas && f.comp !== 'pacifico') return false;
      return true;
    }).sort(ORDENES[orden]);
  }, [especies, q, agua, categoria, dificultad, reef, pacificas, orden]);

  // Al acercarse al final de la lista se cargan más solas (el botón queda por si no hay IntersectionObserver)
  const quedan = lista.length - visibles;
  useEffect(() => {
    const nodo = centinela.current;
    if (!nodo || quedan <= 0 || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisibles((v) => v + PASO), { rootMargin: '600px 0px' });
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [quedan]);

  const hayFiltros = q || agua || categoria || dificultad || reef || pacificas;
  const limpiar = () => { setQ(''); setAgua(''); setCategoria(''); setDificultad(''); setReef(false); setPacificas(false); };
  const chip = (activo, onClick, texto, clave) => (
    <button key={clave ?? texto} type="button" className={`chip${activo ? ' activo' : ''}`} aria-pressed={activo} onClick={onClick}>{texto}</button>
  );

  return (
    <div className="catalogo">
      <div className="catalogo-filtros cristal-suave">
        <label className="wiki-buscador cristal">
          <Search size={18} className="texto-3" aria-hidden="true" />
          <span className="sr-only">{t('catalogo.buscar')}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('catalogo.buscar')} />
        </label>
        <div className="catalogo-grupos">
          <fieldset><legend className="mini texto-3">{t('catalogo.tipo')}</legend>
            <div className="chips">
              {chip(!categoria, () => setCategoria(''), t('comun.todos'), 'todas')}
              {CATEGORIAS.map((c) => chip(categoria === c, () => setCategoria(categoria === c ? '' : c), t(`habitantes.${c}`), c))}
            </div>
          </fieldset>
          <fieldset><legend className="mini texto-3">{t('catalogo.agua')}</legend>
            <div className="chips">
              {chip(agua === 'dulce', () => setAgua(agua === 'dulce' ? '' : 'dulce'), t('catalogo.dulce'))}
              {chip(agua === 'marina', () => setAgua(agua === 'marina' ? '' : 'marina'), t('catalogo.marina'))}
            </div>
          </fieldset>
          <fieldset><legend className="mini texto-3">{t('catalogo.dificultad')}</legend>
            <div className="chips">
              {Object.keys(DIFICULTAD).map((d) => chip(dificultad === d, () => setDificultad(dificultad === d ? '' : d), t(`catalogo.${d}`), d))}
            </div>
          </fieldset>
          <fieldset><legend className="sr-only">{t('catalogo.tipo')}</legend>
            <div className="chips">
              {chip(reef, () => setReef(!reef), t('catalogo.soloReef'))}
              {chip(pacificas, () => setPacificas(!pacificas), t('catalogo.soloPacificos'))}
            </div>
          </fieldset>
        </div>
        <div className="catalogo-pie">
          <p className="titulo-s" aria-live="polite">{t('catalogo.resultados', { n: lista.length })}</p>
          {hayFiltros && <button type="button" className="enlace pequeno" onClick={limpiar} style={{ background: 'none', border: 0, cursor: 'pointer' }}>{t('catalogo.limpiar')}</button>}
          <label className="catalogo-orden mini">
            <span className="texto-3">{t('catalogo.ordenar')}</span>
            <Selector className="entrada" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="cientifico">{t('catalogo.ordenCientifico')}</option>
              <option value="comun">{t('catalogo.ordenComun')}</option>
              <option value="facil">{t('catalogo.ordenFacil')}</option>
              <option value="tamano">{t('catalogo.ordenTamano')}</option>
              <option value="litros">{t('catalogo.ordenLitros')}</option>
            </Selector>
          </label>
        </div>
      </div>

      {lista.length === 0 ? <p className="pequeno texto-2">{t('catalogo.vacio')}</p> : (
        <>
        <ul className="catalogo-rejilla">
          {lista.slice(0, visibles).map((e) => (
            <li key={e.slug}>
              <Link href={`/wiki/especies/${e.slug}/`} className="tarjeta-especie cristal-suave">
                <span className="tarjeta-especie-foto">{e.imagen && <img src={encodeURI(e.imagen)} alt="" loading="lazy" />}</span>
                <span className="tarjeta-especie-texto" lang="es">
                  <strong>{e.comun || e.cientifico}</strong>
                  {e.comun && e.cientifico && <em>{e.cientifico}</em>}
                  {e.ficha && (
                    <span className="tarjeta-especie-datos" lang={locale}>
                      {e.ficha.t && <span><Thermometer size={11} aria-hidden="true" /> {num(e.ficha.t[0])}–{num(e.ficha.t[1])} °C</span>}
                      {e.ficha.l && <span><Box size={11} aria-hidden="true" /> {e.ficha.l} l</span>}
                      {e.ficha.dif && <span aria-label={`${t('catalogo.dificultad')} ${e.ficha.dif}/5`}>{'★'.repeat(e.ficha.dif)}</span>}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {quedan > 0 && (
          <div ref={centinela} style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button type="button" className="btn" onClick={() => setVisibles((v) => v + PASO)}>{t('catalogo.mostrarMas', { n: num(quedan) })}</button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
