"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/Enlace';
import { Droplets, FlaskConical, Filter, Brush, Sprout, Pipette, Scissors, Package, ListChecks, Check, Plus, Trash2, Pencil, CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { Modal, useTostada } from '@/components/ui';
import { TIPOS_TAREA, marcarHecha, tareasDelTanque, programarTarea, fechasDeTarea, deFechaISO, aFechaISO } from '@/lib/tareas';
import Selector from '@/components/Selector';

const ICONOS = { cambio_agua: Droplets, test: FlaskConical, filtro: Filter, limpieza: Brush, abono: Sprout, dosificacion: Pipette, poda: Scissors, alimento: Package, otro: ListChecks };

export const nombreTarea = (tarea, t) => (tarea.tipo === 'otro' && tarea.nombre ? tarea.nombre : t(`tareas.tipos.${tarea.tipo}`));

// Cuándo toca, en palabras: "Atrasada 3 días", "Toca hoy", "En 5 días"
export function cuandoToca(dias, t) {
  if (dias < 0) return t('tareas.atrasada', { n: -dias });
  if (dias === 0) return t('tareas.hoy');
  return t('tareas.faltan', { n: dias });
}

const fechaCorta = (iso, locale) => deFechaISO(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

// Una tarea con su estado y el botón "Hecho". `tanque` se muestra en el panel de la portada;
// `onEditar` (solo en la ficha del tanque) abre la frecuencia y la fecha programada.
export function FilaTarea({ tarea, onHecha, onEditar, tanque }) {
  const { t, locale } = useT();
  const tostada = useTostada();
  const [haciendo, setHaciendo] = useState(false);
  const Icono = ICONOS[tarea.tipo] || ListChecks;
  const estado = tarea.dias < 0 ? 'atrasada' : tarea.dias === 0 ? 'toca' : 'pronto';
  const nombre = nombreTarea(tarea, t);

  async function hecha() {
    setHaciendo(true);
    try {
      const r = await marcarHecha(tarea);
      onHecha(r);
      tostada(t(r.evento ? 'tareas.hechoDiario' : 'tareas.hechoSolo', { tarea: nombre }));
    } catch (e) {
      tostada(t('comun.errorGuardar', { error: e.message }));
    }
    setHaciendo(false);
  }

  return (
    <li className={`tarea tarea-${estado}`}>
      <span className="tarea-icono"><Icono size={17} aria-hidden="true" /></span>
      <div className="tarea-texto">
        <strong>{nombre}</strong>
        <span className="mini texto-3">
          {tanque && <><Link href={`/tanque/?id=${tarea.tanque_id}`} className="enlace">{tanque}</Link> · </>}
          {t('tareas.cada', { n: tarea.cada_dias })}
        </span>
      </div>
      <span className="tarea-estado">
        {tarea.proxima && tarea.dias > 0
          ? <><CalendarDays size={13} aria-hidden="true" /> {fechaCorta(tarea.proxima, locale)}</>
          : cuandoToca(tarea.dias, t)}
      </span>
      <div className="tarea-acciones">
        <button type="button" className={`tarea-hecho${tarea.dias <= 0 ? ' urgente' : ''}`} onClick={hecha} disabled={haciendo}
          aria-label={`${t('tareas.hecho')}: ${nombre}`} title={t('tareas.hecho')}>
          <Check size={16} aria-hidden="true" />
        </button>
        {onEditar && (
          <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={() => onEditar(tarea)} aria-label={t('tareas.editar', { tarea: nombre })}>
            <Pencil size={14} />
          </button>
        )}
      </div>
    </li>
  );
}

// Elegir un día (calendario del navegador) o dejar que siga su frecuencia
function CampoFecha({ valor, onCambio }) {
  const { t } = useT();
  return (
    <label className="campo">
      <span>{t('tareas.proximaVez')}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="entrada" type="date" min={aFechaISO(new Date())} value={valor || ''} onChange={(e) => onCambio(e.target.value || null)} style={{ flex: 1 }} />
        {valor && <button type="button" className="btn btn-s btn-fantasma" onClick={() => onCambio(null)}>{t('tareas.quitarFecha')}</button>}
      </div>
      <span className="mini texto-3">{t(valor ? 'tareas.proximaAyuda' : 'tareas.sinFecha')}</span>
    </label>
  );
}

function FormularioTarea({ tanque, onGuardada, onCerrar }) {
  const { t } = useT();
  const tostada = useTostada();
  const [tipo, setTipo] = useState('test');
  const [nombre, setNombre] = useState('');
  const [cada, setCada] = useState(TIPOS_TAREA.test.dias);
  const [proxima, setProxima] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    const { data, error } = await supabase.from('tareas')
      .insert({ tanque_id: tanque.id, tipo, nombre: tipo === 'otro' ? nombre.trim() : null, cada_dias: Number(cada), proxima })
      .select().single();
    setGuardando(false);
    if (error) return tostada(t('comun.errorGuardar', { error: error.message }));
    onGuardada(data);
    onCerrar();
  }

  return (
    <Modal titulo={t('tareas.anadir')} onCerrar={onCerrar}>
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="campo">
          <span>{t('tareas.tipo')}</span>
          <Selector className="entrada" value={tipo} onChange={(e) => { setTipo(e.target.value); setCada(TIPOS_TAREA[e.target.value].dias); }}>
            {Object.keys(TIPOS_TAREA).map((k) => <option key={k} value={k}>{t(`tareas.tipos.${k}`)}</option>)}
          </Selector>
        </label>
        {tipo === 'otro' && (
          <label className="campo">
            <span>{t('tareas.nombre')}</span>
            <input className="entrada" required maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t('tareas.nombreEj')} />
          </label>
        )}
        <label className="campo">
          <span>{t('tareas.frecuencia')}</span>
          <input className="entrada" type="number" min="1" max="365" required value={cada} onChange={(e) => setCada(e.target.value)} />
        </label>
        <CampoFecha valor={proxima} onCambio={setProxima} />
        <p className="mini texto-3">{t('tareas.cambioAgua')}</p>
        <button className="btn btn-primario" disabled={guardando || (tipo === 'otro' && !nombre.trim())}>{guardando ? t('comun.guardando') : t('tareas.guardar')}</button>
      </form>
    </Modal>
  );
}

