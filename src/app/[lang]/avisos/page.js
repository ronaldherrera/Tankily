"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BellRing, CalendarDays, Loader2, MessageCircle, MessagesSquare, Sparkles } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { RequiereSesion, useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';
import { activarPush, desactivarPush, estadoPush } from '@/lib/push';
import { evento } from '@/lib/analitica';

// [columna de avisos_email, texto, icono]
const EMAIL = [['mensajes', 'mensajes', MessageCircle], ['foro', 'foro', MessagesSquare], ['resumen', 'resumen', CalendarDays]];
const PUSH = [['push_mensajes', 'mensajes', MessageCircle], ['push_foro', 'foro', MessagesSquare], ['push_actividad', 'actividad', Sparkles]];
const COLUMNAS = [...EMAIL, ...PUSH].map(([c]) => c);
const POR_DEFECTO = { mensajes: true, foro: true, resumen: false, push_mensajes: true, push_foro: true, push_actividad: true };
const AVISO_PUSH = { bloqueadas: 'avisos.pushBloqueadas', instalar: 'avisos.pushInstalar', no: 'avisos.pushNo' };
const TIPOS_BAJA = ['mensajes', 'foro', 'resumen', 'todo'];

// Baja con el enlace del correo: funciona sin iniciar sesión (el token solo sirve para quitar avisos)
function Baja({ token, tipo }) {
  const { t } = useT();
  const [estado, setEstado] = useState('cargando');
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    supabase.rpc('baja_avisos', { p_token: token, p_tipo: tipo })
      .then(({ data, error }) => setEstado(!error && data ? 'hecho' : 'error'));
  }, [token, tipo]);

  return (
    <div className="auth cristal cristal-refracta" style={{ textAlign: 'center' }}>
      {estado === 'cargando' ? <Loader2 size={28} className="girar" style={{ margin: '0 auto', color: 'var(--agua)' }} aria-hidden /> : (
        <>
          {estado === 'hecho' && <h1 className="titulo-l">{t('avisos.bajaTitulo')}</h1>}
          <p className="texto-2">{estado === 'hecho' ? t(`avisos.baja.${tipo}`) : t('avisos.bajaError')}</p>
          <Link href="/avisos/" className="btn btn-primario" style={{ alignSelf: 'center' }}>{t('avisos.gestionar')}</Link>
        </>
      )}
    </div>
  );
}

function Opcion({ clave, texto, Icono, prefs, onCambio }) {
  const { t } = useT();
  return (
    <label className="opcion-aviso">
      <Icono size={20} aria-hidden className="opcion-aviso-icono" />
      <span className="opcion-aviso-texto">
        <strong>{t(`avisos.${texto}`)}</strong>
        <span className="texto-2 pequeno">{t(`avisos.${texto}Texto`)}</span>
      </span>
      <input type="checkbox" role="switch" className="interruptor" disabled={!prefs}
        checked={!!prefs?.[clave]} onChange={(e) => onCambio(clave, e.target.checked)} />
    </label>
  );
}

function Preferencias() {
  const { usuario, cargando } = useSesion();
  const { t, lang } = useT();
  const tostada = useTostada();
  const [prefs, setPrefs] = useState(null);
  const [push, setPush] = useState(null); // estado de las push en este dispositivo
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    supabase.from('avisos_email').select(COLUMNAS.join(', ')).eq('usuario_id', usuario.id).maybeSingle()
      .then(({ data }) => setPrefs(data || POR_DEFECTO));
    estadoPush().then(setPush, () => setPush('no'));
  }, [usuario]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion /></div>;

  async function cambiar(clave, valor) {
    const antes = prefs;
    const nuevas = { ...prefs, [clave]: valor };
    setPrefs(nuevas);
    // El idioma se guarda a la vez: los avisos se escriben en el que usas en la web
    const { error } = await supabase.from('avisos_email')
      .upsert({ usuario_id: usuario.id, ...nuevas, idioma: lang }, { onConflict: 'usuario_id' });
    if (error) { setPrefs(antes); return tostada(error.message); }
    tostada(t('avisos.guardado'));
  }

  async function alternarPush() {
    setOcupado(true);
    try {
      const estado = push === 'activas' ? await desactivarPush() : await activarPush();
      setPush(estado);
      if (estado === 'activas') { tostada(t('avisos.pushActivadas')); evento('push_activado'); }
    } catch (e) {
      tostada(t('avisos.pushError', { error: e.message }));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 20 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{t('avisos.titulo')}</h1>
        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="titulo-s">{t('avisos.emailTitulo')}</h2>
          <p className="texto-2 pequeno">{t('avisos.intro')}</p>
          {EMAIL.map(([clave, texto, Icono]) => <Opcion key={clave} clave={clave} texto={texto} Icono={Icono} prefs={prefs} onCambio={cambiar} />)}
        </section>

        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="titulo-s">{t('avisos.pushTitulo')}</h2>
          <p className="texto-2 pequeno">{t('avisos.pushTexto')}</p>
          {AVISO_PUSH[push] && <p className="texto-2 pequeno">{t(AVISO_PUSH[push])}</p>}
          {(push === 'activas' || push === 'inactivas') && (
            <button className={`btn btn-s ${push === 'activas' ? '' : 'btn-primario'}`} style={{ alignSelf: 'flex-start', position: 'relative', zIndex: 2 }}
              disabled={ocupado} onClick={alternarPush}>
              {ocupado ? <Loader2 size={16} className="girar" aria-hidden /> : <BellRing size={16} aria-hidden />}
              {t(push === 'activas' ? 'avisos.pushDesactivar' : 'avisos.pushActivar')}
            </button>
          )}
          {push === 'activas' && (
            <div className="despliega" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {PUSH.map(([clave, texto, Icono]) => <Opcion key={clave} clave={clave} texto={texto} Icono={Icono} prefs={prefs} onCambio={cambiar} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Avisos() {
  const params = useSearchParams();
  const token = params.get('baja');
  const tipo = TIPOS_BAJA.includes(params.get('tipo')) ? params.get('tipo') : 'todo';
  return token ? <Baja token={token} tipo={tipo} /> : <Preferencias />;
}

export default function AvisosPage() {
  return <Suspense><Avisos /></Suspense>;
}
