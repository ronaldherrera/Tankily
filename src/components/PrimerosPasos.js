"use client";

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';

const OCULTO = 'tk-pasos-oculto';

// Lista de bienvenida para quien acaba de llegar: seis pasos que convierten una cuenta vacía en
// alguien con un tanque vivo y gente a la que sigue. Cada paso se marca solo al cumplirse.
// Desaparece al completarlos (tras celebrarlo) o si el usuario la oculta.
export default function PrimerosPasos() {
  const { usuario, perfil } = useSesion();
  const { t } = useT();
  const [datos, setDatos] = useState(null);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    try { setOculto(localStorage.getItem(OCULTO) === '1'); } catch { setOculto(false); }
  }, []);

  useEffect(() => {
    if (!usuario || oculto) return;
    (async () => {
      const { data: tanques } = await supabase.from('tanques').select('id').eq('usuario_id', usuario.id).order('creado_en');
      const ids = (tanques || []).map((x) => x.id);
      const contar = (q) => q.then(({ count }) => count || 0);
      const [habitantes, mediciones, siguiendo, publicaciones] = await Promise.all([
        ids.length ? contar(supabase.from('habitantes').select('id', { count: 'exact', head: true }).in('tanque_id', ids)) : 0,
        ids.length ? contar(supabase.from('mediciones').select('id', { count: 'exact', head: true }).in('tanque_id', ids)) : 0,
        contar(supabase.from('seguidores').select('seguido_id', { count: 'exact', head: true }).eq('seguidor_id', usuario.id)),
        contar(supabase.from('publicaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', usuario.id)),
      ]);
      setDatos({ primerTanque: ids[0], tanques: ids.length, habitantes, mediciones, siguiendo, publicaciones });
    })();
  }, [usuario, oculto]);

  if (!usuario || oculto || !datos) return null;

  const enfocarCompositor = (e) => {
    const campo = document.querySelector('.compositor textarea');
    if (campo) { e.preventDefault(); campo.focus(); campo.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  };
  const tanque = datos.primerTanque ? `/tanque/?id=${datos.primerTanque}` : '/tanques/nuevo/';
  const pasos = [
    { clave: 'perfil', hecho: !!(perfil?.avatar_url && perfil?.bio), href: '/perfil/editar/' },
    { clave: 'tanque', hecho: datos.tanques > 0, href: '/tanques/nuevo/' },
    { clave: 'habitantes', hecho: datos.habitantes > 0, href: tanque },
    { clave: 'medicion', hecho: datos.mediciones > 0, href: tanque },
    { clave: 'seguir', hecho: datos.siguiendo >= 3, href: '/tanques/' },
    { clave: 'publicar', hecho: datos.publicaciones > 0, href: '/', alPulsar: enfocarCompositor },
  ];
  const hechos = pasos.filter((p) => p.hecho).length;
  const ocultar = () => { try { localStorage.setItem(OCULTO, '1'); } catch {} setOculto(true); };

  return (
    <section className="cristal primeros-pasos" aria-labelledby="pasos-titulo">
      <div className="primeros-pasos-cabecera">
        <h2 className="titulo-s" id="pasos-titulo">{t('pasos.titulo')}</h2>
        <span className="mini texto-3">{t('pasos.progreso', { hechos, total: pasos.length })}</span>
        <button type="button" className="btn btn-fantasma btn-icono btn-s" onClick={ocultar} aria-label={t('pasos.ocultar')} title={t('pasos.ocultar')}><X size={15} /></button>
      </div>
      <div className="primeros-pasos-barra" role="progressbar" aria-valuemin={0} aria-valuemax={pasos.length} aria-valuenow={hechos}>
        <span style={{ width: `${(hechos / pasos.length) * 100}%` }} />
      </div>
      {hechos === pasos.length ? (
        <p className="pequeno texto-2">{t('pasos.listo')}</p>
      ) : (
        <ol className="lista-pasos">
          {pasos.map((p) => (
            <li key={p.clave} className={p.hecho ? 'hecho' : ''}>
              <span className="paso-marca" aria-hidden="true">{p.hecho && <Check size={13} strokeWidth={3} />}</span>
              {p.hecho ? <span>{t(`pasos.${p.clave}`)}</span> : <Link href={p.href} onClick={p.alPulsar}>{t(`pasos.${p.clave}`)}</Link>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
