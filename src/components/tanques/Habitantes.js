"use client";

import { useMemo, useState } from 'react';
import Link from '@/components/Enlace';
import { BookOpen, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CATEGORIAS_HABITANTE } from '@/lib/constantes';
import { especiesWiki } from '@/lib/especiesWiki';
import { useT } from '@/i18n/IdiomaProvider';
import { Modal, Vacio, useTostada } from '@/components/ui';
import { analizarCompatibilidad, especieDe, ultimasMediciones } from '@/lib/compatibilidad';
import Compatibilidad, { ListaAvisos, useFormatoAgua } from './Compatibilidad';

const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ¿El aviso habla de esta especie?
const menciona = (a, nombre) => [a.especie, a.a?.nombre, a.b?.nombre, ...(a.especies || [])].includes(nombre);

// Datos clave de la ficha de WikiTank, en una línea: temperatura · pH · litros mínimos · dificultad
function DatosFicha({ ficha }) {
  const { t } = useT();
  const f = useFormatoAgua();
  const partes = [
    ficha.t && f.rango('temperatura', ficha.t),
    ficha.ph && `pH ${f.rango('ph', ficha.ph)}`,
    ficha.l && t('compat.minimoLitros', { litros: f.volumen(ficha.l) }),
  ].filter(Boolean);
  return (
    <span className="datos-ficha mini texto-3">
      {partes.join(' · ')}
      {ficha.dif && <span className="dificultad" title={t('compat.dificultad', { n: ficha.dif })} aria-label={t('compat.dificultad', { n: ficha.dif })}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= ficha.dif ? 'llena' : ''} />)}</span>}
    </span>
  );
}

function FormularioHabitante({ tanque, habitantes, mediciones, onGuardado, onCerrar }) {
  const tanqueId = tanque.id;
  const tostada = useTostada();
  const { t } = useT();
  const [h, setH] = useState({ nombre: '', nombre_cientifico: '', categoria: 'pez', cantidad: 1, wiki_ruta: null, notas: '' });
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const sugerencias = useMemo(() => {
    const q = normalizar(h.nombre.trim());
    if (q.length < 2) return [];
    return especiesWiki.filter((e) => normalizar(e.nombre).includes(q) || (e.comun && normalizar(e.comun).includes(q))).slice(0, 8);
  }, [h.nombre]);

  // Vista previa: avisos nuevos que aparecerían al añadir esta especie
  const encaje = useMemo(() => {
    if (!h.wiki_ruta) return null;
    const candidato = { nombre: h.nombre.trim(), nombre_cientifico: h.nombre_cientifico, wiki_ruta: h.wiki_ruta, categoria: h.categoria, cantidad: Number(h.cantidad) || 1 };
    if (!especieDe(candidato)?.ficha) return null;
    const r = analizarCompatibilidad({ tanque, habitantes: [...habitantes, candidato], ultimas: ultimasMediciones(mediciones) });
    return r.avisos.filter((a) => menciona(a, candidato.nombre));
  }, [h, tanque, habitantes, mediciones]);

  function elegir(e) {
    setH({ ...h, nombre: e.nombre, nombre_cientifico: e.nombre, categoria: e.categoria, wiki_ruta: e.ruta });
    setAbierto(false);
  }

  async function guardar(ev) {
    ev.preventDefault();
    setGuardando(true);
    const { data, error } = await supabase.from('habitantes').insert({
      tanque_id: tanqueId,
      nombre: h.nombre.trim(),
      nombre_cientifico: h.nombre_cientifico.trim() || null,
      categoria: h.categoria,
      cantidad: Number(h.cantidad) || 1,
      wiki_ruta: h.wiki_ruta,
      notas: h.notas.trim() || null,
    }).select().single();
    if (!error) await supabase.from('tanque_eventos').insert({ tanque_id: tanqueId, tipo: 'alta', nota: `${h.cantidad} × ${h.nombre.trim()}` });
    setGuardando(false);
    if (error) return tostada(t('comun.errorGuardar', { error: error.message }));
    onGuardado(data);
    onCerrar();
  }

  return (
    <Modal titulo={t('habitantesForm.anadir')} onCerrar={onCerrar}>
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="campo" style={{ position: 'relative' }}>
          <span>{t('habitantesForm.especie')}</span>
          <input
            className="entrada"
            required
            maxLength={80}
            autoComplete="off"
            value={h.nombre}
            onChange={(e) => { setH({ ...h, nombre: e.target.value, wiki_ruta: null }); setAbierto(true); }}
            onFocus={() => setAbierto(true)}
            placeholder={t('habitantesForm.especieEj')}
          />
          <small>{t('habitantesForm.enlazara')}</small>
          {abierto && sugerencias.length > 0 && (
            <div className="sugerencias cristal">
              {sugerencias.map((e) => (
                <button type="button" key={e.nombre} onClick={() => elegir(e)}>
                  <img loading="lazy" src={encodeURI(e.imagen)} alt="" />
                  <span>{e.comun && e.comun !== e.nombre && <>{e.comun} </>}<em>{e.nombre}</em><br /><span className="mini texto-3">{t(`habitantes.${e.categoria}`)} · WikiTank</span></span>
                </button>
              ))}
            </div>
          )}
        </label>
        <div className="fila-campos">
          <label className="campo">
            <span>{t('habitantesForm.categoria')}</span>
            <select className="entrada" value={h.categoria} onChange={(e) => setH({ ...h, categoria: e.target.value })}>
              {CATEGORIAS_HABITANTE.map((k) => <option key={k} value={k}>{t(`habitantes.${k}`)}</option>)}
            </select>
          </label>
          <label className="campo">
            <span>{t('habitantesForm.cantidad')}</span>
            <input className="entrada" type="number" min="1" value={h.cantidad} onChange={(e) => setH({ ...h, cantidad: e.target.value })} />
          </label>
        </div>
        <label className="campo">
          <span>{t('habitantesForm.notas')}</span>
          <input className="entrada" maxLength={500} value={h.notas} onChange={(e) => setH({ ...h, notas: e.target.value })} placeholder={t('habitantesForm.notasEj')} />
        </label>
        {h.wiki_ruta && <p className="mini etiqueta-agua">{t('habitantesForm.enlazado')}</p>}
        {encaje && (
          <div className={`encaje ${encaje.length ? 'con-avisos' : 'ok'}`}>
            <strong className="pequeno">{t('compat.encaja')}</strong>
            {encaje.length ? <><p className="mini texto-2">{t('compat.encajaRevisa')}</p><ListaAvisos avisos={encaje} /></> : <p className="mini texto-2">{t('compat.encajaBien')}</p>}
          </div>
        )}
        <button className="btn btn-primario" disabled={guardando || !h.nombre.trim()}>{guardando ? t('comun.guardando') : t('habitantesForm.anadir')}</button>
      </form>
    </Modal>
  );
}

