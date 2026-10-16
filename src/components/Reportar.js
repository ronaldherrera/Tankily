"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { MOTIVOS_REPORTE } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { Modal, useTostada } from '@/components/ui';

export default function Reportar({ tipo, objetoId, onCerrar }) {
  const { usuario } = useSesion();
  const tostada = useTostada();
  const { t } = useT();
  const [motivo, setMotivo] = useState('spam');
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!usuario) return tostada(t('reportar.entra'));
    setEnviando(true);
    const { error } = await supabase.from('reportes').insert({ tipo, objeto_id: String(objetoId), motivo, detalle: detalle.trim() || null });
    setEnviando(false);
    if (!error) {
      tostada(t('reportar.enviado'));
      onCerrar();
    }
  }

  return (
    <Modal titulo={t('reportar.titulo')} onCerrar={onCerrar}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MOTIVOS_REPORTE.map((clave) => (
            <label key={clave} className="casilla">
              <input type="radio" name="motivo" value={clave} checked={motivo === clave} onChange={() => setMotivo(clave)} />
              {t(`reportar.motivos.${clave}`)}
            </label>
          ))}
        </div>
        <label className="campo">
          <span>{t('reportar.detalles')}</span>
          <textarea className="entrada" maxLength={1000} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        </label>
        <button className="btn btn-primario" disabled={enviando}>{enviando ? t('reportar.enviando') : t('reportar.enviar')}</button>
      </form>
    </Modal>
  );
}
