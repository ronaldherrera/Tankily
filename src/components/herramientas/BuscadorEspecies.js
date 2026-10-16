"use client";

import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { especiesQueEncajan } from '@/lib/compatibilidad';

const AGUAS = { dulce: 'dulce', marina: 'marino' }; // valor de la ficha → texto (herr.compatibilidad.*)
const DIFICULTAD = [['2', 'facil'], ['3', 'media'], ['', 'cualquiera']];
const CATEGORIAS = ['pez', 'invertebrado', 'coral', 'planta'];
const POR_PAGINA = 24;

const numero = (v) => (v === '' || v == null || Number.isNaN(Number(String(v).replace(',', '.'))) ? null : Number(String(v).replace(',', '.')));

// "¿Qué especies puedo tener?": filtra las fichas de WikiTank por agua, litros, temperatura, pH y
// dificultad. Cada resultado enlaza a su ficha; con varias elegidas, se abre la de compatibilidad.
export default function BuscadorEspecies() {
  const { t } = useT();
  const u = useUnidades();
  const [agua, setAgua] = useState('dulce');
  const [volumen, setVolumen] = useState(() => String(u.deLitros(60)));
  const [temp, setTemp] = useState('');
  const [ph, setPh] = useState('');
  const [dificultad, setDificultad] = useState('2');
  const [categoria, setCategoria] = useState('pez');
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [elegidas, setElegidas] = useState([]); // nombres científicos para comprobar juntas

  const lista = useMemo(() => especiesQueEncajan({
    agua,
    litros: u.aLitros(volumen),
    temp: numero(temp) == null ? null : u.aC(numero(temp)),
    ph: numero(ph),
    difMax: numero(dificultad),
    categoria: categoria || null,
  }), [agua, volumen, temp, ph, dificultad, categoria, u]);

  const h = (k, vars) => t(`herr.especies.${k}`, vars);
  const consulta = new URLSearchParams([...elegidas.map((n) => ['con', n]), ...(u.aLitros(volumen) ? [['litros', String(u.aLitros(volumen))]] : [])]);
  const enlaceCompatibilidad = `/herramientas/compatibilidad/${elegidas.length ? `?${consulta}` : ''}`;
  // Cambiar un filtro vuelve a la primera página de resultados
  const con = (fijar) => (v) => { fijar(v); setVisibles(POR_PAGINA); };

  return (
    <div className="compat-herramienta">
      <fieldset className="campo">
        <legend>{t('herr.compatibilidad.agua')}</legend>
        <div className="chips" role="group">
          {Object.entries(AGUAS).map(([k, texto]) => (
            <button key={k} type="button" aria-pressed={agua === k} className={`chip${agua === k ? ' activo' : ''}`} onClick={() => con(setAgua)(k)}>{t(`herr.compatibilidad.${texto}`)}</button>
          ))}
        </div>
      </fieldset>
      <div className="calc-campos">
        <label className="campo calc-campo">
          <span>{t('herr.compatibilidad.litros')}</span>
          <div className="calc-entrada">
            <input className="entrada" type="number" inputMode="decimal" min="1" value={volumen} onChange={(e) => con(setVolumen)(e.target.value)} />
            <span className="calc-unidad">{u.unidadVolumen}</span>
          </div>
        </label>
        <label className="campo calc-campo">
          <span><small className="campo-opcional">{h('opcional')}</small>{h('temp')}</span>
          <div className="calc-entrada">
            <input className="entrada" type="number" inputMode="decimal" step="0.5" value={temp} onChange={(e) => con(setTemp)(e.target.value)} />
            <span className="calc-unidad">{u.unidadTemp}</span>
          </div>
        </label>
        <label className="campo calc-campo">
          <span><small className="campo-opcional">{h('opcional')}</small>{h('ph')}</span>
          <input className="entrada" type="number" inputMode="decimal" step="0.1" min="4" max="9.5" value={ph} onChange={(e) => con(setPh)(e.target.value)} />
        </label>
      </div>
      <fieldset className="campo">
        <legend>{h('dificultad')}</legend>
        <div className="chips" role="group">
          {DIFICULTAD.map(([v, k]) => (
            <button key={k} type="button" aria-pressed={dificultad === v} className={`chip${dificultad === v ? ' activo' : ''}`} onClick={() => con(setDificultad)(v)}>{h(k)}</button>
          ))}
        </div>
      </fieldset>
      <fieldset className="campo">
        <legend>{h('tipoEspecie')}</legend>
        <div className="chips" role="group">
          {CATEGORIAS.map((c) => (
            <button key={c} type="button" aria-pressed={categoria === c} className={`chip${categoria === c ? ' activo' : ''}`} onClick={() => con(setCategoria)(c)}>{t(`habitantes.${c}`)}</button>
          ))}
        </div>
      </fieldset>

      <p className="titulo-s" aria-live="polite">{h('resultados', { n: lista.length })}</p>
      {lista.length === 0 ? <p className="pequeno texto-2">{h('vacio')}</p> : (
        <ul className="compat-elegidas">
          {lista.slice(0, visibles).map(({ especie: e, litrosMin }) => (
            <li key={e.nombre}>
              <img src={encodeURI(e.imagen)} alt="" loading="lazy" />
              <span className="compat-elegida-nombre">
                <Link href={e.slug ? `/wiki/especies/${e.slug}/` : `/wiki/explorer/${e.ruta}/`} className="pequeno enlace"><strong>{e.comun || e.nombre}</strong></Link>
                <span className="mini texto-3">
                  <em>{e.nombre}</em>
                  {e.ficha.t && <> · {u.deC(e.ficha.t[0])}–{u.deC(e.ficha.t[1])} {u.unidadTemp}</>}
                  {e.ficha.ph && <> · pH {e.ficha.ph[0]}–{e.ficha.ph[1]}</>}
                  {litrosMin && <> · {h('desde', { v: u.volumen(litrosMin) })}</>}
                  {e.ficha.grupo && <> · {h('grupo', { n: e.ficha.grupo })}</>}
                </span>
              </span>
              {e.ficha.dif && <span className="mini texto-2" aria-label={`${h('dificultad')}: ${e.ficha.dif}/5`}>{'★'.repeat(e.ficha.dif)}</span>}
              <button
                type="button"
                className={`btn btn-icono btn-s${elegidas.includes(e.nombre) ? ' btn-primario' : ''}`}
                aria-pressed={elegidas.includes(e.nombre)}
                aria-label={h('elegir', { nombre: e.comun || e.nombre })}
                onClick={() => setElegidas((l) => (l.includes(e.nombre) ? l.filter((x) => x !== e.nombre) : [...l, e.nombre]))}
              >
                {elegidas.includes(e.nombre) ? <Check size={14} /> : <Plus size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {lista.length > visibles && <button type="button" className="btn" style={{ alignSelf: 'center' }} onClick={() => setVisibles((v) => v + POR_PAGINA)}>{h('verMas')}</button>}

      <div className="compat-cta">
        <p className="pequeno texto-2">{t('herr.compatibilidad.desc')}</p>
        <Link href={enlaceCompatibilidad} className={`btn${elegidas.length > 1 ? ' btn-primario' : ''}`}>
          {elegidas.length > 1 ? h('comprobarN', { n: elegidas.length }) : h('comprobar')}
        </Link>
      </div>
    </div>
  );
}
