import Link from '@/components/Enlace';
import { MENCION } from '@/lib/usuario';

const PATRON = new RegExp(String.raw`(#[\p{L}\p{N}_]{2,40}|${MENCION}|https?:\/\/[^\s]+)`, 'gu');

// Convierte #etiquetas, @menciones y enlaces en vínculos.
// Con `sinEnlaces` solo los resalta: se usa dentro de otro enlace (la cita de un eco),
// porque un <a> dentro de otro <a> es HTML inválido.
export default function TextoRico({ texto, sinEnlaces = false }) {
  if (!texto) return null;
  const partes = texto.split(PATRON);
  return (
    <p className="prosa">
      {partes.map((parte, i) => {
        if (i % 2 === 0) return parte;
        if (sinEnlaces) return <span key={i} className="enlace">{parte}</span>;
        if (parte.startsWith('#')) {
          return <Link key={i} className="enlace" href={`/explorar/?tag=${encodeURIComponent(parte.slice(1).toLowerCase())}`}>{parte}</Link>;
        }
        if (parte.startsWith('@')) {
          return <Link key={i} className="enlace" href={`/u/?n=${parte.slice(1).toLowerCase()}`}>{parte}</Link>;
        }
        return <a key={i} className="enlace" href={parte} target="_blank" rel="noopener noreferrer nofollow">{parte.replace(/^https?:\/\//, '').slice(0, 48)}</a>;
      })}
    </p>
  );
}
