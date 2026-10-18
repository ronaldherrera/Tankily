"use client";

import { useId, useState } from 'react';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import dynamic from 'next/dynamic';

// Va en su propio fragmento: lleva el índice de especies (~60 KB), que el resto de calculadoras no necesita
const CompatibilidadEspecies = dynamic(() => import('./CompatibilidadEspecies'));
const BuscadorEspecies = dynamic(() => import('./BuscadorEspecies'));
import {
  volumenRectangular, volumenCilindrico, pesoAgua, cambioAgua, porcentajeParaNitrato,
  co2DesdeKhPh, zonaCo2, convertirDureza, pptDesdeDensidad, densidadDesdePpt, salNecesaria,
} from '@/lib/calculos';
import Selector from '@/components/Selector';

const CM_POR_IN = 2.54;
const L_POR_GAL = 3.78541;
const LB_POR_KG = 2.20462;

const aNumero = (v) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

function useNumero() {
  const { locale } = useT();
  return (v, decimales = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: decimales }).format(v);
}

// Campo numérico con su unidad al lado
function Campo({ etiqueta, unidad, valor, onCambio, paso = 'any', min = 0, max }) {
  const id = useId();
  return (
    <label className="campo calc-campo" htmlFor={id}>
      <span>{etiqueta}</span>
      <div className="calc-entrada">
        <input id={id} className="entrada" type="number" inputMode="decimal" step={paso} min={min} max={max} value={valor} onChange={(e) => onCambio(e.target.value)} />
        {unidad && <span className="calc-unidad">{unidad}</span>}
      </div>
    </label>
  );
}

function Resultado({ etiqueta, valor, detalle, destacado = false, tono }) {
  return (
    <div className={`calc-resultado${destacado ? ' destacado' : ''}${tono ? ` tono-${tono}` : ''}`}>
      <span className="mini texto-3">{etiqueta}</span>
      <span className="calc-valor cifra">{valor}</span>
      {detalle && <span className="mini texto-2">{detalle}</span>}
    </div>
  );
}

// --- Volumen ---------------------------------------------------------------
function Volumen() {
  const { t } = useT();
  const u = useUnidades();
  const n = useNumero();
  const imperial = u.unidadLongitud === 'in';
  const f = imperial ? CM_POR_IN : 1;
  const inicial = (cm) => (imperial ? String(Math.round((cm / CM_POR_IN) * 10) / 10) : String(cm));
  const [forma, setForma] = useState('rectangular');
  const [m, setM] = useState(() => ({ largo: inicial(100), ancho: inicial(40), alto: inicial(50), diametro: inicial(40), sustrato: inicial(5), margen: inicial(3) }));
  const cm = (k) => aNumero(m[k]) * f;
  const campo = (k) => <Campo etiqueta={t(`herr.volumen.${k}`)} unidad={u.unidadLongitud} valor={m[k]} onCambio={(v) => setM({ ...m, [k]: v })} />;
  const r = forma === 'rectangular'
    ? volumenRectangular({ largo: cm('largo'), ancho: cm('ancho'), alto: cm('alto'), sustrato: cm('sustrato'), margen: cm('margen') })
    : volumenCilindrico({ diametro: cm('diametro'), alto: cm('alto'), sustrato: cm('sustrato'), margen: cm('margen') });
  const peso = (kg) => (imperial ? `${n(kg * LB_POR_KG, 0)} lb` : `${n(kg, 0)} kg`);

  return (
    <div className="calc">
      <div className="chips" role="radiogroup" aria-label={t('herr.volumen.forma')}>
        {['rectangular', 'cilindrico'].map((k) => (
          <button key={k} type="button" role="radio" aria-checked={forma === k} className={`chip${forma === k ? ' activo' : ''}`} onClick={() => setForma(k)}>{t(`herr.volumen.${k}`)}</button>
        ))}
      </div>
      <div className="calc-campos">
        {forma === 'rectangular' ? <>{campo('largo')}{campo('ancho')}{campo('alto')}</> : <>{campo('diametro')}{campo('alto')}</>}
        {campo('sustrato')}{campo('margen')}
      </div>
      <div className="calc-resultados">
        <Resultado destacado etiqueta={t('herr.volumen.neto')} valor={u.volumen(r.neto)} detalle={imperial ? `${n(r.neto, 0)} l` : `${n(r.neto / L_POR_GAL, 1)} gal`} />
        <Resultado etiqueta={t('herr.volumen.bruto')} valor={u.volumen(r.bruto)} />
        <Resultado etiqueta={t('herr.volumen.peso')} valor={peso(pesoAgua(r.neto))} detalle={`${t('herr.volumen.dulce')} · ${peso(pesoAgua(r.neto, true))} ${t('herr.volumen.marina')}`} />
      </div>
    </div>
  );
}

