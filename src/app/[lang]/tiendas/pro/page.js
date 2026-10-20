import Link from '@/components/Enlace';
import { Check } from 'lucide-react';
import { traducir } from '@/i18n/traducir';
import { alternativas } from '@/lib/seo';
import { PAGO_ACTIVO } from '@/lib/planPro';

const EMAIL = process.env.NEXT_PUBLIC_EMAIL_CONTACTO || 'krill@tankily.com';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: traducir(lang, 'pro.metaTitulo'), description: traducir(lang, 'pro.metaDescripcion'), alternates: alternativas(lang, '/tiendas/pro/') };
}

export default async function ProPage({ params }) {
  const { lang } = await params;
  const t = (clave, vars) => traducir(lang, clave, vars);

  const planes = [
    {
      nombre: t('pro.gratis'),
      precio: t('pro.gratisPrecio'),
      detalle: t('pro.gratisDetalle'),
      ventajas: t('pro.gratisVentajas'),
      accion: [t('pro.gratisAccion'), '/tiendas/gestionar/'],
    },
    {
      nombre: t('pro.proNombre'),
      precio: t('pro.proPrecio'),
      detalle: t('pro.proDetalle'),
      destacado: true,
      ventajas: t('pro.proVentajas'),
      // Con el pago de Stripe activo se contrata desde el panel de la tienda; si no, se pide por email
      accion: [t('pro.proAccion'), PAGO_ACTIVO ? '/tiendas/gestionar/' : `mailto:${EMAIL}?subject=${encodeURIComponent(t('pro.proAsunto'))}`],
    },
  ];

  return (
    <div className="contenido ancho">
      <div className="columna" style={{ gap: 32, paddingTop: 24 }}>
        <header style={{ maxWidth: 640 }}>
          <h1 className="titulo-xl">{t('pro.titulo')}</h1>
          <p className="texto-2" style={{ fontSize: '1.1rem', marginTop: 16 }}>{t('pro.texto')}</p>
        </header>

        <div className="planes">
          {planes.map((p) => (
            <section key={p.nombre} className={`plan ${p.destacado ? 'cristal cristal-refracta destacado' : 'cristal-suave'}`}>
              <h2 className="titulo-m">{p.nombre}</h2>
              <p><span className="cifra" style={{ fontSize: '2.4rem' }}>{p.precio}</span> <span className="texto-3">{p.detalle}</span></p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {p.ventajas.map((v) => <li key={v} style={{ display: 'flex', gap: 10 }}><Check size={18} style={{ color: 'var(--agua)', flexShrink: 0, marginTop: 2 }} /> <span className="texto-2">{v}</span></li>)}
              </ul>
              <Link href={p.accion[1]} className={`btn ${p.destacado ? 'btn-primario' : ''}`} style={{ position: 'relative', zIndex: 2 }}>{p.accion[0]}</Link>
            </section>
          ))}
        </div>

        <section className="cristal-suave" style={{ padding: 24, maxWidth: 860 }}>
          <h2 className="titulo-s" style={{ marginBottom: 8 }}>{t('pro.marcasTitulo')}</h2>
          <p className="texto-2">{t('pro.marcasTexto')} <a className="enlace" href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
        </section>
      </div>
    </div>
  );
}
