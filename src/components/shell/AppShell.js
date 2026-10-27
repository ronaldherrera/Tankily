"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Waves, Fish, MessagesSquare, Tag, Store, BookOpen, Calculator, Search, Compass, Bell, Mail, Menu, Plus, LogIn, X, Coffee,
} from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { sinIdioma } from '@/i18n/config';
import { Avatar } from '@/components/ui';
import AvisoCookies from './AvisoCookies';
import AvisoApp from './AvisoApp';
import MenuMas from './MenuMas';
import BotonAdmin from './BotonAdmin';
import ChatFlotante from './ChatFlotante';
import BotonTema from './BotonTema';
import SelectorIdioma from './SelectorIdioma';
import { cargarScriptAdsense } from '@/lib/adsense';
import { CICLO, estadoLogo } from '@/lib/logoAnimado';
import { useCargando } from '@/lib/cargando';
import { anunciarPresencia } from '@/lib/enLinea';

// Símbolo de Tankily: la t con una ola por travesaño y una burbuja por punto.
// Con `conNombre`, la t hace de inicial de "ankily" (logotipo); el recorte del
// viewBox ajusta la t a la caja de la letra para que apoye en la línea base.
// `animable`: la ola puede animarse (la de la cabecera); `animar`: se anima ahora (algo está cargando)
export function Marca({ tamano = 30, conNombre = false, animable = false, animar = false }) {
  const id = useId().replace(/:/g, '');
  const simbolo = (
    <svg
      className={conNombre ? 'marca-t' : 'marca-simbolo'}
      viewBox={conNombre ? '9.5 0 46 64' : '0 0 64 64'}
      width={conNombre ? undefined : tamano}
      height={conNombre ? undefined : tamano}
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`marca-ola-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--marca-ola)" />
          <stop offset="1" stopColor="var(--marca-ola-fin)" />
        </linearGradient>
      </defs>
      <path d="M29 10V40a12 12 0 0 0 12 12h3" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      {animable ? <OlaAnimada id={id} animar={animar} /> : (
        <>
          <path d="M14 26c5-4.2 10-4.2 15 0s10 4.2 15 0" fill="none" stroke={`url(#marca-ola-${id})`} strokeWidth="8.5" strokeLinecap="round" />
          <circle cx="51" cy="13" r="4" fill="var(--marca-ola)" />
        </>
      )}
    </svg>
  );
  if (!conNombre) return simbolo;
  return <>{simbolo}<span className="marca-nombre">ankily</span></>;
}

// Ola y burbuja animadas (lib/logoAnimado.js) mientras `animar` es true: la ola avanza y la burbuja se
// desprende, sube y estalla. Al terminar acelera hasta el instante en que coincide con el icono y se para.
const INICIAL = estadoLogo(0, { r: 4 });
// Aplica un fotograma directamente al SVG (sin pasar por React: 60 veces por segundo)
function dibujar({ ola, burbuja, anillo, gotas }, e) {
  ola.current?.setAttribute('d', e.ola);
  const b = burbuja.current;
  if (b) {
    b.setAttribute('cx', e.burbuja.x); b.setAttribute('cy', e.burbuja.y);
    b.setAttribute('rx', e.burbuja.rx); b.setAttribute('ry', e.burbuja.ry);
    b.style.opacity = e.burbuja.opacidad;
    b.style.fill = `color-mix(in srgb, var(--marca-ola) ${Math.round(e.burbuja.color * 100)}%, var(--marca-ola-fin))`;
  }
  const a = anillo.current;
  if (a) { a.setAttribute('r', e.anillo.r); a.setAttribute('stroke-width', e.anillo.grosor); a.style.opacity = e.anillo.opacidad; }
  e.gotas.forEach((g, i) => {
    const c = gotas.current[i];
    if (c) { c.setAttribute('cx', g.x); c.setAttribute('cy', g.y); c.setAttribute('r', g.r); }
  });
}

