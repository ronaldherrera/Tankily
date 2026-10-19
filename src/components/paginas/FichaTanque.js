"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { Pencil, Lock, Users, Share } from 'lucide-react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { colorAgua, imagenTanque, slugTipo } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { diasDesde, formatFecha } from '@/lib/formatRelativeTime';
import { Avatar, NombreAutor, Pestanas, Vacio, Cargando, useTostada } from '@/components/ui';
import Mediciones, { UltimosParametros, FormularioMedicion } from '@/components/tanques/Mediciones';
import Habitantes from '@/components/tanques/Habitantes';
import Diario from '@/components/tanques/Diario';
import Mantenimiento from '@/components/tanques/Mantenimiento';
import Feed from '@/components/feed/Feed';
import PostComposer from '@/components/feed/PostComposer';
import Lateral from '@/components/Lateral';
import InvitacionRegistro from '@/components/InvitacionRegistro';

// Ficha de un tanque. La usan /tanque/?id= (cualquier tanque, al momento) y /tanque/<slug>/ (página indexable,
// que la recibe ya rellena en `inicial` para que el HTML lleve el contenido; luego se actualiza al momento).
export default function FichaTanque({ id, inicial }) {
  const { usuario, cargando: cargandoSesion } = useSesion();
  const tostada = useTostada();
  const { t } = useT();
  const u = useUnidades();
  const [tanque, setTanque] = useState(inicial?.tanque ?? undefined);
  const [habitantes, setHabitantes] = useState(inicial?.habitantes ?? []);
  const [mediciones, setMediciones] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [siguiendo, setSiguiendo] = useState(false);
  const [numSeguidores, setNumSeguidores] = useState(0);
  const [pestana, setPestana] = useState('resumen');
  const [medir, setMedir] = useState(false);

  useEffect(() => {
    if (!id || cargandoSesion) return;
    (async () => {
      const { data } = await supabase.from('tanques').select(`*, ${AUTOR}`).eq('id', id).maybeSingle();
      setTanque(data);
      if (!data) return;
      const [h, m, e, s] = await Promise.all([
        supabase.from('habitantes').select('*').eq('tanque_id', id).order('anadido_en'),
        supabase.from('mediciones').select('*').eq('tanque_id', id).order('medido_en', { ascending: false }).limit(500),
        supabase.from('tanque_eventos').select('*').eq('tanque_id', id).order('fecha', { ascending: false }).limit(100),
        supabase.from('tanque_seguidores').select('usuario_id', { count: 'exact' }).eq('tanque_id', id),
      ]);
      setHabitantes(h.data || []);
      setMediciones(m.data || []);
      setEventos(e.data || []);
      setNumSeguidores(s.count || 0);
      setSiguiendo(!!usuario && (s.data || []).some((x) => x.usuario_id === usuario.id));
    })();
  }, [id, usuario, cargandoSesion]);

  useEffect(() => {
    if (tanque) document.title = `${tanque.nombre} · Tankily`;
  }, [tanque]);

  if (tanque === undefined) return <div className="contenido"><div className="columna"><Cargando alto={380} n={1} /><Cargando alto={140} n={2} /></div></div>;
  if (!tanque) {
    return (
      <div className="contenido"><div className="columna">
        <Vacio titulo={t('tanque.cargandoNoExiste')} accion={<Link className="btn" href="/tanques/">{t('tanque.verOtros')}</Link>}>
          {t('tanque.noExisteTexto')}
        </Vacio>
      </div></div>
    );
  }

  const esDueno = usuario?.id === tanque.usuario_id;
  const ultimoCambio = eventos.find((e) => e.tipo === 'cambio_agua');
  const totalHabitantes = habitantes.reduce((s, h) => s + h.cantidad, 0);

  async function alternarSeguir() {
    if (!usuario) return tostada(t('tanque.entraSeguir'));
    const nuevo = !siguiendo;
    setSiguiendo(nuevo);
    setNumSeguidores((n) => n + (nuevo ? 1 : -1));
    if (nuevo) await supabase.from('tanque_seguidores').insert({ tanque_id: tanque.id });
    else await supabase.from('tanque_seguidores').delete().eq('tanque_id', tanque.id).eq('usuario_id', usuario.id);
  }

  async function compartir() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ url, title: tanque.nombre }); } catch {} }
    else { await navigator.clipboard.writeText(url); tostada(t('comun.enlaceCopiado')); }
  }

  return (
    <div className="contenido" style={{ '--agua': colorAgua(tanque.tipo) }}>
      <div className="columna">
        <section className="tanque-hero">
          <img src={imagenTanque(tanque)} alt={t('tanque.foto', { nombre: tanque.nombre })} />
          <div className="tanque-panel cristal cristal-refracta">
            <div className="tanque-cabecera" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <span className="etiqueta-agua">
                  {tanque.tipo === 'otro' ? t('tipos.otro') : <Link href={`/tanques/${slugTipo(tanque.tipo)}/`} className="enlace-tipo">{t(`tipos.${tanque.tipo}`)}</Link>}
                  {tanque.visibilidad !== 'publico' && <> · {tanque.visibilidad === 'privado' ? <Lock size={12} /> : <Users size={12} />} {t(`visibilidad.${tanque.visibilidad}`)}</>}
                </span>
                <h1 className="titulo-l" style={{ marginTop: 4 }}>{tanque.nombre}</h1>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <Avatar perfil={tanque.autor} tamano={24} />
                  <NombreAutor perfil={tanque.autor} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-icono btn-s" onClick={compartir} aria-label={t('tanque.compartir')}><Share size={16} /></button>
                {esDueno ? (
                  <Link href={`/tanques/nuevo/?id=${tanque.id}`} className="btn btn-s"><Pencil size={14} /> {t('tanque.editar')}</Link>
                ) : (
                  <button className={`btn btn-s ${siguiendo ? '' : 'btn-primario'}`} onClick={alternarSeguir}>{siguiendo ? t('tanque.siguiendo') : t('tanque.seguir')}</button>
                )}
              </div>
            </div>
            <div className="tanque-datos">
              {tanque.litros && <div><span className="cifra" style={{ fontSize: '1.3rem' }}>{u.volumen(tanque.litros)}</span><span className="mini texto-3">{t('tanque.volumen')}</span></div>}
              <div><span className="cifra" style={{ fontSize: '1.3rem' }}>{totalHabitantes}</span><span className="mini texto-3">{t('tanque.habitantes')}</span></div>
              {tanque.montado_en && <div><span className="cifra" style={{ fontSize: '1.3rem' }}>{t('tanque.diasCorto', { n: diasDesde(tanque.montado_en) })}</span><span className="mini texto-3">{t('tanque.enMarcha')}</span></div>}
              <div><span className="cifra" style={{ fontSize: '1.3rem' }}>{numSeguidores}</span><span className="mini texto-3">{t('tanque.seguidores')}</span></div>
            </div>
          </div>
        </section>

        <InvitacionRegistro texto={t('invitacion.tanque', { nombre: tanque.autor?.nombre || `@${tanque.autor?.usuario}` })} />

        <Pestanas
          etiqueta={t('tanque.secciones')}
          valor={pestana}
          onCambio={setPestana}
          opciones={[['resumen', t('tanque.resumen')], ['parametros', t('tanque.parametros')], ['habitantes', `${t('tanque.habitantesPestana')}${totalHabitantes ? ` ${totalHabitantes}` : ''}`], ['diario', t('tanque.diario')], ['publicaciones', t('tanque.publicaciones')]]}
        />

        {pestana === 'resumen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {esDueno && <Mantenimiento tanque={tanque} eventos={eventos} setEventos={setEventos} />}
            <section className="cristal-suave" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="titulo-s">{t('tanque.agua')}</h2>
                {esDueno && <button className="btn btn-s" onClick={() => setMedir(true)}>{t('tanque.anadirMedicion')}</button>}
              </div>
              {mediciones.length ? <UltimosParametros mediciones={mediciones} tipo={tanque.tipo} /> : <p className="pequeno texto-3">{t('tanque.sinMediciones')}</p>}
              {ultimoCambio && <p className="mini texto-3">{t('tanque.ultimoCambio', { fecha: formatFecha(ultimoCambio.fecha) })}</p>}
            </section>

            {tanque.descripcion && (
              <section className="cristal-suave" style={{ padding: 16 }}>
                <h2 className="titulo-s" style={{ marginBottom: 8 }}>{t('tanque.sobre')}</h2>
                <p className="prosa texto-2">{tanque.descripcion}</p>
              </section>
            )}

            {(Object.keys(tanque.equipo || {}).length > 0 || tanque.largo_cm) && (
              <section className="cristal-suave" style={{ padding: 16 }}>
                <h2 className="titulo-s" style={{ marginBottom: 4 }}>{t('tanque.fichaTecnica')}</h2>
                <ul className="lista-filas">
                  {tanque.largo_cm && <li><span className="texto-3" style={{ width: 120 }}>{t('tanque.medidas')}</span><span>{u.deCm(tanque.largo_cm)} × {tanque.ancho_cm ? u.deCm(tanque.ancho_cm) : '?'} × {tanque.alto_cm ? u.deCm(tanque.alto_cm) : '?'} {u.unidadLongitud}</span></li>}
                  {tanque.montado_en && <li><span className="texto-3" style={{ width: 120 }}>{t('tanque.montado')}</span><span>{formatFecha(tanque.montado_en)}</span></li>}
                  {Object.entries(tanque.equipo || {}).map(([k, v]) => (
                    <li key={k}><span className="texto-3" style={{ width: 120 }}>{t(`equipo.${k}`)}</span><span>{v}</span></li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {pestana === 'parametros' && <Mediciones tanque={tanque} mediciones={mediciones} setMediciones={setMediciones} esDueno={esDueno} />}
        {pestana === 'habitantes' && <Habitantes tanque={tanque} habitantes={habitantes} setHabitantes={setHabitantes} mediciones={mediciones} esDueno={esDueno} />}
        {pestana === 'diario' && <Diario tanque={tanque} eventos={eventos} setEventos={setEventos} esDueno={esDueno} />}
        {pestana === 'publicaciones' && (
          <Feed
            tanqueId={tanque.id}
            conPublicidad={false}
            cabecera={(alPublicar) => esDueno && <PostComposer tanqueFijo={tanque.id} onPublicado={alPublicar} />}
            vacio={<Vacio titulo={t('tanque.sinPublicaciones')}>{esDueno ? t('tanque.sinPublicacionesDueno') : t('tanque.sinPublicacionesOtro')}</Vacio>}
          />
        )}

        {medir && <FormularioMedicion tanque={tanque} onCerrar={() => setMedir(false)} onGuardado={(n) => setMediciones([...n, ...mediciones])} />}
      </div>
      <Lateral />
    </div>
  );
}
