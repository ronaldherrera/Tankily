"use client";

import { useMemo } from 'react';
import { Plus, MessagesSquare } from 'lucide-react';
import Link from '@/components/Enlace';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { evento } from '@/lib/analitica';
import { especieDeFicha, prepararEspecie } from './AnadirATanque';

// Ficha de WikiTank, justo bajo los datos clave y solo para visitantes sin cuenta: la mayoría llega desde Google a leer
// una especie y se va. Esta invitación va ligada a lo que está leyendo: deja la especie preparada para su primer tanque
// (lib/tanquePendiente.js) y lleva al registro. En el móvil, "Añadir a mi tanque" del lateral queda al final de la ficha.
export default function InvitacionEspecie({ titulo, grupo, nombre }) {
  const { usuario, cargando } = useSesion();
  const { t } = useT();
  const datos = useMemo(() => especieDeFicha(titulo, grupo), [titulo, grupo]);
  if (cargando || usuario) return null;

  function preparar() {
    prepararEspecie(datos);
    evento('invitacion_especie');
  }

  return (
    <section className="invita-especie cristal-suave" aria-labelledby="invita-especie-titulo">
      <div>
        <h2 id="invita-especie-titulo" className="titulo-s">{t('invitaEspecie.titulo', { nombre })}</h2>
        <p className="pequeno texto-2">{t('invitaEspecie.texto')}</p>
      </div>
      <div className="invita-especie-acciones">
        <Link href="/registro/" className="btn btn-primario" onClick={preparar}><Plus size={16} aria-hidden="true" /> {t('invitaEspecie.boton')}</Link>
        <Link href="/foro/" className="btn btn-fantasma"><MessagesSquare size={16} aria-hidden="true" /> {t('invitaEspecie.foro')}</Link>
      </div>
    </section>
  );
}
