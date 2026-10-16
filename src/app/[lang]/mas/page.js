"use client";

import Link from '@/components/Enlace';
import { Store, BookOpen, Calculator, User, Settings, Search, Crown, FileText, LogIn } from 'lucide-react';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import BotonTema from '@/components/shell/BotonTema';
import SelectorIdioma from '@/components/shell/SelectorIdioma';
import SelectorUnidades from '@/components/shell/SelectorUnidades';

export default function MasPage() {
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
  ];

  return (
    <div className="contenido">
      <div className="columna">
        <nav className="cristal" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }} aria-label={t('nav.masSecciones')}>
          {enlaces.map(([href, texto, Icono]) => (
            <Link key={href} href={href} className="nav-item" style={{ position: 'relative', zIndex: 2 }}><Icono size={20} /><span>{texto}</span></Link>
          ))}
          <div style={{ position: 'relative', zIndex: 2 }}><SelectorIdioma conTexto /></div>
          <div style={{ position: 'relative', zIndex: 2 }}><BotonTema conTexto /></div>
        </nav>
        <section className="cristal-suave" style={{ padding: 16 }}>
          <div className="campo"><span>{t('ajustes.unidades')}</span><SelectorUnidades /></div>
        </section>
      </div>
    </div>
  );
}
