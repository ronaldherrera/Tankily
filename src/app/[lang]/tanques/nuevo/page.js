"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNavegar } from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { TIPOS_TANQUE, VISIBILIDADES, colorAgua } from '@/lib/constantes';
import { tareasIniciales, cambioAguaSugerido } from '@/lib/tareas';
import { RequiereSesion, SubidorImagenes, useTostada } from '@/components/ui';
import { evento } from '@/lib/analitica';

const EQUIPO = ['iluminacion', 'filtracion', 'calentador', 'skimmer', 'co2', 'sustrato'];

const VACIO = {
  nombre: '', tipo: 'comunidad', litros: '', largo_cm: '', ancho_cm: '', alto_cm: '', descripcion: '',
  equipo: {}, foto_url: '', montado_en: '', cambio_agua_cada_dias: '', visibilidad: 'publico',
};

function Formulario() {
  const { usuario, cargando } = useSesion();
  const { t } = useT();
  const u = useUnidades();
  const router = useNavegar();
  const tostada = useTostada();
  const id = useSearchParams().get('id');
  const [original, setOriginal] = useState(null);
  // Volumen y medidas se editan en la unidad del usuario; en la base de datos van en litros y cm
  const [tq, setTq] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase.from('tanques').select('*').eq('id', id).single().then(({ data }) => setOriginal(data));
  }, [id]);

  useEffect(() => {
    if (!original) return;
    const vacio = (v) => (v ?? '');
    setTq({
      ...VACIO,
      ...Object.fromEntries(Object.entries(original).map(([k, v]) => [k, v ?? ''])),
      litros: vacio(u.deLitros(original.litros)),
      largo_cm: vacio(u.deCm(original.largo_cm)),
      ancho_cm: vacio(u.deCm(original.ancho_cm)),
      alto_cm: vacio(u.deCm(original.alto_cm)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original, u.sistema]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion texto={t('formTanque.requiereSesion')} /></div>;

  const cambiar = (campo) => (e) => setTq({ ...tq, [campo]: e.target.value });
  const entero = (v) => (v === '' || v == null ? null : Number(v));
  // Con las tres medidas y sin volumen, se calcula el del cristal (se ve como sugerencia y se guarda)
  const [largo, ancho, alto] = [u.aCm(tq.largo_cm), u.aCm(tq.ancho_cm), u.aCm(tq.alto_cm)];
  const litrosEstimados = largo && ancho && alto ? Math.round((largo * ancho * alto) / 1000) : null;

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const fila = {
      nombre: tq.nombre.trim(),
      tipo: tq.tipo,
      litros: u.aLitros(tq.litros) ?? litrosEstimados,
      largo_cm: u.aCm(tq.largo_cm),
      ancho_cm: u.aCm(tq.ancho_cm),
      alto_cm: u.aCm(tq.alto_cm),
      descripcion: tq.descripcion.trim() || null,
      equipo: Object.fromEntries(Object.entries(tq.equipo || {}).filter(([, v]) => v?.trim())),
      foto_url: tq.foto_url || null,
      montado_en: tq.montado_en || null,
      // En un tanque nuevo, si no se indica, se sugiere una frecuencia según el tipo
      cambio_agua_cada_dias: entero(tq.cambio_agua_cada_dias) ?? (id ? null : cambioAguaSugerido(tq.tipo)),
      visibilidad: tq.visibilidad,
    };
    const res = id
      ? await supabase.from('tanques').update(fila).eq('id', id).select('id').single()
      : await supabase.from('tanques').insert(fila).select('id').single();
    if (!res.error && !id) {
      evento('tanque_creado', { tipo: tq.tipo });
      // Recordatorios sugeridos: cuentan desde hoy, salvo el test del agua (anima a la primera medición)
      const hoy = new Date().toISOString();
      await supabase.from('tareas').insert(tareasIniciales(tq.tipo).map((x) => ({ ...x, tanque_id: res.data.id, ultima_vez: x.tipo === 'test' ? null : hoy })));
    }
    setGuardando(false);
    if (res.error) {
      setError(t('comun.errorGuardar', { error: res.error.message }));
      return;
    }
    tostada(id ? t('formTanque.guardado') : t('formTanque.creado'));
    router.push(`/tanque/?id=${res.data.id}`);
  }

  async function borrar() {
    if (!window.confirm(t('formTanque.confirmarEliminar', { nombre: tq.nombre }))) return;
    const { error } = await supabase.from('tanques').delete().eq('id', id);
    if (!error) {
      tostada(t('formTanque.eliminado'));
      router.push('/tanques/');
    }
  }

  return (
    <div className="contenido" style={{ '--agua': colorAgua(tq.tipo) }}>
      <form className="columna" onSubmit={guardar} style={{ gap: 20 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{id ? t('formTanque.editar') : t('formTanque.nuevo')}</h1>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="campo">
            <span>{t('formTanque.nombre')}</span>
            <input className="entrada" required maxLength={60} value={tq.nombre} onChange={cambiar('nombre')} placeholder={t('formTanque.nombreEj')} />
          </label>

          <div className="campo">
            <span>{t('formTanque.tipo')}</span>
            <div className="selector-tipo" role="group" aria-label={t('formTanque.tipoTanque')}>
              {Object.entries(TIPOS_TANQUE).map(([clave, info]) => (
                <button type="button" key={clave} style={{ '--agua': info.agua }} aria-pressed={tq.tipo === clave} onClick={() => setTq({ ...tq, tipo: clave })}>
                  {t(`tipos.${clave}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="campo">
            <span>{t('formTanque.foto')}</span>
            <SubidorImagenes valor={tq.foto_url ? [tq.foto_url] : []} onCambio={(urls) => setTq({ ...tq, foto_url: urls[0] || '' })} maximo={1} carpeta="tanques" />
          </div>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="titulo-s">{t('formTanque.medidas')}</h2>
          <div className="fila-campos">
            <label className="campo"><span>{t('formTanque.volumen', { u: u.unidadVolumen })}</span><input className="entrada" type="number" min="0" step="any" inputMode="decimal" value={tq.litros} onChange={cambiar('litros')} placeholder={litrosEstimados ? `≈ ${Math.round(u.deLitros(litrosEstimados))}` : undefined} /></label>
            <label className="campo"><span>{t('formTanque.largo', { u: u.unidadLongitud })}</span><input className="entrada" type="number" min="0" step="any" value={tq.largo_cm} onChange={cambiar('largo_cm')} /></label>
            <label className="campo"><span>{t('formTanque.ancho', { u: u.unidadLongitud })}</span><input className="entrada" type="number" min="0" step="any" value={tq.ancho_cm} onChange={cambiar('ancho_cm')} /></label>
            <label className="campo"><span>{t('formTanque.alto', { u: u.unidadLongitud })}</span><input className="entrada" type="number" min="0" step="any" value={tq.alto_cm} onChange={cambiar('alto_cm')} /></label>
          </div>
          <div className="fila-campos">
            <label className="campo"><span>{t('formTanque.montado')}</span><input className="entrada" type="date" value={tq.montado_en} onChange={cambiar('montado_en')} /></label>
            <label className="campo">
              <span>{t('formTanque.cambioCada')}</span>
              <input className="entrada" type="number" min="1" max="90" value={tq.cambio_agua_cada_dias} onChange={cambiar('cambio_agua_cada_dias')} placeholder={t('formTanque.cambioEj')} />
              <small>{t('formTanque.teAvisaremos')}</small>
            </label>
          </div>
          <label className="campo">
            <span>{t('formTanque.descripcion')}</span>
            <textarea className="entrada" maxLength={2000} value={tq.descripcion} onChange={cambiar('descripcion')} placeholder={t('formTanque.descripcionEj')} />
          </label>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="titulo-s">{t('formTanque.equipo')}</h2>
          <div className="fila-campos">
            {EQUIPO.map((clave) => (
              <label key={clave} className="campo">
                <span>{t(`equipo.${clave}`)}</span>
                <input className="entrada" maxLength={120} placeholder={t(`equipo.${clave}Ej`)} value={tq.equipo?.[clave] || ''} onChange={(e) => setTq({ ...tq, equipo: { ...tq.equipo, [clave]: e.target.value } })} />
              </label>
            ))}
          </div>
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="titulo-s">{t('formTanque.quienVe')}</h2>
          {VISIBILIDADES.map((clave) => (
            <label key={clave} className="casilla">
              <input type="radio" name="visibilidad" checked={tq.visibilidad === clave} onChange={() => setTq({ ...tq, visibilidad: clave })} />
              <span><strong style={{ color: 'var(--texto)' }}>{t(`visibilidad.${clave}`)}</strong> — {t(`visibilidad.${clave}Ayuda`)}</span>
            </label>
          ))}
        </section>

        {error && <p className="aviso error">{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          {id ? <button type="button" className="btn btn-peligro" onClick={borrar}>{t('formTanque.eliminar')}</button> : <span />}
          <button className="btn btn-primario" disabled={guardando || !tq.nombre.trim()}>{guardando ? t('comun.guardando') : id ? t('comun.guardarCambios') : t('formTanque.crear')}</button>
        </div>
      </form>
    </div>
  );
}

export default function NuevoTanquePage() {
  return <Suspense><Formulario /></Suspense>;
}
