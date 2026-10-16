"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import Link, { useNavegar } from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Avatar, RequiereSesion, Vacio, Cargando, useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';
import { useMensajeria, perfilDe } from '@/lib/mensajeria';
import { mensajeError } from '@/lib/errores';

function Bandeja() {
  const { usuario, cargando } = useSesion();
  const router = useNavegar();
  const { t } = useT();
  const tostada = useTostada();
  const params = useSearchParams();
  const con = params.get('con');
  const anuncioId = params.get('anuncio');
  const { mensajes, conversaciones, hiloCon, enviar: enviarMensaje, marcarLeidos } = useMensajeria(usuario);
  const [otro, setOtro] = useState(null);
  const [texto, setTexto] = useState('');
  const fin = useRef(null);
  const hilo = hiloCon(con);

  useEffect(() => {
    if (!con) { setOtro(null); return; }
    const conocido = conversaciones.find((c) => c.persona.id === con)?.persona;
    if (conocido) setOtro(conocido);
    else perfilDe(con).then(setOtro);
  }, [con, conversaciones]);

  useEffect(() => {
    marcarLeidos(con);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [con, hilo.length]);

  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }); }, [hilo.length, con]);

  useEffect(() => {
    if (anuncioId && con && !texto) {
      supabase.from('anuncios').select('titulo').eq('id', anuncioId).maybeSingle()
        .then(({ data }) => data && setTexto(t('mensajes.interesAnuncio', { titulo: data.titulo })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anuncioId, con]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion /></div>;

  async function enviar(e) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !con) return;
    setTexto('');
    try {
      await enviarMensaje({ con, contenido, anuncioId: anuncioId && !hilo.length ? anuncioId : null });
    } catch (error) {
      setTexto(contenido);
      tostada(mensajeError(error, t));
    }
  }

  return (
    <div className="contenido ancho">
      <div className={`mensajeria${con ? ' con-hilo' : ''}`}>
        <aside className="mensajeria-lista cristal-suave">
          <h1 className="titulo-m" style={{ padding: '14px 14px 8px' }}>{t('mensajes.titulo')}</h1>
          {mensajes === null ? <div style={{ padding: 12 }}><Cargando alto={56} n={4} /></div> : conversaciones.length === 0 ? (
            <Vacio titulo={t('mensajes.vacioTitulo')}>{t('mensajes.vacioTexto')}</Vacio>
          ) : (
            conversaciones.map((c) => (
              <Link key={c.persona.id} href={`/mensajes/?con=${c.persona.id}`} className="conversacion" aria-current={con === c.persona.id ? 'true' : undefined}>
                <Avatar perfil={c.persona} tamano={40} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>{c.persona.nombre || c.persona.usuario}</strong>
                  <span className="mini texto-3" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ultimo.contenido}</span>
                </span>
                {c.sinLeer > 0 ? <b className="insignia-mensajes">{c.sinLeer}</b> : <span className="mini texto-3">{formatRelativeTime(c.ultimo.creado_en)}</span>}
              </Link>
            ))
          )}
        </aside>

        <section className="mensajeria-hilo cristal-suave">
          {!con ? (
            <Vacio titulo={t('mensajes.elige')} />
          ) : (
            <>
              <header className="hilo-cabecera">
                <button className="btn btn-fantasma btn-icono btn-s solo-movil" onClick={() => router.push('/mensajes/')} aria-label={t('mensajes.volver')}><ArrowLeft size={18} /></button>
                {otro && <><Avatar perfil={otro} tamano={34} /><Link href={`/u/?n=${otro.usuario}`}><strong>{otro.nombre || otro.usuario}</strong> <span className="texto-3 pequeno">@{otro.usuario}</span></Link></>}
              </header>
              <div className="hilo-mensajes">
                {hilo.map((m) => (
                  <div key={m.id} className={`burbuja${m.emisor_id === usuario.id ? ' mia' : ''}`}>
                    {m.anuncio && <Link href={`/mercado/anuncio/?id=${m.anuncio.id}`} className="mini" style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: 0.8 }}><Tag size={12} /> {m.anuncio.titulo}</Link>}
                    <p className="prosa">{m.contenido}</p>
                    <span className="mini" style={{ opacity: 0.6 }}>{formatRelativeTime(m.creado_en)}</span>
                  </div>
                ))}
                <div ref={fin} />
              </div>
              <form onSubmit={enviar} className="hilo-escribir">
                <input className="entrada" value={texto} maxLength={2000} onChange={(e) => setTexto(e.target.value)} placeholder={t('mensajes.escribe')} aria-label={t('mensajes.etiqueta')} />
                <button className="btn btn-primario btn-icono" disabled={!texto.trim()} aria-label={t('mensajes.enviar')}><Send size={16} /></button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MensajesPage() {
  return <Suspense><Bandeja /></Suspense>;
}
