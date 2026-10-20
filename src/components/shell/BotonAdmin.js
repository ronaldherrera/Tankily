"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Flag, Store, Megaphone, TrendingUp, Plug, BarChart3 } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { usePresencia } from '@/lib/presencia';

const CLAVE = 'tk-admin-burbuja';
const TAM = 48;
const MARGEN = 12;
const SECCIONES = [
  ['resumen', LayoutDashboard],
  ['crecimiento', TrendingUp],
  ['denuncias', Flag],
  ['tiendas', Store],
  ['campanas', Megaphone],
  ['proveedores', Plug],
];

const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || null; } catch { return null; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch {} };

// Límites donde puede estar la burbuja: dentro de la pantalla y, en el móvil, por encima de la barra inferior
function limites() {
  const barra = document.querySelector('.barra-movil');
  const abajo = barra && getComputedStyle(barra).display !== 'none' ? barra.getBoundingClientRect().top - MARGEN : window.innerHeight - MARGEN;
  const superior = document.querySelector('.barra-superior');
  const arriba = superior && getComputedStyle(superior).display !== 'none' ? superior.getBoundingClientRect().bottom + MARGEN : MARGEN;
  return { arriba, abajo: abajo - TAM, ancho: window.innerWidth };
}

// Burbuja de administración: solo la ven los administradores. Se despliega con los accesos del panel
// y se puede arrastrar a cualquier sitio; al soltarla se pega al borde más cercano y recuerda dónde quedó.
export default function BotonAdmin() {
  const { perfil } = useSesion();
  if (!perfil?.es_admin) return null;
  return <Burbuja />;
}

