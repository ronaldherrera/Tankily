"use client";

import { useRef, useState } from 'react';
import { Clapperboard, X } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { MEDIA_URL, subirVideo, borrarVideo } from '@/lib/videos';
import EditorVideo from './EditorVideo';

// Un vídeo por publicación: al elegirlo se abre el editor (duración y encuadre); después se comprime y se sube.
// Devuelve el objeto video por onCambio.
export default function SubidorVideo({ valor, onCambio, onOcupado }) {
  const { t } = useT();
  const input = useRef(null);
  const [fase, setFase] = useState(null); // { fase, p }
  const [error, setError] = useState('');
  const [archivo, setArchivo] = useState(null); // elegido, en el editor
  if (!MEDIA_URL) return null;

  function alElegir(e) {
    const elegido = e.target.files?.[0];
    e.target.value = '';
    if (!elegido) return;
    setError('');
    if (!elegido.type.startsWith('video/')) { setError(t('video.noEsVideo')); return; }
    setArchivo(elegido);
  }
  async function alEditar(edicion) {
    const elegido = archivo;
    setArchivo(null);
    setFase({ fase: 'preparando', p: 0 });
    onOcupado?.(true);
    try {
      onCambio(await subirVideo(elegido, (f, p) => setFase({ fase: f, p }), edicion));
    } catch (err) {
      setError(err.message);
    }
    setFase(null);
    onOcupado?.(false);
  }
  function quitar() {
    borrarVideo(valor);
    onCambio(null);
  }

  if (valor) {
    return (
      <div className="subidor-video">
        <video src={valor.url} poster={valor.poster || undefined} muted playsInline controls preload="metadata" />
        <button type="button" className="btn btn-icono btn-s subidor-video-quitar" onClick={quitar} aria-label={t('video.quitar')}><X size={14} /></button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {fase ? (
        <div className="subidor-video-progreso" role="status">
          <span className="mini">{t(`video.${fase.fase}`, { p: Math.round(fase.p * 100) })}</span>
          <div className="barra-progreso"><div style={{ width: `${Math.round(fase.p * 100)}%` }} /></div>
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-s" onClick={() => input.current?.click()} title={t('video.ayuda')}>
            <Clapperboard size={18} /> {t('video.anadir')}
          </button>
          <input ref={input} type="file" accept="video/*" hidden onChange={alElegir} />
        </div>
      )}
      {error && <p className="aviso error">{error}</p>}
      {archivo && <EditorVideo archivo={archivo} onListo={alEditar} onCancelar={() => setArchivo(null)} />}
    </div>
  );
}
