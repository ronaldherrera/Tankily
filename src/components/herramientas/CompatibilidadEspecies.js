"use client";

import { useEffect, useId, useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { especiesWiki } from '@/lib/especiesWiki';
import Compatibilidad from '@/components/tanques/Compatibilidad';

const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Tipo de acuario de la calculadora → tipo de tanque que entiende analizarCompatibilidad
const TIPOS = { dulce: 'comunidad', marino: 'marino_peces', reef: 'reef' };
const AGUA = { dulce: 'dulce', marino: 'marina', reef: 'marina' };

// Ejemplo inicial que ya enseña algo útil: el goldfish pide agua fría y el betta, tropical
const EJEMPLO = [['Paracheirodon innesi', 6], ['Betta splendens', 1], ['Carassius auratus', 2]];

const CON_FICHA = especiesWiki.filter((e) => e.ficha);
const porNombre = (nombre) => CON_FICHA.find((e) => e.nombre === nombre);
const comoHabitante = (e, cantidad) => ({
  nombre: e.comun || e.nombre, nombre_cientifico: e.nombre, wiki_ruta: e.ruta, categoria: e.categoria, cantidad,
});

// "¿Pueden convivir?": compatibilidad entre especies sin necesidad de cuenta. Reutiliza el mismo
// análisis que el panel de cada tanque, con un tanque imaginario (tipo + litros) y sin mediciones.
export default function CompatibilidadEspecies() {
  const { t } = useT();
  const u = useUnidades();
  const idBuscar = useId();
  const [agua, setAgua] = useState('dulce');
  const [volumen, setVolumen] = useState(() => String(u.deLitros(100)));
  const [elegidas, setElegidas] = useState(() => EJEMPLO.map(([n, c]) => porNombre(n) && { especie: porNombre(n), cantidad: c }).filter(Boolean));
  const [q, setQ] = useState('');

  // Desde una ficha de WikiTank o desde "¿Qué especies?" (?con=Nombre científico, una o varias veces,
  // y opcionalmente &litros=): se empieza con esas especies y el tipo de agua de la primera.
  // Se lee tras montar para que el HTML estático (con el ejemplo) coincida al hidratar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const especies = params.getAll('con').map(porNombre).filter(Boolean);
    if (!especies.length) return;
    const [e] = especies;
    const marino = e.ficha.agua === 'marina';
    const reef = especies.some((x) => x.categoria === 'coral') || (marino && e.ficha.reef === 'si');
    setAgua(marino ? (reef ? 'reef' : 'marino') : 'dulce');
    setElegidas(especies.map((x) => ({ especie: x, cantidad: x.ficha.grupo || 1 })));
    const litros = Number(params.get('litros'));
    if (litros > 0) setVolumen(String(u.deLitros(litros)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al llegar a la página
  }, []);

  const sugerencias = useMemo(() => {
    const b = normalizar(q);
    if (b.length < 2) return [];
    const ya = new Set(elegidas.map((x) => x.especie.nombre));
    return CON_FICHA.filter((e) => !ya.has(e.nombre) && (!e.ficha.agua || e.ficha.agua === AGUA[agua])
      && (normalizar(e.nombre).includes(b) || normalizar(e.comun).includes(b))).slice(0, 8);
  }, [q, agua, elegidas]);

  const tanque = useMemo(() => ({ tipo: TIPOS[agua], litros: u.aLitros(volumen) || null }), [agua, volumen, u]);
  const habitantes = useMemo(() => elegidas.map((x) => comoHabitante(x.especie, x.cantidad)), [elegidas]);

  function anadir(e) {
    setElegidas((l) => [...l, { especie: e, cantidad: e.ficha.grupo || 1 }]);
    setQ('');
  }
  const cambiarCantidad = (nombre, d) => setElegidas((l) => l.map((x) => (x.especie.nombre === nombre ? { ...x, cantidad: Math.max(1, x.cantidad + d) } : x)));
  const quitar = (nombre) => setElegidas((l) => l.filter((x) => x.especie.nombre !== nombre));

  const h = (k, vars) => t(`herr.compatibilidad.${k}`, vars);
  return (
    <div className="compat-herramienta">
      <fieldset className="campo">
        <legend>{h('agua')}</legend>
        <div className="chips" role="group">
          {Object.keys(TIPOS).map((k) => (
            <button key={k} type="button" aria-pressed={agua === k} className={`chip${agua === k ? ' activo' : ''}`} onClick={() => setAgua(k)}>{h(k)}</button>
          ))}
        </div>
      </fieldset>
      <div className="calc-campos">
        <label className="campo calc-campo">
          <span>{h('litros')}</span>
          <div className="calc-entrada">
            <input className="entrada" type="number" inputMode="decimal" min="1" value={volumen} onChange={(e) => setVolumen(e.target.value)} />
            <span className="calc-unidad">{u.unidadVolumen}</span>
          </div>
        </label>
      </div>

      <div className="campo" style={{ position: 'relative' }}>
        <label htmlFor={idBuscar}>{h('especies')}</label>
        <input id={idBuscar} className="entrada" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder={h('buscarEj')} />
        {sugerencias.length > 0 && (
          <div className="sugerencias cristal">
            {sugerencias.map((e) => (
              <button type="button" key={e.nombre} onClick={() => anadir(e)}>
                <img loading="lazy" src={encodeURI(e.imagen)} alt="" />
                <span>{e.comun && e.comun !== e.nombre && <>{e.comun} </>}<em>{e.nombre}</em><br /><span className="mini texto-3">{t(`habitantes.${e.categoria}`)}</span></span>
              </button>
            ))}
          </div>
        )}
      </div>

      {elegidas.length > 0 && (
        <ul className="compat-elegidas">
          {elegidas.map(({ especie: e, cantidad }) => {
            const nombre = e.comun || e.nombre;
            return (
              <li key={e.nombre}>
                <img src={encodeURI(e.imagen)} alt="" loading="lazy" />
                <span className="compat-elegida-nombre">
                  <strong className="pequeno">{nombre}</strong>
                  <Link href={e.slug ? `/wiki/especies/${e.slug}/` : `/wiki/explorer/${e.ruta}/`} className="mini enlace"><em>{e.nombre}</em> · {h('ficha')}</Link>
                </span>
                <span className="compat-cantidad" role="group" aria-label={h('cantidad', { nombre })}>
                  <button type="button" className="btn btn-icono btn-s" onClick={() => cambiarCantidad(e.nombre, -1)} aria-label="−1"><Minus size={14} /></button>
                  <span className="cifra" aria-live="polite">{cantidad}</span>
                  <button type="button" className="btn btn-icono btn-s" onClick={() => cambiarCantidad(e.nombre, 1)} aria-label="+1"><Plus size={14} /></button>
                </span>
                <button type="button" className="btn btn-icono btn-fantasma btn-s" onClick={() => quitar(e.nombre)} aria-label={h('quitar', { nombre })}><X size={16} /></button>
              </li>
            );
          })}
        </ul>
      )}

      {elegidas.length < 2
        ? <p className="pequeno texto-2">{h('vacio')}</p>
        : <Compatibilidad tanque={tanque} habitantes={habitantes} mediciones={[]} />}

      <div className="compat-cta">
        <p className="pequeno texto-2">{h('guardarTexto')}</p>
        <Link href="/registro/" className="btn btn-primario">{h('guardar')}</Link>
      </div>
    </div>
  );
}
