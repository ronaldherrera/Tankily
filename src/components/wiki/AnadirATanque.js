"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { useTostada } from '@/components/ui';
import { analizarCompatibilidad, especieDe, ultimasMediciones } from '@/lib/compatibilidad';
import { ListaAvisos } from '@/components/tanques/Compatibilidad';
import Selector from '@/components/Selector';
import { guardarPendiente, tipoParaEspecie } from '@/lib/tanquePendiente';

const CATEGORIA = { peces: 'pez', 'otros peces': 'pez', corales: 'coral', plantas: 'planta', macroalgas: 'planta', invertebrados: 'invertebrado' };
const menciona = (a, nombre) => [a.especie, a.a?.nombre, a.b?.nombre, ...(a.especies || [])].includes(nombre);

// Separa "Nombre común / otro (Nombre científico)" en sus partes
export function nombresDe(titulo) {
  const m = titulo.match(/^(.*)\(([^)]+)\)\s*$/);
  if (!m) return { comun: titulo.trim(), cientifico: titulo.trim() };
  return { comun: m[1].split('/')[0].trim() || m[2].trim(), cientifico: m[2].split('/')[0].trim() };
}

// Especie de WikiTank y categoría de habitante a partir del título y el grupo de una ficha
export function especieDeFicha(titulo, grupo) {
  const { comun, cientifico } = nombresDe(titulo);
  const especie = especieDe({ nombre: comun, nombre_cientifico: cientifico });
  return { comun, cientifico, especie, categoria: especie?.categoria || CATEGORIA[(grupo || '').toLowerCase()] || 'otro' };
}

// Visitante sin cuenta: deja la especie preparada para su primer tanque (lib/tanquePendiente.js) antes del registro
export function prepararEspecie({ comun, cientifico, especie, categoria }) {
  guardarPendiente({
    tipo: tipoParaEspecie(especie),
    habitantes: [{ nombre: comun, nombre_cientifico: cientifico, wiki_ruta: especie?.ruta || null, categoria, cantidad: especie?.ficha?.grupo || 1 }],
  });
}

// "Añadir a mi tanque" en la ficha de una especie de WikiTank: convierte una visita de la wiki
// en un habitante del tanque (o en una cuenta nueva), comprobando antes si encaja.
export default function AnadirATanque({ titulo, grupo }) {
  const { usuario, cargando } = useSesion();
  const { t } = useT();
  const tostada = useTostada();
  const { comun, cientifico, especie, categoria } = useMemo(() => especieDeFicha(titulo, grupo), [titulo, grupo]);

  const [tanques, setTanques] = useState(null);
  const [tanqueId, setTanqueId] = useState('');
  const [contexto, setContexto] = useState(null); // habitantes y mediciones del tanque elegido
  const [cantidad, setCantidad] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    supabase.from('tanques').select('id, nombre, tipo, litros').eq('usuario_id', usuario.id).order('creado_en')
      .then(({ data }) => { setTanques(data || []); if (data?.length) setTanqueId(String(data[0].id)); });
  }, [usuario]);

  useEffect(() => {
    if (!tanqueId) return;
    setContexto(null);
    Promise.all([
      supabase.from('habitantes').select('*').eq('tanque_id', tanqueId),
      supabase.from('mediciones').select('parametro, valor, medido_en').eq('tanque_id', tanqueId).order('medido_en', { ascending: false }).limit(100),
    ]).then(([h, m]) => setContexto({ habitantes: h.data || [], mediciones: m.data || [] }));
  }, [tanqueId]);

  const tanque = tanques?.find((x) => String(x.id) === tanqueId);
  const encaje = useMemo(() => {
    if (!tanque || !contexto || !especie?.ficha) return null;
    const candidato = { nombre: comun, nombre_cientifico: cientifico, wiki_ruta: especie.ruta, categoria, cantidad: Number(cantidad) || 1 };
    const r = analizarCompatibilidad({ tanque, habitantes: [...contexto.habitantes, candidato], ultimas: ultimasMediciones(contexto.mediciones) });
    return r.avisos.filter((a) => menciona(a, comun));
  }, [tanque, contexto, especie, comun, cientifico, categoria, cantidad]);

  async function anadir() {
    setGuardando(true);
    const { error } = await supabase.from('habitantes').insert({
      tanque_id: Number(tanqueId), nombre: comun, nombre_cientifico: cientifico, categoria,
      cantidad: Number(cantidad) || 1, wiki_ruta: especie?.ruta || null,
    });
    if (!error) await supabase.from('tanque_eventos').insert({ tanque_id: Number(tanqueId), tipo: 'alta', nota: `${Number(cantidad) || 1} × ${comun}` });
    setGuardando(false);
    if (error) return tostada(t('comun.errorGuardar', { error: error.message }));
    setHecho(tanque);
    tostada(t('anadir.anadido', { especie: comun, tanque: tanque.nombre }));
  }

  if (cargando) return null;

  return (
    <section className="anadir-tanque" aria-labelledby="anadir-titulo">
      <h3 className="titulo-s" id="anadir-titulo">{t('anadir.titulo')}</h3>
      {!usuario ? (
        <>
          <p className="pequeno texto-2">{t('anadir.sinCuenta')}</p>
          <Link href="/registro/" className="btn btn-primario" style={{ alignSelf: 'flex-start' }} onClick={() => prepararEspecie({ comun, cientifico, especie, categoria })}>{t('anadir.crearCuenta')}</Link>
        </>
      ) : tanques === null ? null : tanques.length === 0 ? (
        <>
          <p className="pequeno texto-2">{t('anadir.sinTanques')}</p>
          <Link href="/tanques/nuevo/" className="btn btn-primario" style={{ alignSelf: 'flex-start' }}>{t('anadir.crearTanque')}</Link>
        </>
      ) : hecho ? (
        <div className="encaje ok">
          <p className="pequeno">{t('anadir.anadido', { especie: comun, tanque: hecho.nombre })}</p>
          <Link href={`/tanque/?id=${hecho.id}`} className="btn btn-s" style={{ alignSelf: 'flex-start' }}>{t('anadir.verTanque')}</Link>
        </div>
      ) : (
        <>
          <div className="fila-campos">
            <label className="campo">
              <span>{t('anadir.tanque')}</span>
              <Selector className="entrada" value={tanqueId} onChange={(e) => setTanqueId(e.target.value)}>
                {tanques.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </Selector>
            </label>
            <label className="campo" style={{ maxWidth: 120 }}>
              <span>{t('anadir.cantidad')}</span>
              <input className="entrada" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </label>
          </div>
          {encaje && (
            <div className={`encaje ${encaje.length ? 'con-avisos' : 'ok'}`}>
              <strong className="pequeno">{t('compat.encaja')}</strong>
              {encaje.length ? <><p className="mini texto-2">{t('compat.encajaRevisa')}</p><ListaAvisos avisos={encaje} /></> : <p className="mini texto-2">{t('compat.encajaBien')}</p>}
            </div>
          )}
          <button type="button" className="btn btn-primario" style={{ alignSelf: 'flex-start' }} onClick={anadir} disabled={guardando || !tanqueId}>
            <Plus size={16} aria-hidden="true" /> {guardando ? t('anadir.anadiendo') : t('anadir.boton')}
          </button>
        </>
      )}
    </section>
  );
}
