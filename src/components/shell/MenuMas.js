"use client";

import Link from '@/components/Enlace';
import { Store, BookOpen, Calculator, User, Settings, Search, Crown, FileText, LogIn, Coffee } from 'lucide-react';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import BotonTema from '@/components/shell/BotonTema';
import SelectorIdioma from '@/components/shell/SelectorIdioma';
import SelectorUnidades from '@/components/shell/SelectorUnidades';

// Secciones que no caben en la barra inferior del móvil. Se usa en el menú que despliega la barra
// (AppShell, `enBarra`) y en la página /mas/ (por si alguien entra con el enlace directo).
export default function MenuMas({ enBarra = false }) {
  const { usuario, perfil } = useSesion();
  const { t } = useT();
  const enlaces = [
    ['/tiendas/', t('nav.tiendas'), Store],
    ['/wiki/', t('nav.wiki'), BookOpen],
    ['/herramientas/', t('herr.corto'), Calculator],
    ['/explorar/', t('nav.buscar'), Search],
    ...(usuario
      ? [[`/u/?n=${perfil?.usuario || ''}`, t('nav.miPerfil'), User], ['/ajustes/', t('nav.ajustes'), Settings]]
      : [['/acceder/', t('nav.entrarOCrear'), LogIn]]),
    ['/tiendas/pro/', t('nav.paraTiendas'), Crown],
    ['/legal/normas/', t('nav.normas'), FileText],
    ['/apoyar/', t('apoyar.nav'), Coffee],
  ];
  // En la barra, cada fila entra con un pequeño retraso (--i) mientras la barra crece
  const fila = (i) => ({ position: 'relative', zIndex: 2, '--i': i });

  const lista = (
    <nav
      className={enBarra ? 'menu-mas-lista' : 'cristal'}
      style={enBarra ? undefined : { padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}
      aria-label={t('nav.masSecciones')}
    >
      {enlaces.map(([href, texto, Icono], i) => (
        <Link key={href} href={href} className="nav-item" style={fila(i)}><Icono size={20} /><span>{texto}</span></Link>
      ))}
      <div style={fila(enlaces.length)}><SelectorIdioma conTexto /></div>
      <div style={fila(enlaces.length + 1)}><BotonTema conTexto /></div>
    </nav>
  );
  const unidades = <div className="campo"><span>{t('ajustes.unidades')}</span><SelectorUnidades /></div>;

  if (enBarra) {
    return (
      <>
        {lista}
        <div className="menu-mas-unidades" style={fila(enlaces.length + 2)}>{unidades}</div>
      </>
    );
  }
  return (
    <>
      {lista}
      <section className="cristal-suave" style={{ padding: 16 }}>{unidades}</section>
    </>
  );
}
