"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/Enlace';
import { Droplets, FlaskConical, Filter, Brush, Sprout, Pipette, Scissors, Package, ListChecks, Check, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { Modal, useTostada } from '@/components/ui';
import { TIPOS_TAREA, marcarHecha, tareasDelTanque } from '@/lib/tareas';
import Selector from '@/components/Selector';

const ICONOS = { cambio_agua: Droplets, test: FlaskConical, filtro: Filter, limpieza: Brush, abono: Sprout, dosificacion: Pipette, poda: Scissors, alimento: Package, otro: ListChecks };

export const nombreTarea = (tarea, t) => (tarea.tipo === 'otro' && tarea.nombre ? tarea.nombre : t(`tareas.tipos.${tarea.tipo}`));

// Cuándo toca, en palabras: "Atrasada 3 días", "Toca hoy", "En 5 días"
export function cuandoToca(dias, t) {
  if (dias < 0) return t('tareas.atrasada', { n: -dias });
  if (dias === 0) return t('tareas.hoy');
  return t('tareas.faltan', { n: dias });
}

// Una tarea con su estado y el botón "Hecho". `tanque` se muestra en el panel de la portada.
export function FilaTarea({ tarea, onHecha, onBorrar, tanque }) {
  const { t } = useT();
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
      <span className="tarea-estado">{cuandoToca(tarea.dias, t)}</span>
      <button type="button" className={`btn btn-s ${tarea.dias <= 0 ? 'btn-primario' : ''}`} onClick={hecha} disabled={haciendo}>
        <Check size={14} aria-hidden="true" /> {t('tareas.hecho')}
      </button>
      {onBorrar && !tarea.virtual && (
        <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={() => onBorrar(tarea)} aria-label={t('tareas.borrar', { tarea: nombre })}>
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}

function FormularioTarea({ tanque, onGuardada, onCerrar }) {
  const { t } = useT();
  const tostada = useTostada();
  const [tipo, setTipo] = useState('test');
  const [nombre, setNombre] = useState('');
  const [cada, setCada] = useState(TIPOS_TAREA.test.dias);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    const { data, error } = await supabase.from('tareas')
      .insert({ tanque_id: tanque.id, tipo, nombre: tipo === 'otro' ? nombre.trim() : null, cada_dias: Number(cada) })
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
        <p className="mini texto-3">{t('tareas.cambioAgua')} <Link href={`/tanques/nuevo/?id=${tanque.id}`} className="enlace">{t('tanque.editar')}</Link></p>
        <button className="btn btn-primario" disabled={guardando || (tipo === 'otro' && !nombre.trim())}>{guardando ? t('comun.guardando') : t('tareas.guardar')}</button>
      </form>
    </Modal>
  );
}

// Panel de mantenimiento de un tanque (solo lo ve su dueño)
export default function Mantenimiento({ tanque, eventos, setEventos }) {
  const { t } = useT();
  const [tareas, setTareas] = useState(null);
  const [formulario, setFormulario] = useState(false);

  useEffect(() => {
    supabase.from('tareas').select('*').eq('tanque_id', tanque.id).then(({ data }) => setTareas(data || []));
  }, [tanque.id]);

  const ultimoCambio = eventos.find((e) => e.tipo === 'cambio_agua')?.fecha || null;
  const lista = useMemo(() => tareasDelTanque(tanque, tareas || [], ultimoCambio), [tanque, tareas, ultimoCambio]);

  function alHacer({ tarea, evento }) {
    if (evento) setEventos((ev) => [evento, ...ev]);
    if (!tarea.virtual) setTareas((ts) => ts.map((x) => (x.id === tarea.id ? tarea : x)));
  }

  async function borrar(tarea) {
    const { error } = await supabase.from('tareas').delete().eq('id', tarea.id);
    if (!error) setTareas((ts) => ts.filter((x) => x.id !== tarea.id));
  }

  if (tareas === null) return null;

  return (
    <section className="cristal-suave mantenimiento" aria-labelledby="mant-titulo">
      <div className="mantenimiento-cabecera">
        <h2 className="titulo-s" id="mant-titulo">{t('tareas.titulo')}</h2>
        <button type="button" className="btn btn-s" onClick={() => setFormulario(true)}><Plus size={14} aria-hidden="true" /> {t('tareas.anadir')}</button>
      </div>
      {lista.length === 0 ? (
        <p className="pequeno texto-2">{t('tareas.vacio')}</p>
      ) : (
        <ul className="lista-tareas">
          {lista.map((tarea) => <FilaTarea key={tarea.id} tarea={tarea} onHecha={alHacer} onBorrar={borrar} />)}
        </ul>
      )}
      {formulario && <FormularioTarea tanque={tanque} onCerrar={() => setFormulario(false)} onGuardada={(n) => setTareas((ts) => [...ts, n])} />}
    </section>
  );
}
