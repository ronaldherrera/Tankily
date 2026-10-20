"use client";

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';

// Vídeo de una publicación, como en Instagram: arranca sin sonido cuando se ve al menos la mitad, se para al salir
// de la pantalla y un toque activa o quita el sonido. preload="none" + miniatura: no gasta datos hasta que se ve.
export default function VideoPost({ video }) {
  const { t } = useT();
  const el = useRef(null);
  const [sonido, setSonido] = useState(false);

  useEffect(() => {
    const v = el.current;
    if (!v || typeof IntersectionObserver === 'undefined') return undefined;
    const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) { if (!reducido) v.play().catch(() => {}); } else v.pause();
    }, { threshold: [0, 0.5] });
    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  if (!video?.url) return null;
  const proporcion = video.ancho && video.alto ? `${video.ancho} / ${video.alto}` : '9 / 16';

  function alternarSonido() {
    const v = el.current;
    if (!v) return;
    v.muted = !v.muted;
    setSonido(!v.muted);
    if (v.paused) v.play().catch(() => {});
  }

  return (
    <div className="video-post" style={{ '--proporcion': proporcion }}>
      <video
        ref={el}
        src={video.url}
        poster={video.poster || undefined}
        muted
        loop
        playsInline
        preload="none"
        onClick={alternarSonido}
        aria-label={t('video.etiqueta')}
      />
      <button type="button" className="video-post-sonido" onClick={alternarSonido} aria-label={sonido ? t('video.sinSonido') : t('video.conSonido')}>
        {sonido ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </div>
  );
}
