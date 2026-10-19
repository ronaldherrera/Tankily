"use client";

import { useEffect, useState } from 'react';
import { Share, EllipsisVertical, SquarePlus } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { ADSENSE_ACTIVO } from '@/lib/adsense';
import { DURACION_SALIDA } from '@/lib/presencia';
import { enModoApp, plataforma } from '@/lib/instalarApp';
import { leerConsentimiento } from './AvisoCookies';
import { evento as medir } from '@/lib/analitica';

const CLAVE_DESCARTE = 'tk-aviso-app';
const CLAVE_INSTALADA = 'tk-app-instalada';
const DIAS_SIN_MOSTRAR = 14;
const RETRASO = 4000;

function descartadoHace() {
  try {
    const fecha = Number(localStorage.getItem(CLAVE_DESCARTE));
    return fecha ? (Date.now() - fecha) / 86400000 : Infinity;
  } catch { return Infinity; }
}

function yaInstalada() {
  try { return localStorage.getItem(CLAVE_INSTALADA) === '1'; } catch { return false; }
}

// En móvil y tablet: todavía no hay app en las tiendas, pero se puede instalar desde el navegador.
// En Android (Chrome, Edge, Samsung…) con un botón que abre el instalador; en iPhone/iPad, Apple no lo
// permite y se explica cómo hacerlo desde Compartir. Sale después del aviso de cookies, nunca a la vez.
export default function AvisoApp() {
  const { t } = useT();
  const [sistema, setSistema] = useState(null);
  const [instalable, setInstalable] = useState(false);
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const so = plataforma();
    if (so === 'otro' || enModoApp() || yaInstalada() || descartadoHace() < DIAS_SIN_MOSTRAR) return;
    setSistema(so);
    setInstalable(Boolean(window.__tkInstalar));

    const alInstalable = () => setInstalable(true);
    const alInstalar = () => setVisible(false);
    window.addEventListener('tk:instalable', alInstalable);
    window.addEventListener('appinstalled', alInstalar);

    // Con el aviso de cookies pendiente, se espera a que se responda
    let temporizador;
    const mostrar = () => { temporizador = setTimeout(() => setVisible(true), RETRASO); };
    const cookiesPendientes = !ADSENSE_ACTIVO && !leerConsentimiento();
    if (cookiesPendientes) window.addEventListener('tk:consentimiento', mostrar, { once: true });
    else mostrar();

    return () => {
      clearTimeout(temporizador);
      window.removeEventListener('tk:instalable', alInstalable);
      window.removeEventListener('appinstalled', alInstalar);
      window.removeEventListener('tk:consentimiento', mostrar);
    };
  }, []);

  function cerrar(recordar = true) {
    if (recordar) { try { localStorage.setItem(CLAVE_DESCARTE, String(Date.now())); } catch {} }
    setSaliendo(true);
    setTimeout(() => setVisible(false), DURACION_SALIDA);
  }

  async function instalar() {
    const evento = window.__tkInstalar;
    if (!evento) return;
    evento.prompt();
    const { outcome } = await evento.userChoice;
    medir('instalar_app', { resultado: outcome });
    window.__tkInstalar = null;
    setInstalable(false);
    cerrar(outcome !== 'accepted');
  }

  if (!visible || !sistema) return null;

  return (
    <div className={`aviso-app cristal cristal-fijo${saliendo ? ' saliendo' : ''}`} role="dialog" aria-labelledby="aviso-app-titulo">
      <div className="aviso-app-cabecera">
        <img src="/icons/icon-192.png" alt="" width={44} height={44} />
        <div>
          <p id="aviso-app-titulo" className="aviso-app-titulo">{t('instalar.titulo')}</p>
          <p className="pequeno texto-2">{t('instalar.texto')}</p>
        </div>
      </div>

      {!instalable && (
        <ol className="aviso-app-pasos pequeno">
          {sistema === 'ios' ? (
            <>
              <li><Share size={18} aria-hidden />{t('instalar.ios1')}</li>
              <li><SquarePlus size={18} aria-hidden />{t('instalar.ios2')}</li>
            </>
          ) : (
            <>
              <li><EllipsisVertical size={18} aria-hidden />{t('instalar.android1')}</li>
              <li><SquarePlus size={18} aria-hidden />{t('instalar.android2')}</li>
            </>
          )}
        </ol>
      )}

      <div className="aviso-app-acciones">
        <button className="btn btn-s" onClick={() => cerrar()}>{t('instalar.ahoraNo')}</button>
        {instalable
          ? <button className="btn btn-s btn-primario" onClick={instalar}>{t('instalar.instalar')}</button>
          : <button className="btn btn-s btn-primario" onClick={() => cerrar()}>{t('instalar.entendido')}</button>}
      </div>
    </div>
  );
}
