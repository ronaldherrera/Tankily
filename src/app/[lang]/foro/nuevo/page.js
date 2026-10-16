"use client";

import { useNavegar } from '@/components/Enlace';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { RequiereSesion, SubidorImagenes } from '@/components/ui';
import { FORO_CATEGORIAS } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { detectarIdioma } from '@/lib/traduccion';
import HilosParecidos from '@/components/foro/HilosParecidos';
import { mensajeError } from '@/lib/errores';

function NuevoHilo() {
  const params = useSearchParams();
  const router = useNavegar();
  const { t, lang } = useT();
  const { usuario, cargando } = useSesion();
  const [tanques, setTanques] = useState([]);
  const [f, setF] = useState({ categoria: params.get('c') || '', titulo: '', contenido: '', tanque_id: '', imagenes: [] });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) supabase.from('tanques').select('id, nombre').eq('usuario_id', usuario.id).then(({ data }) => setTanques(data || []));
  }, [usuario]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion texto={t('foro.nuevo.requiereSesion')} /></div>;

  async function publicar(e) {
    e.preventDefault();
    if (f.titulo.trim().length < 5) return setError(t('foro.nuevo.errorTitulo'));
    setEnviando(true);
    const { data, error } = await supabase.from('foro_hilos').insert({
      idioma: await detectarIdioma(`${f.titulo} ${f.contenido}`, lang),
      categoria: f.categoria,
      titulo: f.titulo.trim(),
      contenido: f.contenido.trim(),
      imagenes: f.imagenes,
      tanque_id: f.tanque_id ? Number(f.tanque_id) : null,
    }).select('id').single();
    setEnviando(false);
    if (error) return setError(mensajeError(error, t));
    router.push(`/foro/hilo/?id=${data.id}`);
  }

  return (
    <div className="contenido">
      <form className="columna" onSubmit={publicar} style={{ gap: 18 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{t('foro.nuevo.titulo')}</h1>
        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="campo">
            <span>{t('foro.nuevo.categoria')}</span>
            <select className="entrada" required value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
              <option value="" disabled>{t('foro.nuevo.elige')}</option>
              {FORO_CATEGORIAS.map((c) => <option key={c.slug} value={c.slug}>{t(`foro.grupos.${c.grupo}`)} · {t(`foro.categorias.${c.slug}.nombre`)}</option>)}
            </select>
          </label>
          <label className="campo">
            <span>{t('foro.nuevo.tituloCampo')}</span>
            <input className="entrada" required maxLength={140} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder={t('foro.nuevo.tituloEj')} />
          </label>
          <HilosParecidos titulo={f.titulo} />
          <label className="campo">
            <span>{t('foro.nuevo.mensaje')}</span>
            <textarea className="entrada" required maxLength={10000} rows={8} value={f.contenido} onChange={(e) => setF({ ...f, contenido: e.target.value })} placeholder={t('foro.nuevo.mensajeEj')} />
          </label>
          {tanques.length > 0 && (
            <label className="campo">
              <span>{t('foro.nuevo.adjuntarTanque')}</span>
              <select className="entrada" value={f.tanque_id} onChange={(e) => setF({ ...f, tanque_id: e.target.value })}>
                <option value="">{t('comun.ninguno')}</option>
                {tanques.map((tq) => <option key={tq.id} value={tq.id}>{tq.nombre}</option>)}
              </select>
              <small>{t('foro.nuevo.verTanque')}</small>
            </label>
          )}
          <SubidorImagenes valor={f.imagenes} onCambio={(imagenes) => setF({ ...f, imagenes })} carpeta="foro" />
        </section>
        {error && <p className="aviso error">{error}</p>}
        <button className="btn btn-primario" style={{ alignSelf: 'flex-end' }} disabled={enviando}>{enviando ? t('comun.publicando') : t('foro.nuevo.publicar')}</button>
      </form>
    </div>
  );
}

export default function NuevoHiloPage() {
  return <Suspense><NuevoHilo /></Suspense>;
}
