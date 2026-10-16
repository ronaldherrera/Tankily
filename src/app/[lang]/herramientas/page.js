import Link from '@/components/Enlace';
import Lateral from '@/components/Lateral';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { HERRAMIENTAS } from '@/lib/herramientas';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    title: traducir(lang, 'herr.titulo'),
    description: traducir(lang, 'herr.desc'),
    alternates: alternativas(lang, '/herramientas/'),
  };
}

export default async function Herramientas({ params }) {
  const { lang } = await params;
  const t = (clave) => traducir(lang, clave);
  return (
    <div className="contenido">
      <div className="columna">
        <header className="calc-cabecera">
          <h1 className="titulo-l">{t('herr.titulo')}</h1>
          <p className="texto-2">{t('herr.desc')}</p>
        </header>
        <ul className="lista-herramientas">
          {HERRAMIENTAS.map(({ clave, icono: Icono }) => (
            <li key={clave}>
              <Link href={`/herramientas/${clave}/`} className="tarjeta-herramienta cristal">
                <span className="tarea-icono"><Icono size={20} aria-hidden="true" /></span>
                <span className="tarjeta-herramienta-texto">
                  <strong>{t(`herr.${clave}.titulo`)}</strong>
                  <span className="pequeno texto-2">{t(`herr.${clave}.desc`)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Lateral />
    </div>
  );
}