// --- Cambio de agua y nitratos ----------------------------------------------
function Cambio() {
  const { t } = useT();
  const u = useUnidades();
  const n = useNumero();
  const imperial = u.unidadVolumen === 'gal';
  const [v, setV] = useState(() => ({ volumen: imperial ? '53' : '200', porcentaje: '30', nitrato: '40', nitratoAgua: '5', objetivo: '20' }));
  const litros = aNumero(v.volumen) * (imperial ? L_POR_GAL : 1);
  const r = cambioAgua({ litros, porcentaje: aNumero(v.porcentaje), nitrato: aNumero(v.nitrato), nitratoAgua: aNumero(v.nitratoAgua) });
  const necesario = porcentajeParaNitrato({ actual: aNumero(v.nitrato), objetivo: aNumero(v.objetivo), nitratoAgua: aNumero(v.nitratoAgua) });
  const campo = (k, unidad, extra = {}) => <Campo etiqueta={t(`herr.cambio.${k}`)} unidad={unidad} valor={v[k]} onCambio={(x) => setV({ ...v, [k]: x })} {...extra} />;

  return (
    <div className="calc">
      <div className="calc-campos">
        {campo('volumen', u.unidadVolumen)}
        {campo('porcentaje', '%', { max: 100 })}
        {campo('nitrato', 'mg/l')}
        {campo('nitratoAgua', 'mg/l')}
        {campo('objetivo', 'mg/l')}
      </div>
      <div className="calc-resultados">
        <Resultado destacado etiqueta={t('herr.cambio.cambiar')} valor={u.volumen(r.cambiar)} />
        <Resultado etiqueta={t('herr.cambio.tras')} valor={`${n(r.nitratoTras)} mg/l`} />
        <Resultado
          etiqueta={t('herr.cambio.necesitas')}
          valor={necesario === null ? '—' : necesario === 0 ? '✓' : t('herr.cambio.necesitasValor', { p: n(necesario, 0) })}
          detalle={necesario === null ? t('herr.cambio.imposible') : necesario === 0 ? t('herr.cambio.yaEsta') : u.volumen((litros * necesario) / 100)}
        />
      </div>
    </div>
  );
}

// --- CO₂ ---------------------------------------------------------------------
function Co2() {
  const { t } = useT();
  const n = useNumero();
  const [kh, setKh] = useState('4');
  const [ph, setPh] = useState('6.8');
  const co2 = co2DesdeKhPh(aNumero(kh), aNumero(ph));
  const zona = zonaCo2(co2);
  const posicion = Math.min(Math.max(co2 / 60, 0), 1) * 100;

  return (
    <div className="calc">
      <div className="calc-campos">
        <Campo etiqueta={t('herr.co2.kh')} valor={kh} onCambio={setKh} paso="0.5" />
        <Campo etiqueta={t('herr.co2.ph')} valor={ph} onCambio={setPh} paso="0.1" min={4} max={9} />
      </div>
      <div className="calc-resultados">
        <Resultado destacado etiqueta={t('herr.co2.resultado')} valor={`${n(co2)} mg/l`} detalle={t(`herr.co2.${zona}`)} tono={zona} />
      </div>
      <div className="escala-co2" aria-hidden="true">
        <div className="escala-co2-barra"><span style={{ left: `${posicion}%` }} /></div>
        <div className="escala-co2-marcas"><span>0</span><span style={{ left: '25%' }}>15</span><span style={{ left: '50%' }}>30</span><span style={{ left: '100%' }}>60</span></div>
      </div>
    </div>
  );
}

