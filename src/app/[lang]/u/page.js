"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, Mail, Settings, Flag, Store, Share } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { nombrePais, unirLugar } from '@/lib/paises';
import { formatFecha } from '@/lib/formatRelativeTime';
import { Avatar, Pestanas, Vacio, Cargando, useTostada } from '@/components/ui';
import Logros, { useLogros, LOGROS } from '@/components/perfil/Logros';
import Feed from '@/components/feed/Feed';
import TanqueCard from '@/components/tanques/TanqueCard';
import Lateral from '@/components/Lateral';
import Reportar from '@/components/Reportar';
import InvitacionRegistro from '@/components/InvitacionRegistro';
import Seguimientos, { SeguidoPor, cargarMisSeguidos, cargarComunes } from '@/components/perfil/Seguimientos';
import MarcaMuestra from '@/components/perfil/MarcaMuestra';

// Usa el índice de especies de la wiki: solo se descarga al abrir la lista
const EspeciesCuidadas = dynamic(() => import('@/components/perfil/EspeciesCuidadas'), { ssr: false });
const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function Perfil() {
  const n = useSearchParams().get('n')?.toLowerCase();
  const { usuario, cargando } = useSesion();
  const tostada = useTostada();
  const { t, locale } = useT();
  const [perfil, setPerfil] = useState(undefined);
  const [tanques, setTanques] = useState([]);
  const [tienda, setTienda] = useState(null);
  const [cuentas, setCuentas] = useState({ seguidores: 0, siguiendo: 0 });
  const [misSeguidos, setMisSeguidos] = useState(new Set());
  const [comunes, setComunes] = useState(null);
  const [lista, setLista] = useState(null);
  const [habitantes, setHabitantes] = useState([]);
  const [loSigo, setLoSigo] = useState(false);
  const [pestana, setPestana] = useState('tanques');
  const [reportando, setReportando] = useState(false);
  const [tanquesCargados, setTanquesCargados] = useState(false);
  const logros = useLogros(tanquesCargados ? perfil : null, tanques);

  useEffect(() => {
    if (!n || cargando) return;
    (async () => {
      const { data: p } = await supabase.from('perfiles').select('*').eq('usuario', n).maybeSingle();
      setPerfil(p);
      if (!p) return;
      document.title = `${p.nombre || p.usuario} (@${p.usuario}) · Tankily`;
      const [t, s1, s2, yo, ti, mios] = await Promise.all([
        supabase.from('tanques').select('id, nombre, tipo, litros, foto_url, visibilidad, idioma, creado_en').eq('usuario_id', p.id).order('creado_en'),
        supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', p.id),
        supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguidor_id', p.id),
        usuario ? supabase.from('seguidores').select('seguido_id').eq('seguidor_id', usuario.id).eq('seguido_id', p.id) : Promise.resolve({ data: [] }),
        supabase.from('tiendas').select('slug, nombre, verificada').eq('propietario_id', p.id).maybeSingle(),
        cargarMisSeguidos(usuario?.id),
      ]);
      setTanques(t.data || []);
      // Habitantes de sus tanques visibles, para "Cuida N especies"
      const ids = (t.data || []).map((tq) => tq.id);
      const { data: hs } = ids.length
        ? await supabase.from('habitantes').select('tanque_id, nombre, nombre_cientifico, categoria, cantidad, wiki_ruta').in('tanque_id', ids)
        : { data: [] };
      setHabitantes(hs || []);
      setTanquesCargados(true);
      setCuentas({ seguidores: s1.count || 0, siguiendo: s2.count || 0 });
      setMisSeguidos(mios);
      setComunes(usuario && usuario.id !== p.id ? await cargarComunes(p.id, mios, 3) : null);
      setLoSigo((yo.data || []).length > 0);
      setTienda(ti.data);
    })();
  }, [n, usuario, cargando]);

  if (!n) return <div className="contenido"><Vacio titulo={t('perfil.faltaUsuario')} /></div>;
  if (perfil === undefined) return <div className="contenido"><div className="columna"><Cargando alto={200} n={1} /><Cargando alto={160} n={2} /></div></div>;
  if (!perfil) return <div className="contenido"><div className="columna"><Vacio titulo={t('perfil.noExiste', { usuario: n })} accion={<Link href="/explorar/" className="btn">{t('perfil.buscarAcuaristas')}</Link>} /></div></div>;

  const esYo = usuario?.id === perfil.id;
  const numEspecies = new Set(habitantes.map((h) => normalizar(h.nombre_cientifico || h.nombre))).size;
  // 1.234 → "1,2 mil" / "1.2K" según el idioma, para que las cifras grandes quepan en el móvil
  const cifra = (n) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);

  // Compartir el perfil: menú nativo en móvil; en escritorio, copia el enlace
  async function compartir() {
    if (navigator.share) { try { await navigator.share({ url: location.href, title: perfil.nombre || perfil.usuario }); } catch {} }
    else { await navigator.clipboard.writeText(location.href); tostada(t('comun.enlaceCopiado')); }
  }

  // Seguir o dejar de seguir a cualquiera (este perfil o alguien de sus listas)
  async function cambiarSeguir(id) {
    if (!usuario) return tostada(t('perfil.entraSeguir'));
    const nuevo = !misSeguidos.has(id);
    setMisSeguidos((s) => { const c = new Set(s); if (nuevo) c.add(id); else c.delete(id); return c; });
    if (id === perfil.id) {
      setLoSigo(nuevo);
      setCuentas((c) => ({ ...c, seguidores: c.seguidores + (nuevo ? 1 : -1) }));
    } else if (esYo) {
      setCuentas((c) => ({ ...c, siguiendo: c.siguiendo + (nuevo ? 1 : -1) }));
    }
    if (nuevo) await supabase.from('seguidores').insert({ seguido_id: id });
    else await supabase.from('seguidores').delete().eq('seguidor_id', usuario.id).eq('seguido_id', id);
  }
  const alternarSeguir = () => cambiarSeguir(perfil.id);

  return (
    <div className="contenido">
      <div className="columna">
        <div className="perfil-portada" style={perfil.portada_url ? { backgroundImage: `url(${JSON.stringify(perfil.portada_url)})` } : undefined} />
        <div className="perfil-cabecera">
          <Avatar perfil={perfil} tamano={104} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-icono btn-s" onClick={compartir} aria-label={t('comun.compartir')}><Share size={16} /></button>
            {esYo ? (
              <>
                <Link href="/perfil/editar/" className="btn btn-s">{t('perfil.editar')}</Link>
                <Link href="/ajustes/" className="btn btn-icono btn-s" aria-label={t('perfil.ajustes')}><Settings size={16} /></Link>
              </>
            ) : (
              <>
                {usuario && <Link href={`/mensajes/?con=${perfil.id}`} className="btn btn-icono btn-s" aria-label={t('perfil.enviarMensaje')}><Mail size={16} /></Link>}
                <button className="btn btn-icono btn-s" onClick={() => setReportando(true)} aria-label={t('perfil.reportar')}><Flag size={16} /></button>
                <button className={`btn btn-s ${loSigo ? '' : 'btn-primario'}`} onClick={alternarSeguir}>{loSigo ? t('comun.siguiendo') : t('comun.seguir')}</button>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <h1 className="titulo-l">{perfil.nombre || perfil.usuario}</h1>
            <p className="texto-3">@{perfil.usuario}{perfil.nivel ? ` · ${t(`perfil.niveles.${perfil.nivel}`)}` : ''}{perfil.muestra && <> · <MarcaMuestra /></>}</p>
          </div>
          {perfil.bio && <p className="prosa">{perfil.bio}</p>}
          {!esYo && <SeguidoPor comunes={comunes} onAbrir={() => setLista('comun')} />}
          {/* Cifras como en Instagram: cuatro columnas iguales, número grande y etiqueta debajo. Los tanques
              que sigue no van aquí (eran una quinta columna que descuadraba): están en la lista de "siguiendo" */}
          <div className="cifras-perfil">
            {[
              ['tanques', tanques.length, null],
              ['especies', numEspecies, 'especies'],
              ['seguidores', cuentas.seguidores, 'seguidores'],
              ['siguiendo', cuentas.siguiendo, 'siguiendo'],
            ].map(([clave, n, abre]) => {
              const contenido = <><strong>{cifra(n)}</strong><span>{t(`seguimiento.cifras.${clave}`, { n })}</span></>;
              return abre
                ? <button key={clave} type="button" className="cifra-perfil" onClick={() => setLista(abre)}>{contenido}</button>
                : <span key={clave} className="cifra-perfil">{contenido}</span>;
            })}
          </div>
          <div className="perfil-meta texto-3 pequeno">
            {(perfil.provincia || perfil.pais) && <span><MapPin size={14} aria-hidden /> {unirLugar([perfil.provincia, nombrePais(perfil.pais, locale)])}</span>}
            <span>{t('perfil.desde', { fecha: formatFecha(perfil.creado_en) })}</span>
          </div>
          {tienda && (
            <Link href={`/tiendas/tienda/?s=${tienda.slug}`} className="chip" style={{ alignSelf: 'flex-start' }}><Store size={14} /> {tienda.nombre}</Link>
          )}
        </div>

        {!esYo && <InvitacionRegistro texto={t('invitacion.tanque', { nombre: perfil.nombre || `@${perfil.usuario}` })} />}

        <Pestanas etiqueta={t('perfil.pestanas')} valor={pestana} onCambio={setPestana} opciones={[['tanques', t('perfil.tanquesPestana')], ['publicaciones', t('perfil.publicaciones')], ['logros', `${t('logros.pestana')}${logros.conseguidos != null ? ` ${logros.conseguidos}/${LOGROS.length}` : ''}`]]} />

        {pestana === 'logros' ? <Logros datos={logros.datos} /> : pestana === 'tanques' ? (
          tanques.length === 0 ? (
            <Vacio titulo={esYo ? t('perfil.sinTanquesYo') : t('perfil.sinTanques')} accion={esYo && <Link href="/tanques/nuevo/" className="btn btn-primario">{t('perfil.anadirTanque')}</Link>} />
          ) : (
            <div className="rejilla-tarjetas">{tanques.map((tq) => <TanqueCard key={tq.id} tanque={tq} conAutor={false} />)}</div>
          )
        ) : (
          <Feed autorId={perfil.id} conPublicidad={false} vacio={<Vacio titulo={t('perfil.sinPublicaciones')} />} />
        )}

        {reportando && <Reportar tipo="perfil" objetoId={perfil.id} onCerrar={() => setReportando(false)} />}
        {lista === 'especies' && <EspeciesCuidadas perfil={perfil} habitantes={habitantes} tanques={tanques} onCerrar={() => setLista(null)} />}
        {lista && lista !== 'especies' && (
          <Seguimientos
            perfil={perfil}
            inicial={lista}
            miId={usuario?.id}
            misSeguidos={misSeguidos}
            onCambiarSeguir={cambiarSeguir}
            onCerrar={() => setLista(null)}
          />
        )}
      </div>
      <Lateral />
    </div>
  );
}

export default function PerfilPublicoPage() {
  return <Suspense><Perfil /></Suspense>;
}