// Cambiar la frecuencia, programar la próxima vez o borrar (el cambio de agua no se borra: es del tanque)
function EditarTarea({ tarea, onGuardada, onBorrar, onCerrar }) {
  const { t } = useT();
  const tostada = useTostada();
  const [cada, setCada] = useState(tarea.cada_dias);
  const [proxima, setProxima] = useState(tarea.proxima || null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      onGuardada(await programarTarea(tarea, { cadaDias: Number(cada), proxima }));
      tostada(t('tareas.guardado'));
      onCerrar();
    } catch (err) {
      tostada(t('comun.errorGuardar', { error: err.message }));
    }
    setGuardando(false);
  }

  return (
    <Modal titulo={nombreTarea(tarea, t)} onCerrar={onCerrar}>
      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="campo">
          <span>{t('tareas.frecuencia')}</span>
          <input className="entrada" type="number" min="1" max="365" required value={cada} onChange={(e) => setCada(e.target.value)} />
        </label>
        <CampoFecha valor={proxima} onCambio={setProxima} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {!tarea.virtual
            ? <button type="button" className="btn btn-s btn-peligro" onClick={() => { onBorrar(tarea); onCerrar(); }}><Trash2 size={14} aria-hidden="true" /> {t('tareas.borrarTarea')}</button>
            : <span />}
          <button className="btn btn-primario" disabled={guardando}>{guardando ? t('comun.guardando') : t('tareas.guardar')}</button>
        </div>
      </form>
    </Modal>
  );
}