function Burbuja() {
  const { t } = useT();
  const pathname = usePathname();
  const [sitio, setSitio] = useState(null); // { lado: 'izq' | 'der', y: 0..1 }
  const [arrastre, setArrastre] = useState(null); // { x, y } mientras se arrastra
  const [abierto, setAbierto] = useState(false);
  const [pendientes, setPendientes] = useState(0);
  const [, setTamano] = useState(0);
  const panel = usePresencia(abierto);
  // Analítica en este dispositivo: Umami no cuenta las visitas si existe la marca umami.disabled. Vale para cada
  // navegador y para la app instalada en iPhone (que guarda sus datos aparte de Safari)
  const [contando, setContando] = useState(() => { try { return localStorage.getItem('umami.disabled') !== '1'; } catch { return true; } });
  function cambiarAnalitica() {
    try { if (contando) localStorage.setItem('umami.disabled', '1'); else localStorage.removeItem('umami.disabled'); setContando(!contando); } catch { /* sin almacenamiento */ }
  }
  const caja = useRef(null);
  const gesto = useRef(null);

  // Posición guardada (o abajo a la izquierda) y recolocar al cambiar el tamaño de la ventana
  useLayoutEffect(() => {
    setSitio(leer() || { lado: 'izq', y: 0.82 });
    const alCambiar = () => setTamano(window.innerWidth + window.innerHeight);
    window.addEventListener('resize', alCambiar);
    return () => window.removeEventListener('resize', alCambiar);
  }, []);

  // Denuncias sin revisar, en la insignia
  useEffect(() => {
    supabase.from('reportes').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
      .then(({ count }) => setPendientes(count || 0));
  }, [pathname]);

  // Se cierra al navegar, al tocar fuera o con Escape
  const [rutaPrevia, setRutaPrevia] = useState(pathname);
  if (rutaPrevia !== pathname) { setRutaPrevia(pathname); setAbierto(false); }
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => !caja.current?.contains(e.target) && setAbierto(false);
    const escape = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', escape); };
  }, [abierto]);

  if (!sitio) return null;
  const lim = limites();
  const yReposo = lim.arriba + sitio.y * Math.max(0, lim.abajo - lim.arriba);
  const xReposo = sitio.lado === 'izq' ? MARGEN : lim.ancho - TAM - MARGEN;
  const x = arrastre ? arrastre.x : xReposo;
  const y = arrastre ? arrastre.y : yReposo;

  function alPulsar(e) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesto.current = { dx: e.clientX - x, dy: e.clientY - y, x0: e.clientX, y0: e.clientY, movido: false };
  }
  function alMover(e) {
    const g = gesto.current;
    if (!g) return;
    if (!g.movido && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 6) return;
    if (!g.movido) setAbierto(false);
    g.movido = true;
    const l = limites();
    // La última posición se guarda también en el gesto: al soltar rápido, el estado aún no se ha repintado
    g.ultima = {
      x: Math.min(Math.max(e.clientX - g.dx, MARGEN), l.ancho - TAM - MARGEN),
      y: Math.min(Math.max(e.clientY - g.dy, l.arriba), l.abajo),
    };
    setArrastre(g.ultima);
  }
  function alSoltar() {
    const g = gesto.current;
    gesto.current = null;
    if (!g) return;
    if (!g.movido || !g.ultima) { if (!g.movido) setAbierto((v) => !v); setArrastre(null); return; }
    // Se pega al borde más cercano; la altura se guarda en proporción a la pantalla
    const l = limites();
    const nuevo = {
      lado: g.ultima.x + TAM / 2 < l.ancho / 2 ? 'izq' : 'der',
      y: Math.min(1, Math.max(0, (g.ultima.y - l.arriba) / Math.max(1, l.abajo - l.arriba))),
    };
    setSitio(nuevo);
    guardar(nuevo);
    setArrastre(null);
  }

  // El menú se abre hacia el centro de la pantalla y hacia donde haya sitio en vertical
  const haciaArriba = y > window.innerHeight * 0.55;
  const estiloPanel = {
    [sitio.lado === 'izq' ? 'left' : 'right']: 0,
    [haciaArriba ? 'bottom' : 'top']: TAM + 8,
  };

  return (
    <div
      ref={caja}
      className={`burbuja-admin${arrastre ? ' arrastrando' : ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <button
        type="button"
        className="burbuja-admin-boton"
        onPointerDown={alPulsar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => { gesto.current = null; setArrastre(null); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAbierto((v) => !v); } }}
        aria-label={t('administracion.abrir')}
        title={t('administracion.abrir')}
        aria-expanded={abierto}
        aria-haspopup="menu"
      >
        <ShieldCheck size={22} aria-hidden />
        {pendientes > 0 && <b className="insignia">{pendientes > 99 ? '99+' : pendientes}</b>}
      </button>
      {panel.montado && (
        <div
          className={`menu cristal burbuja-admin-menu${panel.saliendo ? ' saliendo' : ''}${haciaArriba ? ' hacia-arriba' : ''}${sitio.lado === 'der' ? ' a-la-izquierda' : ''}`}
          style={estiloPanel}
          role="menu"
        >
          <p className="burbuja-admin-titulo mini">{t('administracion.titulo')}</p>
          {SECCIONES.map(([clave, Icono]) => (
            <Link key={clave} role="menuitem" href={`/admin/?s=${clave}`} onClick={() => setAbierto(false)}>
              <Icono size={16} aria-hidden /> <span>{t(`administracion.${clave}`)}</span>
              {clave === 'denuncias' && pendientes > 0 && <b className="insignia">{pendientes}</b>}
            </Link>
          ))}
          <p className="burbuja-admin-titulo mini">{t('administracion.ajustes')}</p>
          <button type="button" role="menuitemcheckbox" aria-checked={contando} onClick={cambiarAnalitica}>
            <BarChart3 size={16} aria-hidden /> <span>{t('administracion.contarVisitas')}</span>
            <b className="mini texto-3" style={{ marginLeft: 'auto' }}>{contando ? t('administracion.si') : t('administracion.no')}</b>
          </button>
        </div>
      )}
    </div>
  );
}
