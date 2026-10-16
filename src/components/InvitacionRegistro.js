"use client";

import Link from '@/components/Enlace';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';

// Franja discreta para visitantes sin sesión en páginas que suelen llegar por un enlace compartido
// (un tanque, una tienda): dice qué ganan y lleva al registro. Con sesión no se pinta.
export default function InvitacionRegistro({ texto }) {
  const { usuario, cargando } = useSesion();
  const { t } = useT();
  if (cargando || usuario) return null;
  return (
    <aside className="invitacion-registro">
      <p className="pequeno">{texto}</p>
      <Link href="/registro/" className="btn btn-primario btn-s">{t('portada.crearCuenta')}</Link>
    </aside>
  );
}
