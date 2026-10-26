import TanquePorId from './TanquePorId';

// Versión con ?id= (enlaces internos y contenido creado después del último build). La página indexable es
// la de su slug, así que esta va con noindex: antes llegaba vacía a Google y salía como soft 404
export const metadata = { robots: { index: false, follow: true } };

export default function Pagina() {
  return <TanquePorId />;
}
