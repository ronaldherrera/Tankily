"use client";

import Link from '@/components/Enlace';
import { Lock, Users } from 'lucide-react';
import { colorAgua, imagenTanque } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { Avatar } from '@/components/ui';
import { enlaceTanque } from '@/lib/enlaces';

export default function TanqueCard({ tanque, conAutor = true }) {
  const { t, lang } = useT();
  const u = useUnidades();
  return (
    <Link href={enlaceTanque(tanque, lang)} className="tarjeta-tanque" style={{ '--agua': colorAgua(tanque.tipo) }}>
      <img src={imagenTanque(tanque)} alt="" loading="lazy" />
      {tanque.litros && <span className="tarjeta-tanque-litros cifra">{u.volumen(tanque.litros)}</span>}
      <div className="tarjeta-tanque-pie vidrio-tarjeta">
        <div style={{ minWidth: 0, flex: 1 }}>
          <span className="etiqueta-agua"><span>{t(`tipos.${tanque.tipo}`)}</span></span>
          <strong className="titulo-s" style={{ display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tanque.nombre}</strong>
          {/* De quién es (sin enlace propio: toda la tarjeta ya lleva al tanque) */}
          {conAutor && tanque.autor && (
            <span className="tarjeta-tanque-autor mini">
              <Avatar perfil={tanque.autor} tamano={20} />
              <span>{tanque.autor.nombre || `@${tanque.autor.usuario}`}</span>
            </span>
          )}
        </div>
        {tanque.visibilidad === 'privado' && <Lock size={16} className="texto-3" aria-label={t('tanques.privado')} />}
        {tanque.visibilidad === 'seguidores' && <Users size={16} className="texto-3" aria-label={t('tanques.soloSeguidores')} />}
      </div>
    </Link>
  );
}