function OlaAnimada({ id, animar }) {
  const ola = useRef(null), burbuja = useRef(null), anillo = useRef(null), gotas = useRef([]), grupo = useRef(null);
  const reloj = useRef({ t: 0, activo: false, terminar: false, frame: 0 });

  useEffect(() => {
    const r = reloj.current;
    const refs = { ola, burbuja, anillo, gotas };
    if (!animar) { r.terminar = true; return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    r.terminar = false;
    if (r.activo) return;
    r.activo = true;
    grupo.current?.setAttribute('filter', `url(#marca-goo-${id})`);
    let antes = performance.now();
    const pintar = (ahora) => {
      const dt = Math.min(0.1, (ahora - antes) / 1000);
      antes = ahora;
      const siguiente = r.t + dt * (r.terminar ? 2.6 : 1.25);
      // Al terminar, se para al cruzar el final del ciclo: el instante en que es igual al icono
      if (r.terminar && Math.floor(siguiente / CICLO) > Math.floor(r.t / CICLO)) {
        r.t = 0;
        r.activo = false;
        dibujar(refs, INICIAL);
        grupo.current?.removeAttribute('filter');
        return;
      }
      r.t = siguiente;
      dibujar(refs, estadoLogo(r.t, { r: 4 }));
      r.frame = requestAnimationFrame(pintar);
    };
    r.frame = requestAnimationFrame(pintar);
  }, [animar, id]);
  useEffect(() => () => cancelAnimationFrame(reloj.current.frame), []);

  const b = INICIAL.burbuja;
  return (
    <>
      <filter id={`marca-goo-${id}`} filterUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
        <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g" />
        <feComposite in="SourceGraphic" in2="g" operator="atop" />
      </filter>
      <g ref={grupo}>
        <path ref={ola} d={INICIAL.ola} fill="none" stroke={`url(#marca-ola-${id})`} strokeWidth="8.5" strokeLinecap="round" />
        <ellipse ref={burbuja} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} style={{ fill: 'var(--marca-ola)' }} />
      </g>
      <circle ref={anillo} cx="51" cy="13" r="4" fill="none" stroke="var(--marca-ola)" strokeDasharray="2.8 2.1" strokeLinecap="round" style={{ opacity: 0 }} />
      <g fill="var(--marca-ola)">
        {INICIAL.gotas.map((g, i) => <circle key={i} ref={(el) => { gotas.current[i] = el; }} cx={g.x} cy={g.y} r="0" />)}
      </g>
    </>
  );
}

// Filtro SVG del cristal refractivo (solo Chromium).
function FiltrosAgua() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="tk-refraccion" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.011" numOctaves="2" seed="11" result="ruido" />
        <feGaussianBlur in="ruido" stdDeviation="3" result="suave" />
        <feDisplacementMap in="SourceGraphic" in2="suave" scale="46" xChannelSelector="R" yChannelSelector="G" result="desplazado" />
        <feColorMatrix in="desplazado" type="saturate" values="1.25" />
      </filter>
    </svg>
  );
}

const NAV = [
  { href: '/', clave: 'nav.muro', icono: Waves },
  { href: '/tanques/', clave: 'nav.tanques', icono: Fish },
  { href: '/explorar/', clave: 'nav.buscar', icono: Compass },
  { href: '/foro/', clave: 'nav.foro', icono: MessagesSquare },
  { href: '/mercado/', clave: 'nav.mercado', icono: Tag },
  { href: '/tiendas/', clave: 'nav.tiendas', icono: Store },
  { href: '/wiki/', clave: 'nav.wiki', icono: BookOpen },
  { href: '/herramientas/', clave: 'herr.corto', icono: Calculator },
];

function activo(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href.replace(/\/$/, ''));
}

function useNoLeidos(usuario) {
  const [noLeidos, setNoLeidos] = useState({ notificaciones: 0, mensajes: 0 });

  useEffect(() => {
    if (!usuario) { setNoLeidos({ notificaciones: 0, mensajes: 0 }); return; }
    let vivo = true;
    async function contar() {
      const [n, m] = await Promise.all([
        supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', usuario.id).eq('leida', false),
        supabase.from('mensajes').select('id', { count: 'exact', head: true }).eq('receptor_id', usuario.id).eq('leido', false),
      ]);
      if (vivo) setNoLeidos({ notificaciones: n.count || 0, mensajes: m.count || 0 });
    }
    contar();
    const canal = supabase
      .channel(`no-leidos-${usuario.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuario.id}` }, contar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes', filter: `receptor_id=eq.${usuario.id}` }, contar)
      .subscribe();
    window.addEventListener('tk:leidos', contar);
    return () => {
      vivo = false;
      supabase.removeChannel(canal);
      window.removeEventListener('tk:leidos', contar);
    };
  }, [usuario]);

  return noLeidos;
}

function Insignia({ n }) {
  const { t } = useT();
  if (!n) return null;
  return <b className="insignia" aria-label={t('comun.sinLeer', { n })}>{n > 99 ? '99+' : n}</b>;
}

