"use client";

import { useEffect, useState } from 'react';
import { PROVINCIAS } from '@/lib/constantes';
import { listaPaises } from '@/lib/paises';
import { useT } from '@/i18n/IdiomaProvider';

// País + provincia/región. En España, lista de provincias; en el resto, texto libre.
// modo "filtro" añade la opción de "todos" en ambos campos.
export default function SelectorUbicacion({ pais, region, onCambio, requerido = false, modo = 'formulario' }) {
  const { t, locale } = useT();
  const filtro = modo === 'filtro';
  // Los nombres de país dependen de los datos de idioma del motor (Node y cada navegador difieren):
  // se generan solo en el navegador para no provocar errores de hidratación.
  const [paises, setPaises] = useState([]);
  useEffect(() => { setPaises(listaPaises(locale)); }, [locale]);

  return (
    <>
      <label className={filtro ? undefined : 'campo'} style={filtro ? { display: 'contents' } : undefined}>
        {!filtro && <span>{t('ubicacion.pais')}</span>}
        <select
          className="entrada"
          required={requerido}
          value={pais || ''}
          aria-label={t('ubicacion.pais')}
          onChange={(e) => onCambio({ pais: e.target.value, region: '' })}
        >
          <option value="">{filtro ? t('ubicacion.todosLosPaises') : t('comun.sinIndicar')}</option>
          {paises.length ? paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>) : pais && <option value={pais}>{pais}</option>}
        </select>
      </label>

      {pais && (
        <label className={filtro ? undefined : 'campo'} style={filtro ? { display: 'contents' } : undefined}>
          {!filtro && <span>{t('ubicacion.region')}</span>}
          {pais === 'ES' ? (
            <select className="entrada" required={requerido && !filtro} value={region || ''} aria-label={t('ubicacion.region')} onChange={(e) => onCambio({ pais, region: e.target.value })}>
              <option value="">{filtro ? t('ubicacion.todoElPais') : t('ubicacion.elige')}</option>
              {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
            </select>
          ) : (
            <input
              className="entrada"
              required={requerido && !filtro}
              maxLength={80}
              value={region || ''}
              aria-label={t('ubicacion.region')}
              placeholder={filtro ? t('ubicacion.todoElPais') : t('ubicacion.regionEj')}
              onChange={(e) => onCambio({ pais, region: e.target.value })}
            />
          )}
        </label>
      )}
    </>
  );
}
