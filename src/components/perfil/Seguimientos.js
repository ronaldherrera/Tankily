"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { Avatar, Modal, Pestanas, Cargando, AlturaFluida } from '@/components/ui';

const PASO = 40;
const PERFIL = 'id, usuario, nombre, avatar_url';
const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Cada pestaña: de qué tabla sale y cómo se lee cada fila. Los tanques que no puedes ver (privados o
// "solo seguidores") no llegan: la RLS de tanques los filtra y `!inner` descarta la fila entera.
const CONSULTAS = {
  seguidores: (id) => supabase.from('seguidores').select(`creado_en, perfil:perfiles!seguidor_id(${PERFIL})`).eq('seguido_id', id),
  siguiendo: (id) => supabase.from('seguidores').select(`creado_en, perfil:perfiles!seguido_id(${PERFIL})`).eq('seguidor_id', id),
  tanques: (id) => supabase.from('tanque_seguidores')
    .select('creado_en, tanque:tanques!inner(id, nombre, tipo, foto_url, autor:perfiles!usuario_id(usuario, nombre, avatar_url))').eq('usuario_id', id),
};

// Ids de las personas que sigue quien mira (para los botones y "en común")
export async function cargarMisSeguidos(miId) {
  if (!miId) return new Set();
  const { data } = await supabase.from('seguidores').select('seguido_id').eq('seguidor_id', miId).limit(5000);
  return new Set((data || []).map((f) => f.seguido_id));
}

// Seguidores del perfil a los que sigue quien mira ("seguido por … en común")
export async function cargarComunes(perfilId, misSeguidos, limite = 1000) {
  const ids = [...misSeguidos].filter((x) => x !== perfilId).slice(0, 300);
  if (!ids.length) return { lista: [], total: 0 };
  const { data, count } = await supabase.from('seguidores')
    .select(`perfil:perfiles!seguidor_id(${PERFIL})`, { count: 'exact' })
    .eq('seguido_id', perfilId).in('seguidor_id', ids).limit(limite);
  return { lista: (data || []).map((f) => f.perfil).filter(Boolean), total: count || 0 };
}

// "Seguido por @ana, @luis y 3 más": solo gente que sigue quien mira, como en Instagram
export function SeguidoPor({ comunes, onAbrir }) {
  const { t, locale } = useT();
  if (!comunes?.total) return null;
  const primeros = comunes.lista.slice(0, 2);
  const resto = comunes.total - primeros.length;
  const nombres = primeros.map((p) => p.usuario);
  if (resto > 0) nombres.push(t('seguimiento.mas', { n: resto }));
  const lista = new Intl.ListFormat(locale, { type: 'conjunction' }).format(nombres);
  return (
    <button type="button" className="seguido-por" onClick={onAbrir}>
      <span className="seguido-por-avatares">{comunes.lista.slice(0, 3).map((p) => <Avatar key={p.id} perfil={p} tamano={22} />)}</span>
      <span className="pequeno texto-2">{t('seguimiento.seguidoPor', { lista })}</span>
    </button>
  );
}

// Dos ventanas: "Seguidores" (seguidores y, al ver a otro, los que tenéis en común) y "Siguiendo"
// (personas y tanques que sigue). `inicial` es la pestaña con la que se abre.
const GRUPO = { seguidores: 'seguidores', comun: 'seguidores', siguiendo: 'siguiendo', tanques: 'siguiendo' };

export default function Seguimientos({ perfil, inicial = 'seguidores', miId, misSeguidos, onCambiarSeguir, onCerrar }) {
  const { t } = useT();
  const [pestana, setPestana] = useState(inicial);
  // Cada pestaña se carga una vez y se recuerda: volver a una ya vista es instantáneo
  const [datos, setDatos] = useState({});
  // Lo último que se mostró: se queda (atenuado) mientras llega la pestaña nueva, sin saltos ni esqueletos
  const [mostrada, setMostrada] = useState(inicial);
  const [q, setQ] = useState('');
  const conComun = miId && miId !== perfil.id;

  async function cargar(cual, desde = 0) {
    if (cual === 'comun') {
      const { lista } = await cargarComunes(perfil.id, misSeguidos);
      setDatos((d) => ({ ...d, comun: { filas: lista.map((p) => ({ perfil: p })), hayMas: false } }));
      return;
    }
    const { data } = await CONSULTAS[cual](perfil.id).order('creado_en', { ascending: false }).range(desde, desde + PASO - 1);
    const nuevas = (data || []).filter((f) => f.perfil || f.tanque);
    setDatos((d) => ({ ...d, [cual]: { filas: desde ? [...(d[cual]?.filas || []), ...nuevas] : nuevas, hayMas: (data || []).length === PASO } }));
  }

  useEffect(() => {
    setQ('');
    if (!datos[pestana]) cargar(pestana);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestana, perfil.id]);

  // En cuanto la pestaña elegida tiene datos, pasa a ser la que se ve
  const lista = datos[pestana] ? pestana : (datos[mostrada] ? mostrada : null);
  if (datos[pestana] && mostrada !== pestana) setMostrada(pestana);
  const cambiando = lista !== pestana;
  const filas = lista ? datos[lista].filas : null;
  const hayMas = lista ? datos[lista].hayMas : false;

  const visibles = useMemo(() => {
    const b = normalizar(q.trim());
    if (!filas || !b) return filas;
    return filas.filter((f) => normalizar(f.perfil ? `${f.perfil.nombre || ''} ${f.perfil.usuario}` : `${f.tanque.nombre} ${f.tanque.autor?.usuario || ''}`).includes(b));
  }, [filas, q]);

  const vacio = { seguidores: 'vacioSeguidores', siguiendo: 'vacioSiguiendo', tanques: 'vacioTanques', comun: 'vacioComun' }[lista || pestana];
  const grupo = GRUPO[inicial] || 'seguidores';
  const opciones = grupo === 'seguidores'
    ? [['seguidores', t('seguimiento.seguidores')], ...(conComun ? [['comun', t('seguimiento.comun')]] : [])]
    : [['siguiendo', t('seguimiento.personas')], ['tanques', t('seguimiento.tanques')]];
  const titulo = t(grupo === 'seguidores' ? 'seguimiento.seguidores' : 'seguimiento.siguiendo');

  return (
    <Modal titulo={titulo} icono={<Avatar perfil={perfil} tamano={32} />} onCerrar={onCerrar} ancho={480}>
      <div className="seguimientos">
        {opciones.length > 1 && <Pestanas etiqueta={titulo} valor={pestana} onCambio={setPestana} opciones={opciones} />}
        <label className="seguimientos-buscar">
          <Search size={16} aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('seguimiento.buscar')} aria-label={t('seguimiento.buscar')} />
        </label>
        <AlturaFluida>
        <div className={`seguimientos-lista${cambiando ? ' cambiando' : ''}`} key={lista || 'cargando'}>
          {visibles === null ? <Cargando alto={56} n={4} /> : visibles.length === 0 ? (
            <p className="pequeno texto-3 entra-fila" style={{ padding: '24px 4px', textAlign: 'center' }}>{q ? t('seguimiento.sinResultados') : t(`seguimiento.${vacio}`)}</p>
          ) : visibles.map((f, i) => (f.perfil ? (
            <div key={`p${f.perfil.id}`} className="seguimientos-fila entra-fila" style={{ '--i': i }}>
              <Link href={`/u/?n=${f.perfil.usuario}`} className="seguimientos-quien" onClick={onCerrar}>
                <Avatar perfil={f.perfil} tamano={40} />
                <span><strong>{f.perfil.nombre || f.perfil.usuario}</strong><span className="mini texto-3">@{f.perfil.usuario}</span></span>
              </Link>
              {miId && (f.perfil.id === miId
                ? <span className="mini texto-3">{t('seguimiento.tu')}</span>
                : (
                  <button type="button" className={`btn btn-s${misSeguidos.has(f.perfil.id) ? '' : ' btn-primario'}`} onClick={() => onCambiarSeguir(f.perfil.id)}>
                    {misSeguidos.has(f.perfil.id) ? t('comun.siguiendo') : t('comun.seguir')}
                  </button>
                ))}
            </div>
          ) : (
            <div key={`t${f.tanque.id}`} className="seguimientos-fila entra-fila" style={{ '--i': i }}>
              <Link href={`/tanque/?id=${f.tanque.id}`} className="seguimientos-quien" onClick={onCerrar}>
                <span className="seguimientos-tanque">{f.tanque.foto_url && <img src={f.tanque.foto_url} alt="" loading="lazy" />}</span>
                <span>
                  <strong>{f.tanque.nombre}</strong>
                  {f.tanque.autor && (
                    <span className="mini texto-3 seguimientos-autor"><Avatar perfil={f.tanque.autor} tamano={16} />{t('seguimiento.de', { usuario: f.tanque.autor.usuario })}</span>
                  )}
                </span>
              </Link>
            </div>
          )))}
          {hayMas && !q && <button type="button" className="btn btn-s" style={{ alignSelf: 'center', marginTop: 8 }} onClick={() => cargar(lista, filas.length)}>{t('seguimiento.cargarMas')}</button>}
        </div>
        </AlturaFluida>
      </div>
    </Modal>
  );
}
