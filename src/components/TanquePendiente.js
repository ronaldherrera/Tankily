"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { leerPendiente, borrarPendiente, resumenPendiente } from '@/lib/tanquePendiente';

// Muro: quien preparó especies antes de registrarse (lib/tanquePendiente.js) vuelve aquí tras confirmar el email o
// entrar con Google/Apple. Se le recuerda y se le lleva a crear el tanque, que nace ya con ellas.
export default function TanquePendiente() {
  const { usuario } = useSesion();
  const { t } = useT();
  const [pendiente, setPendiente] = useState(null);
  useEffect(() => { if (usuario) setPendiente(leerPendiente()); }, [usuario]);
  if (!usuario || !pendiente) return null;

  const descartar = () => { borrarPendiente(); setPendiente(null); };
  return (
    <section className="cristal tanque-pendiente" aria-labelledby="pendiente-titulo">
      <h2 id="pendiente-titulo" className="titulo-s">{t('pendiente.titulo')}</h2>
      <p className="pequeno texto-2">{t('pendiente.texto', { lista: resumenPendiente(pendiente) })}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/tanques/nuevo/" className="btn btn-primario">{t('pendiente.crear')}</Link>
        <button type="button" className="btn btn-fantasma" onClick={descartar}>{t('pendiente.descartar')}</button>
      </div>
    </section>
  );
}
