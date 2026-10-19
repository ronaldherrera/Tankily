"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Loader2, MessageCircle, MessagesSquare } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { RequiereSesion, useTostada } from '@/components/ui';
import { useT } from '@/i18n/IdiomaProvider';

const OPCIONES = [['mensajes', MessageCircle], ['foro', MessagesSquare], ['resumen', CalendarDays]];
const POR_DEFECTO = { mensajes: true, foro: true, resumen: false };
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

function Preferencias() {
  const { usuario, cargando } = useSesion();
  const { t, lang } = useT();
  const tostada = useTostada();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    supabase.from('avisos_email').select('mensajes, foro, resumen').eq('usuario_id', usuario.id).maybeSingle()
      .then(({ data }) => setPrefs(data || POR_DEFECTO));
  }, [usuario]);

  if (cargando) return null;
  if (!usuario) return <div className="contenido"><RequiereSesion /></div>;

  async function cambiar(clave, valor) {
    const antes = prefs;
    const nuevas = { ...prefs, [clave]: valor };
    setPrefs(nuevas);
    // El idioma se guarda a la vez: los correos se escriben en el que usas en la web
    const { error } = await supabase.from('avisos_email')
      .upsert({ usuario_id: usuario.id, ...nuevas, idioma: lang }, { onConflict: 'usuario_id' });
    if (error) { setPrefs(antes); return tostada(error.message); }
    tostada(t('avisos.guardado'));
  }

  return (
    <div className="contenido">
      <div className="columna" style={{ gap: 20 }}>
        <h1 className="titulo-l" style={{ paddingTop: 12 }}>{t('avisos.titulo')}</h1>
        <section className="cristal" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="texto-2 pequeno">{t('avisos.intro')}</p>
          {OPCIONES.map(([clave, Icono]) => (
            <label key={clave} className="opcion-aviso">
              <Icono size={20} aria-hidden className="opcion-aviso-icono" />
              <span className="opcion-aviso-texto">
                <strong>{t(`avisos.${clave}`)}</strong>
                <span className="texto-2 pequeno">{t(`avisos.${clave}Texto`)}</span>
              </span>
              <input type="checkbox" role="switch" className="interruptor" disabled={!prefs}
                checked={!!prefs?.[clave]} onChange={(e) => cambiar(clave, e.target.checked)} />
            </label>
          ))}
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
