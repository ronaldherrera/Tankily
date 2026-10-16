"use client";

import { LocateFixed, Navigation } from 'lucide-react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { formatNumero } from '@/lib/formatRelativeTime';

// "a 12 km" (redondeo según lo lejos que esté: de cerca importa el kilómetro, de lejos no).
// Si la posición es aproximada (centro de la provincia), nada de falsa precisión: "en tu zona" si está
// cerca y "a ~270 km" si no.
export function textoDistancia(km, t, aproximada = false) {
  if (km == null) return '';
  if (aproximada && km < 40) return t('distancia.enTuZona');
  if (km < 1) return t('distancia.menosDe1');
  const n = km < 100 ? Math.round(km) : Math.round(km / 10) * 10;
  const texto = formatNumero(n, 0);
  return t('distancia.km', { n: aproximada ? `~${texto}` : texto });
}

// Botón "Más cerca" del mercado y las tiendas, con lo que haga falta debajo: pedir la ubicación si no
// se sabe dónde está el usuario, o decir desde dónde se miden las distancias (y que son aproximadas).
export default function OrdenCercania({ activo, onCambio, ubicacion, aproximadas = false, conUsuario = false }) {
  const { t } = useT();
  const { punto, origen, lugar, estado, pedir } = ubicacion;
  return (
    <div className="orden-cercania">
      <button type="button" className={`chip${activo ? ' activo' : ''}`} aria-pressed={activo} onClick={() => onCambio(!activo)}>
        <Navigation size={13} aria-hidden="true" /> {t('distancia.masCerca')}
      </button>
      {activo && (
        <p className="mini texto-2">
          {!punto && <>{t('distancia.sinUbicacion')} </>}
          {punto && origen === 'perfil' && <>{t('distancia.desdePerfil', { lugar })} </>}
          {punto && origen === 'gps' && <>{t('distancia.desdeGps')} </>}
          {punto && aproximadas && <>{t('distancia.aproximadas')} </>}
          {estado === 'error' && <span style={{ color: 'var(--aviso)' }}>{t('distancia.errorUbicacion')} </span>}
          {origen !== 'gps' && (
            <button type="button" className="enlace" onClick={pedir} disabled={estado === 'pidiendo'}>
              <LocateFixed size={13} aria-hidden="true" /> {estado === 'pidiendo' ? t('distancia.ubicando') : t('distancia.usarUbicacion')}
            </button>
          )}
          {!punto && conUsuario && <> · <Link href="/perfil/editar/" className="enlace">{t('perfil.editar')}</Link></>}
        </p>
      )}
    </div>
  );
}