export default function Habitantes({ tanque, habitantes, setHabitantes, mediciones = [], esDueno }) {
  const { t } = useT();
  const [formulario, setFormulario] = useState(false);
  const grupos = {};
  for (const h of habitantes) (grupos[h.categoria] ||= []).push(h);

  async function borrar(h) {
    const { error } = await supabase.from('habitantes').delete().eq('id', h.id);
    if (!error) {
      setHabitantes(habitantes.filter((x) => x.id !== h.id));
      await supabase.from('tanque_eventos').insert({ tanque_id: tanque.id, tipo: 'baja', nota: h.nombre });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {esDueno && <button className="btn btn-primario" style={{ alignSelf: 'flex-start' }} onClick={() => setFormulario(true)}>{t('habitantesForm.anadir')}</button>}

      <Compatibilidad tanque={tanque} habitantes={habitantes} mediciones={mediciones} />

      {habitantes.length === 0 ? (
        <Vacio titulo={t('habitantesForm.vacioTitulo')}>
          {esDueno ? t('habitantesForm.vacioDueno') : t('habitantesForm.vacioOtro')}
        </Vacio>
      ) : (
        CATEGORIAS_HABITANTE.filter((k) => grupos[k]).map((k) => (
          <section key={k} className="cristal-suave" style={{ padding: '12px 16px' }}>
            <h3 className="titulo-s" style={{ marginBottom: 4 }}>{t(`habitantes.${k}`)} <span className="texto-3 pequeno">{grupos[k].reduce((s, h) => s + h.cantidad, 0)}</span></h3>
            <ul className="lista-filas">
              {grupos[k].map((h) => {
                const especie = especieDe(h);
                const imagen = especie?.imagen;
                return (
                  <li key={h.id}>
                    {imagen ? <img loading="lazy" src={encodeURI(imagen)} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} /> : <span className="miniatura-tanque" style={{ width: 44, height: 44 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{h.nombre}</strong>
                      {h.nombre_cientifico && h.nombre_cientifico !== h.nombre && <em className="texto-3 pequeno"> {h.nombre_cientifico}</em>}
                      {especie?.ficha && <DatosFicha ficha={especie.ficha} />}
                      {h.notas && <p className="mini texto-3">{h.notas}</p>}
                    </div>
                    <span className="cifra texto-2">×{h.cantidad}</span>
                    {h.wiki_ruta && (
                      <Link href={`/wiki/explorer/${h.wiki_ruta}/`} className="btn btn-fantasma btn-icono btn-s" aria-label={t('habitantesForm.verWiki', { nombre: h.nombre })} title={t('habitantesForm.verEnWiki')}>
                        <BookOpen size={16} />
                      </Link>
                    )}
                    {esDueno && (
                      <button className="btn btn-fantasma btn-icono btn-s" onClick={() => borrar(h)} aria-label={t('habitantesForm.darBaja', { nombre: h.nombre })}><Trash2 size={14} /></button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {formulario && <FormularioHabitante tanque={tanque} habitantes={habitantes} mediciones={mediciones} onCerrar={() => setFormulario(false)} onGuardado={(h) => setHabitantes([...habitantes, h])} />}
    </div>
  );
}
