"use client";

import { useMemo, useState } from 'react';
import { ShieldCheck, TriangleAlert, OctagonAlert } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { analizarCompatibilidad, ultimasMediciones } from '@/lib/compatibilidad';

// Formato de valores y rangos de agua en las unidades del usuario
export function useFormatoAgua() {
  const { locale } = useT();
  const u = useUnidades();
  return useMemo(() => {
    const n = (v, p) => new Intl.NumberFormat(locale, { maximumFractionDigits: p === 'ph' ? 2 : 1 }).format(v);
    const unidad = { temperatura: ` ${u.unidadTemp}`, gh: ' °dGH', salinidad: ' ppt', ph: '' };
    const conv = (p, v) => (p === 'temperatura' ? u.deC(v) : v);
    const valor = (p, v) => `${n(conv(p, v), p)}${unidad[p] ?? ''}`;
    const rango = (p, [a, b]) => (a === b ? valor(p, a) : `${n(conv(p, a), p)}–${n(conv(p, b), p)}${unidad[p] ?? ''}`);
    const lista = (nombres) => new Intl.ListFormat(locale, { type: 'conjunction' }).format(nombres);
    return { valor, rango, lista, volumen: u.volumen };
  }, [locale, u]);
}

// Texto de un aviso de compatibilidad
export function textoAviso(a, t, f) {
  const param = a.parametro ? t(`compat.param.${a.parametro}`) : '';
  switch (a.tipo) {
    case 'agua': return t(a.agua === 'dulce' ? 'compat.aguaDulce' : 'compat.aguaMarina', { especies: f.lista(a.especies) });
    case 'reefNo': return t('compat.reefNo', { especies: f.lista(a.especies) });
    case 'reefPrecaucion': return t('compat.reefPrecaucion', { especies: f.lista(a.especies) });
    case 'rango': return t('compat.rango', { parametro: param, a: a.a.nombre, ra: f.rango(a.parametro, a.a.rango), b: a.b.nombre, rb: f.rango(a.parametro, a.b.rango) });
    case 'medicion': return t('compat.medicion', { parametro: param, valor: f.valor(a.parametro, a.valor), especies: f.lista(a.especies) });
    case 'litros': return t('compat.litros', { especie: a.especie, necesita: f.volumen(a.necesita), tiene: f.volumen(a.tiene) });
    case 'grupo': return t('compat.grupo', { especie: a.especie, minimo: a.minimo, tiene: a.tiene });
    case 'agresivo': return t('compat.agresivo', { especies: f.lista(a.especies) });
    default: return '';
  }
}

// Muestra los primeros `limite` avisos (los conflictos van primero) y pliega el resto
export function ListaAvisos({ avisos, limite = Infinity }) {
  const { t } = useT();
  const f = useFormatoAgua();
  const [todos, setTodos] = useState(false);
  const visibles = todos ? avisos : avisos.slice(0, limite);
  return (
    <>
    <ul className="compat-avisos">
      {visibles.map((a, i) => (
        <li key={i} className={`nivel-${a.nivel}`}>
          {a.nivel === 'conflicto' ? <OctagonAlert size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
          <span><b>{t(`compat.${a.nivel}`)}</b> {textoAviso(a, t, f)}</span>
        </li>
      ))}
    </ul>
    {visibles.length < avisos.length && (
      <button type="button" className="btn btn-fantasma btn-s" style={{ alignSelf: 'flex-start' }} onClick={() => setTodos(true)}>
        {t('compat.verMas', { n: avisos.length - visibles.length })}
      </button>
    )}
    </>
  );
}

// Panel de compatibilidad del tanque (pestaña Habitantes)
export default function Compatibilidad({ tanque, habitantes, mediciones }) {
  const { t } = useT();
  const f = useFormatoAgua();
  const r = useMemo(
    () => analizarCompatibilidad({ tanque, habitantes, ultimas: ultimasMediciones(mediciones) }),
    [tanque, habitantes, mediciones],
  );
  if (!habitantes.length) return null;

  const conflictos = r.avisos.filter((a) => a.nivel === 'conflicto').length;
  const estado = conflictos ? 'conflicto' : r.avisos.length ? 'aviso' : 'ok';
  const Icono = estado === 'ok' ? ShieldCheck : estado === 'conflicto' ? OctagonAlert : TriangleAlert;
  const rangos = Object.entries(r.rangos).filter(([, v]) => v);

  return (
    <section className={`compat cristal-suave compat-${estado}`} aria-labelledby="compat-titulo">
      <header className="compat-cabecera">
        <Icono size={20} aria-hidden="true" />
        <h2 className="titulo-s" id="compat-titulo">{t('compat.titulo')}</h2>
        {r.avisos.length > 0 && <span className="compat-resumen">{t('compat.problemas', { n: r.avisos.length })}</span>}
      </header>

      {r.conFicha === 0 ? (
        <p className="pequeno texto-2">{t('compat.vacio')}</p>
      ) : (
        <>
          {estado === 'ok' && <p className="pequeno texto-2">{t('compat.todoBien', { n: r.conFicha })}</p>}
          {r.avisos.length > 0 && <ListaAvisos avisos={r.avisos} limite={4} />}
          {rangos.length > 0 && (
            <div className="compat-rangos">
              <span className="mini texto-3">{t('compat.aguaIdeal')}</span>
              <div className="chips">
                {rangos.map(([p, v]) => <span key={p} className="chip">{t(`parametros.${p}`)} {f.rango(p, v)}</span>)}
              </div>
            </div>
          )}
        </>
      )}
      <p className="mini texto-3">
        {r.sinFicha > 0 && <>{t('compat.sinFicha', { n: r.sinFicha })} </>}
        {t(mediciones.length ? 'compat.fuente' : 'compat.fuenteFichas')}
      </p>
    </section>
  );
}