// Mes con lo que toca cada día. Al elegir un día se ve qué toca y se puede programar ahí cualquier tarea.
function Calendario({ lista, onProgramar }) {
  const { t, locale } = useT();
  const hoy = aFechaISO(new Date());
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [dia, setDia] = useState(hoy);
  const [elegida, setElegida] = useState('');

  // Lunes primero; huecos al principio para que el día 1 caiga en su columna
  const huecos = (mes.getDay() + 6) % 7;
  const nDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const dias = Array.from({ length: nDias }, (_, i) => aFechaISO(new Date(mes.getFullYear(), mes.getMonth(), i + 1)));
  const porDia = useMemo(() => {
    const m = {};
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    lista.forEach((tarea) => fechasDeTarea(tarea, mes, fin).forEach((f) => { (m[f] = m[f] || []).push(tarea); }));
    return m;
  }, [lista, mes]);
  const semana = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  const delDia = porDia[dia] || [];
  const otras = lista.filter((x) => !delDia.includes(x));
  const cambiarMes = (n) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className="calendario-tareas">
      <div className="calendario-cabecera">
        <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={() => cambiarMes(-1)} aria-label={t('tareas.mesAnterior')}><ChevronLeft size={16} /></button>
        <strong style={{ textTransform: 'capitalize' }}>{mes.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</strong>
        <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={() => cambiarMes(1)} aria-label={t('tareas.mesSiguiente')}><ChevronRight size={16} /></button>
      </div>
      <div className="calendario-rejilla" role="grid">
        {semana.map((d, i) => <span key={i} className="calendario-semana mini texto-3" aria-hidden="true">{d}</span>)}
        {Array.from({ length: huecos }, (_, i) => <span key={`h${i}`} />)}
        {dias.map((f) => {
          const tareas = porDia[f] || [];
          return (
            <button key={f} type="button" role="gridcell" aria-selected={f === dia}
              className={`calendario-dia${f === hoy ? ' hoy' : ''}${f < hoy ? ' pasado' : ''}`}
              onClick={() => { setDia(f); setElegida(''); }}
              aria-label={`${deFechaISO(f).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}${tareas.length ? `: ${tareas.map((x) => nombreTarea(x, t)).join(', ')}` : ''}`}>
              <span className="calendario-num">{Number(f.slice(8))}</span>
              <span className="calendario-puntos" aria-hidden="true">
                {tareas.slice(0, 3).map((x) => { const I = ICONOS[x.tipo] || ListChecks; return <I key={x.id} size={11} />; })}
                {tareas.length > 3 && <span className="mini">+{tareas.length - 3}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="calendario-detalle">
        <strong className="pequeno" style={{ textTransform: 'capitalize' }}>{deFechaISO(dia).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
        {delDia.length
          ? <ul className="calendario-lista">{delDia.map((x) => { const I = ICONOS[x.tipo] || ListChecks; return <li key={x.id}><I size={14} aria-hidden="true" /> {nombreTarea(x, t)}</li>; })}</ul>
          : <p className="mini texto-3" style={{ margin: 0 }}>{t('tareas.nadaEseDia')}</p>}
        {dia >= hoy && otras.length > 0 && (
          <div className="calendario-programar">
            <Selector className="entrada" value={elegida} onChange={(e) => setElegida(e.target.value)} aria-label={t('tareas.tipo')}>
              <option value="">{t('tareas.elegirTarea')}</option>
              {otras.map((x) => <option key={x.id} value={String(x.id)}>{nombreTarea(x, t)}</option>)}
            </Selector>
            <button type="button" className="btn btn-s btn-primario" disabled={!elegida}
              onClick={() => onProgramar(otras.find((x) => String(x.id) === elegida), dia)}>
              <CalendarDays size={14} aria-hidden="true" /> {t('tareas.programarAqui')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel de mantenimiento de un tanque (solo lo ve su dueño)
export default function Mantenimiento({ tanque, eventos, setEventos }) {
  const { t, locale } = useT();
  const tostada = useTostada();
  const [tareas, setTareas] = useState(null);
  const [formulario, setFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [vista, setVista] = useState('lista');
  // Frecuencia y fecha programada del cambio de agua: viven en el tanque, aquí se guardan los cambios
  const [agua, setAgua] = useState({ cambio_agua_cada_dias: tanque.cambio_agua_cada_dias, cambio_agua_proximo: tanque.cambio_agua_proximo || null });

  useEffect(() => {
    supabase.from('tareas').select('*').eq('tanque_id', tanque.id).then(({ data }) => setTareas(data || []));
  }, [tanque.id]);

  const ultimoCambio = eventos.find((e) => e.tipo === 'cambio_agua')?.fecha || null;
  const lista = useMemo(() => tareasDelTanque({ ...tanque, ...agua }, tareas || [], ultimoCambio), [tanque, agua, tareas, ultimoCambio]);

  function actualizar(tarea) {
    if (tarea.virtual) setAgua({ cambio_agua_cada_dias: tarea.cada_dias, cambio_agua_proximo: tarea.proxima || null });
    else setTareas((ts) => ts.map((x) => (x.id === tarea.id ? tarea : x)));
  }

  function alHacer({ tarea, evento }) {
    if (evento) setEventos((ev) => [evento, ...ev]);
    actualizar(tarea);
  }

  async function borrar(tarea) {
    const { error } = await supabase.from('tareas').delete().eq('id', tarea.id);
    if (!error) setTareas((ts) => ts.filter((x) => x.id !== tarea.id));
  }

  async function programarDia(tarea, dia) {
    try {
      actualizar(await programarTarea(tarea, { cadaDias: tarea.cada_dias, proxima: dia }));
      tostada(t('tareas.programadaPara', { tarea: nombreTarea(tarea, t), fecha: fechaCorta(dia, locale) }));
    } catch (e) {
      tostada(t('comun.errorGuardar', { error: e.message }));
    }
  }

  if (tareas === null) return null;

  return (
    <section className="cristal-suave mantenimiento" aria-labelledby="mant-titulo">
      <div className="mantenimiento-cabecera">
        <h2 className="titulo-s" id="mant-titulo">{t('tareas.titulo')}</h2>
        {lista.length > 0 && (
          <div className="chips" role="group" aria-label={t('tareas.titulo')}>
            <button type="button" className="chip" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')}><List size={14} aria-hidden="true" /> {t('tareas.lista')}</button>
            <button type="button" className="chip" aria-pressed={vista === 'calendario'} onClick={() => setVista('calendario')}><CalendarDays size={14} aria-hidden="true" /> {t('tareas.calendario')}</button>
          </div>
        )}
        <button type="button" className="btn btn-s" onClick={() => setFormulario(true)}><Plus size={14} aria-hidden="true" /> {t('tareas.anadir')}</button>
      </div>
      {lista.length === 0 ? (
        <p className="pequeno texto-2">{t('tareas.vacio')}</p>
      ) : vista === 'calendario' ? (
        <Calendario lista={lista} onProgramar={programarDia} />
      ) : (
        <ul className="lista-tareas">
          {lista.map((tarea) => <FilaTarea key={tarea.id} tarea={tarea} onHecha={alHacer} onEditar={setEditando} />)}
        </ul>
      )}
      {formulario && <FormularioTarea tanque={tanque} onCerrar={() => setFormulario(false)} onGuardada={(n) => setTareas((ts) => [...ts, n])} />}
      {editando && <EditarTarea tarea={editando} onCerrar={() => setEditando(null)} onGuardada={actualizar} onBorrar={borrar} />}
    </section>
  );
}
