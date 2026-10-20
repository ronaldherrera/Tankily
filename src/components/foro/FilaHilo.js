import Link from '@/components/Enlace';
import { CheckCircle2, Pin, Lock, MessageCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Avatar } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';
import TextoTraducible from '@/components/feed/TextoTraducible';
import { enlaceHilo } from '@/lib/enlaces';

export const SELECT_HILO = 'id, titulo, categoria, num_respuestas, ultima_actividad, creado_en, solucion_id, fijado, cerrado, idioma, autor:perfiles!usuario_id(usuario, nombre, avatar_url)';

// nuevaPestana: abre el hilo aparte (p. ej. desde el formulario de un hilo nuevo, para no perder lo escrito)
export default function FilaHilo({ hilo, conCategoria = false, nuevaPestana = false }) {
  const { t, lang } = useT();
  const aparte = nuevaPestana ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <li className="fila-hilo">
      <Avatar perfil={hilo.autor} tamano={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={enlaceHilo(hilo, lang)} className="fila-hilo-titulo" {...aparte}>
          {hilo.fijado && <Pin size={14} aria-label={t('foro.fila.fijado')} />}
          {hilo.cerrado && <Lock size={14} aria-label={t('foro.fila.cerrado')} />}
          <TextoTraducible tabla="foro_hilos" id={hilo.id} campo="titulo" texto={hilo.titulo} idioma={hilo.idioma} compacto render={(x) => x} />
        </Link>
        <p className="mini texto-3">
          {hilo.autor?.nombre || hilo.autor?.usuario}
          {conCategoria && <> {t('foro.fila.en')} <Link href={`/foro/${hilo.categoria}/`} className="enlace" {...aparte}>{t(`foro.categorias.${hilo.categoria}.nombre`)}</Link></>}
          {' · '}{t('foro.fila.activo', { tiempo: formatRelativeTime(hilo.ultima_actividad) })}
        </p>
      </div>
      {hilo.solucion_id && <span className="mini" style={{ color: 'var(--ok)', display: 'flex', gap: 4, alignItems: 'center' }}><CheckCircle2 size={14} /> <span className="solo-escritorio">{t('foro.fila.resuelto')}</span></span>}
      <span className="mini texto-2" style={{ display: 'flex', gap: 4, alignItems: 'center', minWidth: 44, justifyContent: 'flex-end' }}><MessageCircle size={14} /> {hilo.num_respuestas}</span>
    </li>
  );
}

// Marcador con la forma de una fila mientras llegan los hilos
export function FilasHiloCargando({ n = 4 }) {
  return Array.from({ length: n }, (_, i) => (
    <li key={i} className="fila-hilo" aria-hidden="true">
      <span className="esqueleto" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="esqueleto" style={{ height: 12, width: `${70 - i * 9}%`, borderRadius: 6 }} />
        <span className="esqueleto" style={{ height: 10, width: '38%', borderRadius: 6 }} />
      </span>
    </li>
  ));
}