// --- Dureza -------------------------------------------------------------------
function Dureza() {
  const { t } = useT();
  const n = useNumero();
  const [valor, setValor] = useState('10');
  const [unidad, setUnidad] = useState('dh');
  const id = useId();
  const r = convertirDureza(aNumero(valor), unidad);
  const UNIDADES = ['dh', 'ppm', 'mmol', 'meq'];

  return (
    <div className="calc">
      <div className="calc-campos">
        <Campo etiqueta={t('herr.dureza.valor')} valor={valor} onCambio={setValor} />
        <label className="campo calc-campo" htmlFor={id}>
          <span>{t('herr.dureza.unidad')}</span>
          <Selector id={id} className="entrada" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            {UNIDADES.map((k) => <option key={k} value={k}>{t(`herr.dureza.${k}`)}</option>)}
          </Selector>
        </label>
      </div>
      <div className="calc-resultados">
        {UNIDADES.filter((k) => k !== unidad).map((k) => (
          <Resultado key={k} etiqueta={t(`herr.dureza.${k}`)} valor={n(r[k], k === 'ppm' ? 0 : 2)} />
        ))}
      </div>
    </div>
  );
}

// --- Salinidad ---------------------------------------------------------------
function Salinidad() {
  const { t } = useT();
  const u = useUnidades();
  const n = useNumero();
  const imperial = u.unidadVolumen === 'gal';
  const [ppt, setPpt] = useState('35');
  const [densidad, setDensidad] = useState('1.0263');
  const [volumen, setVolumen] = useState(imperial ? '26' : '100');
  const litros = aNumero(volumen) * (imperial ? L_POR_GAL : 1);
  const gramos = salNecesaria(litros, aNumero(ppt));
  const sal = imperial ? `${n(gramos / 453.592, 1)} lb` : gramos >= 1000 ? `${n(gramos / 1000, 2)} kg` : `${n(gramos, 0)} g`;

  return (
    <div className="calc">
      <div className="calc-campos">
        <Campo etiqueta={t('herr.salinidad.ppt')} unidad="ppt" valor={ppt} paso="0.5"
          onCambio={(v) => { setPpt(v); setDensidad(densidadDesdePpt(aNumero(v)).toFixed(4)); }} />
        <Campo etiqueta={t('herr.salinidad.densidad')} unidad="SG" valor={densidad} paso="0.001" min={1}
          onCambio={(v) => { setDensidad(v); setPpt(pptDesdeDensidad(aNumero(v)).toFixed(1)); }} />
        <Campo etiqueta={t('herr.salinidad.litros')} unidad={u.unidadVolumen} valor={volumen} onCambio={setVolumen} />
      </div>
      <div className="calc-resultados">
        <Resultado destacado etiqueta={t('herr.salinidad.sal')} valor={sal} detalle={t('herr.salinidad.aprox')} />
      </div>
    </div>
  );
}

const CALCULADORAS = { compatibilidad: CompatibilidadEspecies, especies: BuscadorEspecies, volumen: Volumen, cambio: Cambio, co2: Co2, dureza: Dureza, salinidad: Salinidad };

// La preferencia de unidades se conoce tras montar: la clave reinicia los valores de ejemplo
// en el sistema correcto (cm/l o in/gal).
export default function Calculadora({ tipo }) {
  const u = useUnidades();
  const C = CALCULADORAS[tipo];
  return C ? <C key={u.unidadLongitud} /> : null;
}
