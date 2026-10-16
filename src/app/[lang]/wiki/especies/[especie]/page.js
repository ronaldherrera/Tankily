import { notFound } from 'next/navigation';
import { Thermometer, Droplet, Box, Ruler, Gauge, Users, HeartHandshake, Waves, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from '@/components/Enlace';
import { traducir } from '@/i18n/traducir';
import { LOCALES } from '@/i18n/config';
import { catalogoEspecies, especiePorSlug } from '@/lib/catalogoEspecies';
import { JsonLd, migas } from '@/lib/datosEstructurados';
import FichaEspecieContenido from '@/components/wiki/FichaEspecieContenido';
import AnadirATanque from '@/components/wiki/AnadirATanque';
import TanquesConEspecie from '@/components/wiki/TanquesConEspecie';
import Publicidad from '@/components/Publicidad';

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL || 'https://tankily.com';

// Una página por especie de WikiTank (/wiki/especies/amphiprion-ocellaris/), generada en el build desde
// los Markdown de la wiki. Como el resto de WikiTank, el contenido está en español: se indexa la versión
// /es/ y las demás llevan noindex con la canónica en español.
export function generateStaticParams() {
  return catalogoEspecies().map((e) => ({ especie: e.slug }));
}

const nombrePrincipal = (e) => e.comun || e.cientifico;
// Las fichas ampliadas tienen grupos propios ("Tetras"): para "Añadir a mi tanque" vale la categoría
const GRUPO_CATEGORIA = { pez: 'Peces', planta: 'Plantas', coral: 'Corales', invertebrado: 'Invertebrados' };

const formato = (locale) => (n) => Number(n).toLocaleString(locale, { maximumFractionDigits: 2 });
const enEspanol = formato('es-ES');

// "Neón Cardenal (Paracheirodon axelrodi): 24–28 °C, pH 4,5–7, desde 60 l, dificultad 2/5…"
function descripcion(e) {
  const f = e.ficha || {};
  const n = enEspanol;
  const partes = [];
  if (f.t) partes.push(`${n(f.t[0])}–${n(f.t[1])} °C`);
  if (f.ph) partes.push(`pH ${n(f.ph[0])}–${n(f.ph[1])}`);
  if (f.l) partes.push(`acuario desde ${f.l} l`);
  if (f.cm) partes.push(`${f.cm} cm de adulto`);
  if (f.dif) partes.push(`dificultad ${f.dif}/5`);
  const nombre = e.comun && e.cientifico ? `${e.comun} (${e.cientifico})` : nombrePrincipal(e);
  const datos = partes.length ? `: ${partes.join(', ')}` : '';
  return `Ficha de ${nombre}${datos}. Cuidados, alimentación, comportamiento y con qué especies puede convivir.`.slice(0, 300);
}

export async function generateMetadata({ params }) {
  const { lang, especie } = await params;
  const e = especiePorSlug(especie);
  if (!e) return {};
  const titulo = e.comun && e.cientifico ? `${e.comun} (${e.cientifico})` : nombrePrincipal(e);
  return {
    title: `${titulo} · WikiTank`,
    description: descripcion(e),
    alternates: { canonical: `/es/wiki/especies/${e.slug}/` },
    robots: lang === 'es' ? undefined : { index: false, follow: true },
    openGraph: e.imagen ? { images: [encodeURI(e.imagen)] } : undefined,
  };
}

// Datos clave a la vista, sacados de la ficha (solo los que tiene)
function DatosClave({ ficha, t, n }) {
  if (!ficha) return null;
  const f = ficha;
  const filas = [
    f.t && [Thermometer, t('fichaEsp.temperatura'), `${n(f.t[0])}–${n(f.t[1])} °C`],
    f.ph && [Droplet, t('fichaEsp.ph'), `${n(f.ph[0])}–${n(f.ph[1])}`],
    f.l && [Box, t('fichaEsp.litros'), f.lpp ? t('fichaEsp.litrosPorEjemplar', { l: f.l }) : `${f.l} l`],
    f.cm && [Ruler, t('fichaEsp.tamano'), `${f.cm} cm`],
    f.dif && [Gauge, t('fichaEsp.dificultad'), `${'★'.repeat(f.dif)}${'☆'.repeat(Math.max(0, 5 - f.dif))}`],
    f.grupo && [Users, t('fichaEsp.grupo'), t('fichaEsp.grupoDe', { n: f.grupo })],
    f.comp && [HeartHandshake, t('fichaEsp.comportamiento'), t(`fichaEsp.${f.comp}`)],
    f.agua && [Waves, t('fichaEsp.agua'), t(`fichaEsp.${f.agua}`)],
    f.reef && [ShieldCheck, t('fichaEsp.reef'), t(`fichaEsp.${f.reef}`)],
  ].filter(Boolean);
  if (!filas.length) return null;
  return (
    <section aria-labelledby="datos-clave">
      <h2 id="datos-clave" className="titulo-s" style={{ marginBottom: 10 }}>{t('fichaEsp.datosClave')}</h2>
      <ul className="especie-datos">
        {filas.map(([Icono, etiqueta, valor]) => (
          <li key={etiqueta} className="cristal-suave">
            <Icono size={18} aria-hidden="true" />
            <span className="mini texto-3">{etiqueta}</span>
            <strong>{valor}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function PaginaEspecie({ params }) {
  const { lang, especie } = await params;
  const e = especiePorSlug(especie);
  if (!e) notFound();
  const t = (clave, vars) => traducir(lang, clave, vars);
  const nombre = nombrePrincipal(e);
  // Relacionadas: misma categoría y algún tipo de acuario en común (o, en las fichas ampliadas, el mismo
  // grupo y después el mismo tipo de agua), primero las que tienen foto
  const rutas = new Set(e.acuarios.map((a) => a.ruta));
  const parecida = (x) => (rutas.size ? x.acuarios.some((a) => rutas.has(a.ruta)) : x.grupo === e.grupo) ? 2
    : x.ficha?.agua && x.ficha.agua === e.ficha?.agua ? 1 : 0;
  const relacionadas = catalogoEspecies()
    .filter((x) => x.slug !== e.slug && x.categoria === e.categoria && parecida(x) > 0)
    .sort((a, b) => parecida(b) - parecida(a) || Number(!!b.imagen) - Number(!!a.imagen))
    .slice(0, 6);
  const tieneFicha = !!(e.ficha?.t || e.ficha?.ph);

  const canonica = `/es/wiki/especies/${e.slug}/`;
  const articulo = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: e.comun && e.cientifico ? `${e.comun} (${e.cientifico})` : nombre,
    description: descripcion(e),
    inLanguage: 'es',
    url: `${URL_SITIO}${canonica}`,
    ...(e.imagen ? { image: `${URL_SITIO}${encodeURI(e.imagen)}` } : {}),
    about: { '@type': 'Thing', name: e.cientifico || nombre, ...(e.comun ? { alternateName: [e.comun, ...e.otrosNombres] } : {}) },
    isPartOf: { '@type': 'WebSite', name: 'WikiTank · Tankily', url: `${URL_SITIO}/es/wiki/` },
    publisher: { '@type': 'Organization', name: 'Tankily', logo: { '@type': 'ImageObject', url: `${URL_SITIO}/icons/icon-512.png` } },
  };

  return (
    <article className="especie-pagina" lang="es">
      <JsonLd datos={[articulo, migas([['WikiTank', '/es/wiki/'], [t('catalogo.titulo'), '/es/wiki/especies/'], [nombre, canonica]])]} />

      <nav className="especie-migas mini" aria-label={t('wiki.ruta')} lang={lang}>
        <Link href="/wiki/" className="enlace">WikiTank</Link> / <Link href="/wiki/especies/" className="enlace">{t('catalogo.titulo')}</Link> / <span className="texto-3">{nombre}</span>
      </nav>

      <header className="especie-hero">
        {e.imagen && <img src={encodeURI(e.imagen)} alt={nombre} />}
        <div className="especie-hero-panel cristal cristal-refracta">
          <span className="etiqueta-agua" lang={lang}>{e.grupo}</span>
          <h1>{nombre}</h1>
          {e.comun && e.cientifico && <p className="especie-cientifico"><em>{e.cientifico}</em></p>}
          {e.otrosNombres.length > 0 && <p className="mini texto-3"><span lang={lang}>{t('fichaEsp.otrosNombres')}</span>: {e.otrosNombres.join(', ')}</p>}
        </div>
      </header>

      {e.credito && (
        // Las licencias de Wikimedia Commons piden citar autor y licencia junto a la foto
        <p className="especie-credito mini texto-3" lang={lang}>
          {t('fichaEsp.foto')}: {e.credito.autor} ·{' '}
          {e.credito.urlLicencia ? <a href={e.credito.urlLicencia} rel="license noopener" target="_blank" className="enlace">{e.credito.licencia}</a> : e.credito.licencia} ·{' '}
          <a href={e.credito.fuente} rel="noopener" target="_blank" className="enlace">Wikimedia Commons</a>
        </p>
      )}

      {lang !== 'es' && <p className="aviso" lang={lang}>{t('fichaEsp.contenidoEnEspanol')}</p>}

      <div lang={lang}><DatosClave ficha={e.ficha} t={t} n={formato(LOCALES[lang])} /></div>

      <div className="especie-cuerpo">
        <section className="cristal-suave especie-ficha" aria-labelledby="ficha-completa">
          <h2 id="ficha-completa" className="titulo-s" lang={lang}>{t('fichaEsp.fichaCompleta')}</h2>
          <FichaEspecieContenido contenido={e.contenido} />
        </section>

        <aside className="especie-lateral" lang={lang}>
          {e.acuarios.length > 0 && (
            <section className="cristal-suave" style={{ padding: 16 }}>
              <h2 className="titulo-s" style={{ marginBottom: 8 }}>{t('fichaEsp.habitualEn')}</h2>
              <div className="chips">
                {e.acuarios.map((a) => <Link key={a.ruta} href={`/wiki/explorer/${a.ruta}/`} className="chip">{a.acuario}</Link>)}
              </div>
            </section>
          )}
          {tieneFicha && (
            <div>
              <AnadirATanque titulo={e.titulo} grupo={e.acuarios.length ? e.grupo : GRUPO_CATEGORIA[e.categoria]} />
              <TanquesConEspecie titulo={e.titulo} />
            </div>
          )}
          <Publicidad ubicacion="wiki" />
        </aside>
      </div>

      {relacionadas.length > 0 && (
        <section aria-labelledby="relacionadas" lang={lang}>
          <h2 id="relacionadas" className="titulo-s" style={{ marginBottom: 10 }}>{t('fichaEsp.relacionadas', { grupo: e.grupo.toLowerCase() })}</h2>
          <ul className="catalogo-rejilla">
            {relacionadas.map((x) => (
              <li key={x.slug}>
                <Link href={`/wiki/especies/${x.slug}/`} className="tarjeta-especie cristal-suave">
                  <span className="tarjeta-especie-foto">{x.imagen && <img src={encodeURI(x.imagen)} alt="" loading="lazy" />}</span>
                  <span className="tarjeta-especie-texto" lang="es">
                    <strong>{x.comun || x.cientifico}</strong>
                    {x.comun && x.cientifico && <em>{x.cientifico}</em>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p lang={lang}><Link href="/wiki/especies/" className="enlace pequeno"><ArrowLeft size={14} aria-hidden="true" /> {t('catalogo.verCatalogo')}</Link></p>
    </article>
  );
}
