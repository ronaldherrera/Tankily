"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, ChevronUp, ChevronDown, ArrowLeft, Maximize2, Minimize2, ExternalLink, Send, Tag } from 'lucide-react';
import Link from '@/components/Enlace';
import { Avatar, useTostada } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useMensajeria, useEstadoChat, perfilDe } from '@/lib/mensajeria';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { useT } from '@/i18n/IdiomaProvider';
import { sinIdioma } from '@/i18n/config';
import { mensajeError } from '@/lib/errores';
import TextoTraducible from '@/components/feed/TextoTraducible';
import { useConectados } from '@/lib/enLinea';
import { LineaConexion, AvisoTraduccion, MensajePropio } from '@/components/ChatEstado';

const CLAVE = 'tk-chat';
const ESCRITORIO = '(min-width: 961px)';

const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch {} };

// Chat flotante de escritorio, al estilo de Facebook: una barra abajo a la derecha que se
// expande hacia arriba con la lista de conversaciones y el chat. En móvil no se muestra
// (CSS): allí se usa la página /mensajes/ a pantalla completa.
export default function ChatFlotante() {
  const { usuario } = useSesion();
  const { t, lang } = useT();
  const tostada = useTostada();
  const pathname = usePathname() || '/';
  const enMensajes = sinIdioma(pathname).startsWith('/mensajes');
  const [escritorio, setEscritorio] = useState(false);
  const { mensajes, conversaciones, hiloCon, enviar, marcarLeidos, totalSinLeer } = useMensajeria(usuario, escritorio && !enMensajes);
  const [abierto, setAbierto] = useState(false);
  const [grande, setGrande] = useState(false); // ampliado: más ancho y más alto
  const [con, setCon] = useState(null);
  const [anuncio, setAnuncio] = useState(null);
  const [otro, setOtro] = useState(null);
  const [texto, setTexto] = useState('');
  const fin = useRef(null);
  const entrada = useRef(null);
  const hilo = hiloCon(con);
  const conectados = useConectados();
  const estado = useEstadoChat(abierto ? con : null);

  // Solo en escritorio; recuerda si estaba abierto y en qué conversación
  useEffect(() => {
    const mq = window.matchMedia(ESCRITORIO);
    const actualizar = () => setEscritorio(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    const previo = leer();
    setAbierto(!!previo.abierto);
    setGrande(!!previo.grande);
    setCon(previo.con || null);
    return () => mq.removeEventListener('change', actualizar);
  }, []);
  useEffect(() => { guardar({ abierto, con, grande }); }, [abierto, con, grande]);

  // En escritorio, los botones "Contactar", "Escribir" o "Mensaje" abren el chat en vez de cambiar de página
  useEffect(() => {
    if (!escritorio || enMensajes || !usuario) return undefined;
    const alPulsar = (e) => {
      const a = e.target.closest?.('a[href*="/mensajes/?con="]');
      // Los enlaces del propio chat ("Abrir en Mensajes") sí van a la página
      if (!a || a.closest('.chat-flotante') || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, window.location.origin);
      const destino = url.searchParams.get('con');
      if (!destino || destino === usuario.id) return;
      e.preventDefault();
      setCon(destino);
      setAnuncio(url.searchParams.get('anuncio'));
      setAbierto(true);
    };
    document.addEventListener('click', alPulsar, true);
    return () => document.removeEventListener('click', alPulsar, true);
  }, [escritorio, enMensajes, usuario]);

  // Persona de la conversación abierta
  useEffect(() => {
    if (!con) { setOtro(null); return; }
    const conocido = conversaciones.find((c) => c.persona.id === con)?.persona;
    if (conocido) setOtro(conocido);
    else perfilDe(con).then(setOtro);
  }, [con, conversaciones]);

  // Al abrir una conversación: marcar como leída, bajar al final y preparar el mensaje del anuncio
  useEffect(() => {
    if (!abierto || !con) return;
    marcarLeidos(con);
    fin.current?.scrollIntoView({ block: 'end' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, con, hilo.length]);
  useEffect(() => {
    if (!anuncio || !con) return;
    supabase.from('anuncios').select('titulo').eq('id', anuncio).maybeSingle()
      .then(({ data }) => { if (data) setTexto(t('mensajes.interesAnuncio', { titulo: data.titulo })); entrada.current?.focus(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anuncio, con]);

  if (!usuario || !escritorio || enMensajes) return null;

  async function alEnviar(e) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !con) return;
    setTexto('');
    try {
      await enviar({ con, contenido, anuncioId: anuncio && !hilo.length ? anuncio : null, lang });
      setAnuncio(null);
    } catch (error) {
      setTexto(contenido);
      tostada(mensajeError(error, t));
    }
  }

  const volver = () => { setCon(null); setAnuncio(null); setTexto(''); };
  const enHilo = abierto && con;
  // En la cabecera: las tres conversaciones más recientes con alguien que está en línea ahora
  const recientes = conversaciones.filter((c) => conectados.has(c.persona.id)).slice(0, 3);

  return (
    <section className={`chat-flotante cristal cristal-fijo${abierto ? ' abierto' : ''}${grande ? ' grande' : ''}`} aria-label={t('mensajes.titulo')}>
      <header className="chat-cabecera">
        {enHilo ? (
          <>
            <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={volver} aria-label={t('mensajes.volver')}><ArrowLeft size={17} /></button>
            {otro && (
              <Link href={`/u/?n=${otro.usuario}`} className="chat-persona">
                <Avatar perfil={otro} tamano={28} />
                <span style={{ minWidth: 0 }}><strong>{otro.nombre || otro.usuario}</strong><LineaConexion estado={estado} /></span>
              </Link>
            )}
            <span style={{ flex: 1 }} />
            <Link href={`/mensajes/?con=${con}`} className="btn btn-fantasma btn-icono btn-s" aria-label={t('chat.paginaCompleta')} title={t('chat.paginaCompleta')}><ExternalLink size={15} /></Link>
          </>
        ) : (
          <button type="button" className="chat-alternar" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
            <MessageCircle size={19} aria-hidden="true" />
            <strong>{t('mensajes.titulo')}</strong>
            {totalSinLeer > 0 && <b className="insignia-mensajes" aria-label={t('chat.nuevos', { n: totalSinLeer })}>{totalSinLeer}</b>}
            <span className="chat-avatares" aria-hidden="true">{recientes.map((c) => <Avatar key={c.persona.id} perfil={c.persona} tamano={24} />)}</span>
          </button>
        )}
        {abierto && (
          <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={() => setGrande(!grande)} aria-label={grande ? t('chat.reducir') : t('chat.ampliar')} title={grande ? t('chat.reducir') : t('chat.ampliar')} aria-pressed={grande}>
            {grande ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
        <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={() => setAbierto(!abierto)} aria-label={abierto ? t('chat.minimizar') : t('chat.abrir')} aria-expanded={abierto}>
          {abierto ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </header>

      <div className="chat-cuerpo" aria-hidden={!abierto}>
        <div className="chat-interior">
          {!con ? (
            <div className="chat-lista">
              {mensajes !== null && conversaciones.length === 0 && (
                <div className="chat-vacio"><strong>{t('mensajes.vacioTitulo')}</strong><p className="pequeno texto-2">{t('mensajes.vacioTexto')}</p></div>
              )}
              {conversaciones.map((c) => (
                <button type="button" key={c.persona.id} className="conversacion" onClick={() => setCon(c.persona.id)} tabIndex={abierto ? 0 : -1}>
                  <Avatar perfil={c.persona} tamano={38} />
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <strong style={{ display: 'block' }}>{c.persona.nombre || c.persona.usuario}</strong>
                    <span className="mini texto-3" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><TextoTraducible compacto tabla="mensajes" id={c.ultimo.id} texto={c.ultimo.contenido} idioma={c.ultimo.emisor_id === usuario.id ? null : c.ultimo.idioma} render={(x) => x} /></span>
                  </span>
                  {c.sinLeer > 0 ? <b className="insignia-mensajes">{c.sinLeer}</b> : <span className="mini texto-3">{formatRelativeTime(c.ultimo.creado_en)}</span>}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="chat-hilo">
                {hilo.map((m) => (
                  <div key={m.id} className={`burbuja${m.emisor_id === usuario.id ? ' mia' : ''}${m.enviando ? ' enviando' : ''}`}>
                    {m.anuncio && <Link href={`/mercado/anuncio/?id=${m.anuncio.id}`} className="mini" style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: 0.8 }}><Tag size={12} /> {m.anuncio.titulo}</Link>}
                    {m.emisor_id === usuario.id ? <MensajePropio m={m} destino={estado?.idioma} /> : (
                      <>
                        <p className="prosa"><TextoTraducible tabla="mensajes" id={m.id} texto={m.contenido} idioma={m.idioma} render={(x) => x} /></p>
                        <span className="burbuja-pie mini">{formatRelativeTime(m.creado_en)}</span>
                      </>
                    )}
                  </div>
                ))}
                <div ref={fin} />
              </div>
              <AvisoTraduccion estado={estado} />
              <form onSubmit={alEnviar} className="chat-escribir">
                <input ref={entrada} className="entrada" value={texto} maxLength={2000} onChange={(e) => setTexto(e.target.value)} placeholder={t('mensajes.escribe')} aria-label={t('mensajes.etiqueta')} tabIndex={abierto ? 0 : -1} />
                <button className="btn btn-primario btn-icono btn-s" disabled={!texto.trim()} aria-label={t('mensajes.enviar')} tabIndex={abierto ? 0 : -1}><Send size={15} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
