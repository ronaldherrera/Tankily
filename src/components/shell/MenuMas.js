"use client";

import { Fragment } from 'react';
import Link from '@/components/Enlace';
import { Store, Tag, Calculator, User, Settings, Crown, FileText, LogIn, Coffee } from 'lucide-react';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import BotonTema from '@/components/shell/BotonTema';
import SelectorIdioma from '@/components/shell/SelectorIdioma';
import SelectorUnidades from '@/components/shell/SelectorUnidades';

// Secciones que no caben en la barra inferior del móvil. Se usa en el menú que despliega la barra
// (AppShell, `enBarra`) y en la página /mas/ (por si alguien entra con el enlace directo).
// Agrupadas por tipo, de lo más a lo menos usado: la cuenta primero (el botón "Más" lleva la foto de perfil),
// luego el resto de secciones, lo secundario (tiendas, apoyo, normas) y al final las preferencias.
// "Buscar" no está: ya tiene su botón en la barra superior.
export default function MenuMas({ enBarra = false }) {
  const { usuario, perfil } = useSesion();
  const { t } = useT();
  const grupos = [
    usuario
      ? [[`/u/?n=${perfil?.usuario || ''}`, t('nav.miPerfil'), User], ['/ajustes/', t('nav.ajustes'), Settings]]
      : [['/acceder/', t('nav.entrarOCrear'), LogIn]],
    [['/mercado/', t('nav.mercado'), Tag], ['/tiendas/', t('nav.tiendas'), Store], ['/herramientas/', t('herr.corto'), Calculator]],
    [['/tiendas/pro/', t('nav.paraTiendas'), Crown], ['/apoyar/', t('apoyar.nav'), Coffee], ['/legal/normas/', t('nav.normas'), FileText]],
  ];
  // En la barra, cada fila entra con un pequeño retraso (--i) mientras la barra crece
  const fila = (i) => ({ position: 'relative', zIndex: 2, '--i': i });
  let i = 0;

  const lista = (
    <nav
      className={enBarra ? 'menu-mas-lista' : 'cristal'}
      style={enBarra ? undefined : { padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}
      aria-label={t('nav.masSecciones')}
    >
      {grupos.map((grupo, g) => (
        <Fragment key={g}>
          {g > 0 && <hr className="menu-mas-separador" style={fila(i)} />}
          {grupo.map(([href, texto, Icono]) => (
            <Link key={href} href={href} className="nav-item" style={fila(i++)}><Icono size={20} /><span>{texto}</span></Link>
          ))}
        </Fragment>
      ))}
      <hr className="menu-mas-separador" style={fila(i)} />
      <div style={fila(i++)}><SelectorIdioma conTexto /></div>
      <div style={fila(i++)}><BotonTema conTexto /></div>
    </nav>
  );
  const unidades = <div className="campo"><span>{t('ajustes.unidades')}</span><SelectorUnidades /></div>;

  if (enBarra) {
    return (
      <>
        {lista}
        <div className="menu-mas-unidades" style={fila(i)}>{unidades}</div>
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
