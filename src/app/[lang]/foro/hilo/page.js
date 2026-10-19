"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ChevronUp, Flag, Trash2, Lock, Share } from 'lucide-react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Avatar, NombreAutor, Galeria, SubidorImagenes, Vacio, Cargando, RequiereSesion, useTostada } from '@/components/ui';
import TextoTraducible from '@/components/feed/TextoTraducible';
import HilosRelacionados from '@/components/foro/HilosRelacionados';
import { detectarIdioma } from '@/lib/traduccion';
import TanqueCard from '@/components/tanques/TanqueCard';
import Reportar from '@/components/Reportar';
import Lateral from '@/components/Lateral';
import { useT } from '@/i18n/IdiomaProvider';
import { mensajeError } from '@/lib/errores';
import { evento } from '@/lib/analitica';

function Hilo() {
  const id = useSearchParams().get('id');
  const { usuario, cargando } = useSesion();
  const tostada = useTostada();
  const { t, lang } = useT();
  const [hilo, setHilo] = useState(undefined);
  const [respuestas, setRespuestas] = useState([]);
  const [votadas, setVotadas] = useState(new Set());

  // Compartir el hilo: menú nativo en móvil; en escritorio, copia el enlace
  async function compartir() {
    if (navigator.share) { try { await navigator.share({ url: location.href, title: hilo?.titulo }); } catch {} }
    else { await navigator.clipboard.writeText(location.href); tostada(t('comun.enlaceCopiado')); }
  }
  const [texto, setTexto] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [reporte, setReporte] = useState(null);

  useEffect(() => {
    if (!id || cargando) return;
    (async () => {
      const { data } = await supabase.from('foro_hilos')
        .select(`*, ${AUTOR}, tanque:tanques(id, nombre, tipo, litros, foto_url, visibilidad)`)
        .eq('id', id).maybeSingle();
      setHilo(data);
      if (!data) return;
      document.title = `${data.titulo} · ${t('foro.titulo')} · Tankily`;
      const { data: r } = await supabase.from('foro_respuestas').select(`*, ${AUTOR}`).eq('hilo_id', id).order('creado_en');
      setRespuestas(r || []);
      if (usuario && r?.length) {
        const { data: v } = await supabase.from('foro_votos').select('respuesta_id').eq('usuario_id', usuario.id).in('respuesta_id', r.map((x) => x.id));
        setVotadas(new Set((v || []).map((x) => x.respuesta_id)));
      }
    })();
  }, [id, usuario, cargando]);

  if (hilo === undefined) return <div className="contenido"><div className="columna"><Cargando alto={240} n={1} /><Cargando alto={120} n={2} /></div></div>;
  if (!hilo) return <div className="contenido"><div className="columna"><Vacio titulo={t('foro.hilo.noExiste')} accion={<Link href="/foro/" className="btn">{t('foro.hilo.irAlForo')}</Link>} /></div></div>;

  const esAutor = usuario?.id === hilo.usuario_id;
  const solucion = respuestas.find((r) => r.id === hilo.solucion_id);
  const ordenadas = solucion ? [solucion, ...respuestas.filter((r) => r.id !== solucion.id)] : respuestas;

  async function responder(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    const { data, error } = await supabase.from('foro_respuestas').insert({ hilo_id: hilo.id, contenido: texto.trim(), imagenes, idioma: await detectarIdioma(texto, lang) }).select(`*, ${AUTOR}`).single();
    setEnviando(false);
    if (error) return tostada(t('foro.hilo.errorResponder', { error: mensajeError(error, t) }));
    evento('respuesta_foro');
    setRespuestas([...respuestas, data]);
    setTexto('');
    setImagenes([]);
  }

  async function votar(r) {
    if (!usuario) return tostada(t('foro.hilo.entraVotar'));
    if (r.usuario_id === usuario.id) return;
    const ya = votadas.has(r.id);
    const nuevas = new Set(votadas);
    ya ? nuevas.delete(r.id) : nuevas.add(r.id);
    setVotadas(nuevas);
    setRespuestas(respuestas.map((x) => (x.id === r.id ? { ...x, num_votos: x.num_votos + (ya ? -1 : 1) } : x)));
    if (ya) await supabase.from('foro_votos').delete().eq('respuesta_id', r.id).eq('usuario_id', usuario.id);
    else await supabase.from('foro_votos').insert({ respuesta_id: r.id });
  }

  async function marcarSolucion(r) {
    const nuevo = hilo.solucion_id === r.id ? null : r.id;
    const { error } = await supabase.from('foro_hilos').update({ solucion_id: nuevo }).eq('id', hilo.id);
    if (!error) { setHilo({ ...hilo, solucion_id: nuevo }); tostada(nuevo ? t('foro.hilo.marcada') : t('foro.hilo.desmarcada')); }
  }

  async function borrarRespuesta(r) {
    const { error } = await supabase.from('foro_respuestas').delete().eq('id', r.id);
    if (!error) setRespuestas(respuestas.filter((x) => x.id !== r.id));
  }

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 14 }}>
        <Link href={`/foro/${hilo.categoria}/`} className="enlace pequeno" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', paddingTop: 12 }}><ArrowLeft size={14} /> {t(`foro.categorias.${hilo.categoria}.nombre`)}</Link>

        <article className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h1 className="titulo-l">{hilo.cerrado && <Lock size={22} aria-label={t('foro.hilo.cerrado')} />} <TextoTraducible tabla="foro_hilos" id={hilo.id} campo="titulo" texto={hilo.titulo} idioma={hilo.idioma} render={(x) => x} /></h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar perfil={hilo.autor} tamano={36} />
            <div><NombreAutor perfil={hilo.autor} /><p className="mini texto-3">{formatRelativeTime(hilo.creado_en)}</p></div>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, position: 'relative', zIndex: 2 }}>
              <button className="btn btn-fantasma btn-icono btn-s" onClick={compartir} aria-label={t('comun.compartir')}><Share size={16} /></button>
              <button className="btn btn-fantasma btn-icono btn-s" onClick={() => setReporte({ tipo: 'hilo', id: hilo.id })} aria-label={t('foro.hilo.reportar')}><Flag size={16} /></button>
            </span>
          </div>
          <TextoTraducible tabla="foro_hilos" id={hilo.id} texto={hilo.contenido} idioma={hilo.idioma} />
          <Galeria imagenes={hilo.imagenes} />
          {hilo.tanque && (
            <div style={{ maxWidth: 320, position: 'relative', zIndex: 2 }}>
              <p className="mini texto-3" style={{ marginBottom: 6 }}>{t('foro.hilo.tanqueAdjunto')}</p>
              <TanqueCard tanque={hilo.tanque} conAutor={false} />
            </div>
          )}
        </article>

        <h2 className="titulo-s">{t('foro.hilo.respuestas', { n: respuestas.length })}</h2>

        {ordenadas.map((r) => {
          const esSolucion = r.id === hilo.solucion_id;
          return (
            <article key={r.id} className={`respuesta cristal-suave${esSolucion ? ' solucion' : ''}`}>
              <div className="voto">
                <button className={votadas.has(r.id) ? 'votado' : ''} onClick={() => votar(r)} aria-label={t('foro.hilo.votar')} aria-pressed={votadas.has(r.id)} disabled={r.usuario_id === usuario?.id}><ChevronUp size={20} /></button>
                <span className="cifra">{r.num_votos}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {esSolucion && <span className="mini" style={{ color: 'var(--ok)', display: 'flex', gap: 4, alignItems: 'center' }}><CheckCircle2 size={14} /> {t('foro.hilo.solucionElegida')}</span>}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Avatar perfil={r.autor} tamano={28} />
                  <NombreAutor perfil={r.autor} conUsuario={false} />
                  <span className="mini texto-3">{formatRelativeTime(r.creado_en)}</span>
                </div>
                <TextoTraducible tabla="foro_respuestas" id={r.id} texto={r.contenido} idioma={r.idioma} />
                <Galeria imagenes={r.imagenes} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {esAutor && r.usuario_id !== usuario?.id && (
                    <button className="btn btn-s btn-fantasma" onClick={() => marcarSolucion(r)}><CheckCircle2 size={14} /> {esSolucion ? t('foro.hilo.quitarSolucion') : t('foro.hilo.marcarSolucion')}</button>
                  )}
                  {r.usuario_id === usuario?.id ? (
                    <button className="btn btn-s btn-fantasma" onClick={() => borrarRespuesta(r)}><Trash2 size={14} /> {t('comun.eliminar')}</button>
                  ) : (
                    <button className="btn btn-s btn-fantasma" onClick={() => setReporte({ tipo: 'respuesta', id: r.id })}><Flag size={14} /> {t('comun.reportar')}</button>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {hilo.cerrado ? (
          <p className="aviso">{t('foro.hilo.cerradoAviso')}</p>
        ) : usuario ? (
          <form onSubmit={responder} className="cristal" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="campo"><span>{t('foro.hilo.tuRespuesta')}</span><textarea className="entrada" rows={5} maxLength={10000} value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
            <SubidorImagenes valor={imagenes} onCambio={setImagenes} carpeta="foro" />
            <button className="btn btn-primario" style={{ alignSelf: 'flex-end', position: 'relative', zIndex: 2 }} disabled={enviando || !texto.trim()}>{enviando ? t('comun.publicando') : t('foro.hilo.responder')}</button>
          </form>
        ) : (
          <RequiereSesion texto={t('foro.hilo.entraResponder')} />
        )}

        <HilosRelacionados hilo={hilo} />

        {reporte && <Reportar tipo={reporte.tipo} objetoId={reporte.id} onCerrar={() => setReporte(null)} />}
      </div>
      <Lateral ubicacionPubli="foro" />
    </div>
  );
}

export default function HiloPage() {
  return <Suspense><Hilo /></Suspense>;
}
