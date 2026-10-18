"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Waves, Fish, MessagesSquare, Tag, Store, BookOpen, Calculator, Search, Bell, Mail, Menu, Plus, LogIn, X, Coffee,
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

// Símbolo de Tankily: la t con una ola por travesaño y una burbuja por punto.
// Con `conNombre`, la t hace de inicial de "ankily" (logotipo); el recorte del
// viewBox ajusta la t a la caja de la letra para que apoye en la línea base.
export function Marca({ tamano = 30, conNombre = false }) {
  const id = useId().replace(/:/g, '');
  const simbolo = (
    <svg
      className={conNombre ? 'marca-t' : 'marca-simbolo'}
      viewBox={conNombre ? '9.5 0 46 64' : '0 0 64 64'}
      width={conNombre ? undefined : tamano}
      height={conNombre ? undefined : tamano}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`marca-ola-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--marca-ola)" />
          <stop offset="1" stopColor="var(--marca-ola-fin)" />
        </linearGradient>
      </defs>
      <path d="M29 10V40a12 12 0 0 0 12 12h3" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <path d="M14 26c5-4.2 10-4.2 15 0s10 4.2 15 0" fill="none" stroke={`url(#marca-ola-${id})`} strokeWidth="8.5" strokeLinecap="round" />
      <circle cx="51" cy="13" r="4" fill="var(--marca-ola)" />
    </svg>
  );
  if (!conNombre) return simbolo;
  return <>{simbolo}<span className="marca-nombre">ankily</span></>;
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
  const { t } = useT();
  const noLeidos = useNoLeidos(usuario);
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
            <Link href="/" className="marca" aria-label="Tankily"><Marca conNombre /></Link>
            {NAV.map(({ href, clave, icono: Icono }) => (
              <Link key={href} href={href} className="nav-item" aria-current={activo(pathname, href) ? 'page' : undefined}>
                <Icono size={20} /><span>{t(clave)}</span>
              </Link>
            ))}
            <div style={{ height: 12 }} />
            <Link href="/explorar/" className="nav-item" aria-current={activo(pathname, '/explorar/') ? 'page' : undefined}>
              <Search size={20} /><span>{t('nav.buscar')}</span>
            </Link>
            <Link href="/apoyar/" className="nav-item" aria-current={activo(pathname, '/apoyar/') ? 'page' : undefined}>
              <Coffee size={20} /><span>{t('apoyar.nav')}</span>
            </Link>
            {usuario && (
              <>
                <Link href="/notificaciones/" className="nav-item" aria-current={activo(pathname, '/notificaciones/') ? 'page' : undefined}>
                  <Bell size={20} /><span>{t('nav.notificaciones')}</span><Insignia n={noLeidos.notificaciones} />
                </Link>
                <Link href="/mensajes/" className="nav-item" aria-current={activo(pathname, '/mensajes/') ? 'page' : undefined}>
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
            <Link href="/" className="marca marca-barra" aria-label="Tankily"><Marca conNombre /></Link>
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
          <Link href="/foro/" aria-current={activo(pathname, '/foro/') ? 'page' : undefined}><MessagesSquare size={22} />{t('nav.foro')}</Link>
          <Link href="/mercado/" aria-current={activo(pathname, '/mercado/') ? 'page' : undefined}><Tag size={22} />{t('nav.mercado')}</Link>
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