export default function AppShell({ children }) {
  const pathname = sinIdioma(usePathname() || '/');
  const { usuario, perfil } = useSesion();
  const { t, lang } = useT();
  const noLeidos = useNoLeidos(usuario);
  const cargando = useCargando();
  const [masAbierto, setMasAbierto] = useState(false);
  const [rutaMenu, setRutaMenu] = useState(pathname);
  const principal = useRef(null);
  const primeraRuta = useRef(true);

  // Al cambiar de página, el contenido nuevo entra con un fundido y una leve subida (sin remontar nada).
  // Web Animations: no deja clases puestas ni pelea con las animaciones de cada página.
  useEffect(() => {
    if (primeraRuta.current) { primeraRuta.current = false; return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    principal.current?.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }, [pathname]);

  // Los avisos por email se escriben en el idioma que la persona usa en la web
  useEffect(() => {
    if (!usuario) return;
    const marca = `${usuario.id}:${lang}`;
    try { if (localStorage.getItem('tk-idioma-avisos') === marca) return; } catch { /* sigue */ }
    supabase.from('avisos_email').upsert({ usuario_id: usuario.id, idioma: lang }, { onConflict: 'usuario_id' })
      .then(({ error }) => { if (!error) try { localStorage.setItem('tk-idioma-avisos', marca); } catch { /* nada */ } });
  }, [usuario, lang]);

  // Aro de "en línea" en los avatares de toda la web (lib/enLinea.js)
  useEffect(() => (usuario ? anunciarPresencia(usuario.id) : undefined), [usuario]);

  // "En línea" / "últ. vez" del chat: se apunta la conexión al entrar y cada minuto mientras la web está a la vista
  useEffect(() => {
    if (!usuario) return undefined;
    const marcar = () => { if (document.visibilityState === 'visible') supabase.rpc('marcar_conexion').then(() => {}); };
    marcar();
    const intervalo = setInterval(marcar, 60000);
    document.addEventListener('visibilitychange', marcar);
    return () => { clearInterval(intervalo); document.removeEventListener('visibilitychange', marcar); };
  }, [usuario]);

  // Un apunte al día por persona con sesión (solo la fecha): activos y retención del panel de administración
  useEffect(() => {
    if (!usuario) return;
    const hoy = `${usuario.id}:${new Date().toISOString().slice(0, 10)}`;
    try { if (localStorage.getItem('tk-visita') === hoy) return; } catch { /* sigue */ }
    supabase.rpc('apuntar_visita').then(({ error }) => { if (!error) try { localStorage.setItem('tk-visita', hoy); } catch { /* nada */ } });
  }, [usuario]);

  // El menú "Más" de la barra inferior se cierra al cambiar de página o con Escape
  if (rutaMenu !== pathname) {
    setRutaMenu(pathname);
    setMasAbierto(false);
  }
  useEffect(() => {
    if (!masAbierto) return;
    const escape = (e) => e.key === 'Escape' && setMasAbierto(false);
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [masAbierto]);

  useEffect(() => {
    // La refracción con filtros SVG en backdrop-filter solo funciona bien en Chromium
    const chromium = navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand));
    document.documentElement.classList.toggle('refraccion', !!chromium);
    cargarScriptAdsense();
    // Página "sin conexión" de la app instalada (public/sw.js); en desarrollo no, para no interferir
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const enlacePerfil = perfil ? `/u/?n=${perfil.usuario}` : '/acceder/';

  return (
    <>
      <FiltrosAgua />
      <div className="causticas" aria-hidden="true" />
      <a href="#principal" className="sr-only">{t('nav.saltar')}</a>

      <div className="shell">
        <aside className="rail">
          <nav className="rail-interior cristal cristal-fijo" aria-label={t('nav.principal')}>
            <Link href="/" prefetch className="marca" aria-label="Tankily"><Marca conNombre animable animar={cargando} /></Link>
            {NAV.map(({ href, clave, icono: Icono }) => (
              <Link key={href} href={href} prefetch className="nav-item" aria-current={activo(pathname, href) ? 'page' : undefined}>
                <Icono size={20} /><span>{t(clave)}</span>
              </Link>
            ))}
            <div style={{ height: 12 }} />
            <Link href="/apoyar/" className="nav-item" aria-current={activo(pathname, '/apoyar/') ? 'page' : undefined}>
              <Coffee size={20} /><span>{t('apoyar.nav')}</span>
            </Link>
            {usuario && (
              <>
                <Link href="/notificaciones/" prefetch className="nav-item" aria-current={activo(pathname, '/notificaciones/') ? 'page' : undefined}>
                  <Bell size={20} /><span>{t('nav.notificaciones')}</span><Insignia n={noLeidos.notificaciones} />
                </Link>
                <Link href="/mensajes/" prefetch className="nav-item" aria-current={activo(pathname, '/mensajes/') ? 'page' : undefined}>
                  <Mail size={20} /><span>{t('nav.mensajes')}</span><Insignia n={noLeidos.mensajes} />
                </Link>
              </>
            )}

            <div className="rail-pie">
              <SelectorIdioma conTexto />
              <BotonTema conTexto />
              {usuario ? (
                <>
                  <Link href="/tanques/nuevo/" className="btn btn-primario btn-bloque" aria-label={t('nav.nuevoTanque')}>
                    <Plus size={18} /><span className="ocultable">{t('nav.nuevoTanque')}</span>
                  </Link>
                  <Link href={enlacePerfil} className="nav-item" aria-current={pathname.startsWith('/u') ? 'page' : undefined}>
                    <Avatar perfil={perfil} tamano={28} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{perfil?.nombre || perfil?.usuario || t('nav.miPerfil')}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/acceder/" className="btn btn-primario btn-bloque" aria-label={t('nav.entrar')}><LogIn size={18} /><span className="ocultable">{t('nav.entrar')}</span></Link>
                </>
              )}
            </div>
          </nav>
        </aside>

        <div style={{ minWidth: 0 }}>
          <header className="barra-superior cristal cristal-fijo">
            <Link href="/" className="marca marca-barra" aria-label="Tankily"><Marca conNombre animable animar={cargando} /></Link>
            {/* Sin botón de tema: en el móvil está en el menú "Más" de la barra inferior */}
            <div style={{ display: 'flex', gap: 2 }}>
              <Link href="/explorar/" className="btn btn-fantasma btn-icono" aria-label={t('nav.buscar')}><Search size={20} /></Link>
              {usuario ? (
                <>
                  <Link href="/notificaciones/" className="btn btn-fantasma btn-icono" aria-label={t('nav.notificaciones')} style={{ position: 'relative' }}>
                    <Bell size={20} />
                    {noLeidos.notificaciones > 0 && <span className="punto-aviso" />}
                  </Link>
                  <Link href="/mensajes/" className="btn btn-fantasma btn-icono" aria-label={t('nav.mensajes')} style={{ position: 'relative' }}>
                    <Mail size={20} />
                    {noLeidos.mensajes > 0 && <span className="punto-aviso" />}
                  </Link>
                </>
              ) : (
                <Link href="/acceder/" className="btn btn-s">{t('nav.entrar')}</Link>
              )}
            </div>
          </header>

          <main id="principal" ref={principal}>
            {children}
          </main>

          <PieLegal />
        </div>
      </div>

      {/* Barra inferior del móvil. "Más" no abre otra página: la barra crece hacia arriba y muestra el resto
          de secciones (filas de la rejilla de 0fr a 1fr con curva de muelle). */}
      <div className={`velo-barra${masAbierto ? ' visible' : ''}`} onClick={() => setMasAbierto(false)} aria-hidden="true" />
      <nav className={`barra-movil cristal cristal-fijo${masAbierto ? ' abierta' : ''}`} aria-label={t('nav.principal')}>
        <div className="barra-movil-panel" id="menu-mas" inert={!masAbierto}>
          <div className="barra-movil-panel-interior">
            <div className="barra-movil-desplazable">
              <MenuMas enBarra />
            </div>
          </div>
        </div>
        <div className="barra-movil-pestanas">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}><Waves size={22} />{t('nav.muro')}</Link>
          <Link href="/tanques/" aria-current={activo(pathname, '/tanques/') || pathname.startsWith('/tanque') ? 'page' : undefined}><Fish size={22} />{t('nav.tanques')}</Link>
          {/* La wiki va en la barra (es lo que más busca quien llega de fuera); el mercado, en "Más" */}
          <Link href="/wiki/" aria-current={activo(pathname, '/wiki/') ? 'page' : undefined}><BookOpen size={22} />{t('nav.wiki')}</Link>
          <Link href="/foro/" aria-current={activo(pathname, '/foro/') ? 'page' : undefined}><MessagesSquare size={22} />{t('nav.foro')}</Link>
          <button
            type="button"
            onClick={() => setMasAbierto((v) => !v)}
            aria-expanded={masAbierto}
            aria-controls="menu-mas"
            aria-current={!masAbierto && activo(pathname, '/mas/') ? 'page' : undefined}
          >
            {masAbierto
              ? <X size={22} />
              : (usuario ? <Avatar perfil={perfil} tamano={24} /> : <Menu size={22} />)}
            {masAbierto ? t('comun.cerrar') : t('nav.mas')}
          </button>
        </div>
      </nav>

      <ChatFlotante />
      <AvisoCookies />
      <AvisoApp />
      {/* Administración: burbuja flotante que se arrastra (solo administradores) */}
      <BotonAdmin />
    </>
  );
}

function PieLegal() {
  const { t } = useT();
  return (
    <footer className="pie texto-3 mini">
      <span>© {new Date().getFullYear()} Tankily</span>
      <Link href="/tiendas/pro/">{t('pie.tiendas')}</Link>
      <Link href="/apoyar/">{t('apoyar.nav')}</Link>
      <Link href="/legal/aviso-legal/">{t('pie.avisoLegal')}</Link>
      <Link href="/legal/privacidad/">{t('pie.privacidad')}</Link>
      <Link href="/legal/cookies/">{t('pie.cookies')}</Link>
      <Link href="/legal/normas/">{t('pie.normas')}</Link>
      <SelectorIdioma className="enlace-pie" />
    </footer>
  );
}
