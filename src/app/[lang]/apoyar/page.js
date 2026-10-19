import Link from '@/components/Enlace';
import { Coffee, Check, Heart } from 'lucide-react';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { URL_APOYO } from '@/lib/apoyo';
import { evento } from '@/lib/analitica';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'apoyar.titulo'),
    description: traducir(lang, 'apoyar.metaDescripcion'),
    alternates: alternativas(lang, '/apoyar/'),
  };
}

// Donaciones tipo "invítame a un café". El enlace (Ko-fi) está en lib/apoyo.js; sin él, el botón sale desactivado.
export default async function ApoyarPage({ params }) {
  const { lang } = await params;
  const t = (clave, vars) => traducir(lang, clave, vars);
  const lista = (elementos, Icono) => (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {elementos.map((e) => (
        <li key={e} style={{ display: 'flex', gap: 10 }}>
          <Icono size={18} style={{ color: 'var(--agua)', flexShrink: 0, marginTop: 2 }} aria-hidden /><span className="texto-2">{e}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 24, paddingTop: 24 }}>
        <header>
          <h1 className="titulo-xl">{t('apoyar.titulo')}</h1>
          <p className="texto-2" style={{ fontSize: '1.1rem', marginTop: 16 }}>{t('apoyar.texto')}</p>
        </header>

        <section className="cristal cristal-refracta" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="titulo-s">{t('apoyar.pagaTitulo')}</h2>
            {lista(t('apoyar.paga'), Check)}
            {URL_APOYO ? (
              <>
                <a href={URL_APOYO} target="_blank" rel="noopener" className="btn btn-primario" style={{ alignSelf: 'flex-start' }} onClick={() => evento('apoyar')}>
                  <Coffee size={18} aria-hidden />{t('apoyar.boton')}
                </a>
                <p className="pequeno texto-3">{t('apoyar.nota')}</p>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primario" disabled style={{ alignSelf: 'flex-start' }}>
                  <Coffee size={18} aria-hidden />{t('apoyar.boton')} · {t('apoyar.pronto')}
                </button>
                <p className="pequeno texto-3">{t('apoyar.prontoNota')}</p>
              </>
            )}
          </div>
        </section>

        <section className="cristal-suave" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="titulo-s">{t('apoyar.gratisTitulo')}</h2>
          {lista(t('apoyar.gratis'), Heart)}
        </section>

        <section className="cristal-suave" style={{ padding: 24 }}>
          <h2 className="titulo-s" style={{ marginBottom: 8 }}>{t('apoyar.marcasTitulo')}</h2>
          <p className="texto-2">{t('apoyar.marcasTexto')} <Link className="enlace" href="/tiendas/pro/">{t('apoyar.marcasEnlace')}</Link></p>
        </section>
      </div>
    </div>
  );
}
