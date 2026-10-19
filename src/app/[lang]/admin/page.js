"use client";

// Panel de administración: resumen, denuncias, tiendas (Pro y verificación) y campañas propias.
// Solo para perfiles con es_admin. Los cambios protegidos van por funciones admin_* de la base de
// datos, que vuelven a comprobar que quien llama es administrador.
// Es una herramienta interna: sus textos están en español e inglés aquí mismo, no en los diccionarios.
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Trash2, Check, X, BadgeCheck, Crown, Eye } from 'lucide-react';
import Link from '@/components/Enlace';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { Pestanas, Vacio, Cargando, useTostada } from '@/components/ui';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import Selector from '@/components/Selector';
import { useSearchParams } from 'next/navigation';

const TEXTOS = {
  es: {
    titulo: 'Administración', soloAdmin: 'Esta sección es solo para administradores.',
    resumen: 'Resumen', denuncias: 'Denuncias', tiendas: 'Tiendas', campanas: 'Campañas',
    crecimiento: 'Crecimiento', activosDia: 'Activos hoy', activosSemana: 'Activos 7 días', activosMes: 'Activos 30 días', reales: 'Usuarios reales',
    pegajosidad: 'Vuelven a diario', pegajosidadAyuda: 'Activos hoy / activos 30 días. Por encima del 20 % es muy bueno.',
    embudo: 'Embudo de activación', embudoAyuda: 'Dónde se queda la gente. El paso con más caída es el primero que hay que mejorar.',
    pasoRegistro: 'Se registran', pasoTanque: 'Crean un tanque', pasoApunta: 'Apuntan mediciones o eventos', pasoParticipa: 'Participan (publican, comentan, foro)', pasoVuelve: 'Vuelven tras la primera semana',
    mayorCaida: 'Mayor caída', semanas: 'Altas y activos por semana', altas: 'Altas', activos: 'Activos',
    cohortes: 'Retención por semana de registro', cohortesAyuda: '% de cada grupo que volvió en la semana 1, 2, 3 y 4 después de registrarse.', semana: 'Semana', personas: 'Personas', sem: 'S{n}',
    conPush: 'Con notificaciones push', conResumen: 'Con resumen semanal', sinDatos: 'Aún no hay datos: se empiezan a apuntar desde hoy.',
    usuarios: 'Usuarios', usuarios7d: 'Nuevos esta semana', tanques: 'Tanques', publicaciones7d: 'Publicaciones esta semana',
    hilos7d: 'Hilos esta semana', anunciosActivos: 'Anuncios activos', tiendasPro: 'Tiendas Pro', reportesPendientes: 'Denuncias pendientes',
    sinDenuncias: 'No hay denuncias pendientes.', verContenido: 'Ver', borrar: 'Borrar contenido', revisado: 'Revisada', descartar: 'Descartar', mostrar: 'Volver a mostrar', mostrado: 'Contenido visible de nuevo; denuncias descartadas.',
    borrado: 'Contenido borrado', confirmarBorrar: '¿Borrar este contenido? No se puede deshacer.',
    motivo: { spam: 'Spam', ofensivo: 'Ofensivo', fraude: 'Fraude', maltrato_animal: 'Maltrato animal', especie_protegida: 'Especie protegida', otro: 'Otro' },
    denunciadoPor: 'denunciado por @{u}',
    plan: 'Plan', proHasta: 'Pro hasta', verificada: 'Verificada', activarPro: 'Activar Pro 1 año y verificar', quitarPro: 'Quitar Pro',
    verificar: 'Verificar', quitarVerificacion: 'Quitar verificación', guardado: 'Guardado',
    nuevaCampana: 'Nueva campaña', tituloCampana: 'Título', texto: 'Texto', imagen: 'URL de la imagen', enlace: 'Enlace',
    ubicacion: 'Ubicación', prioridad: 'Prioridad', fin: 'Termina el', tienda: 'Tienda (opcional)', ninguna: 'Ninguna',
    crear: 'Crear campaña', activa: 'Activa', pausada: 'Pausada', activar: 'Activar', pausar: 'Pausar', sinCampanas: 'Aún no hay campañas.',
  },
  en: {
    titulo: 'Administration', soloAdmin: 'This section is for administrators only.',
    resumen: 'Overview', denuncias: 'Reports', tiendas: 'Stores', campanas: 'Campaigns',
    crecimiento: 'Growth', activosDia: 'Active today', activosSemana: 'Active 7 days', activosMes: 'Active 30 days', reales: 'Real users',
    pegajosidad: 'Come back daily', pegajosidadAyuda: 'Active today / active 30 days. Above 20% is very good.',
    embudo: 'Activation funnel', embudoAyuda: 'Where people drop off. Fix the step with the biggest drop first.',
    pasoRegistro: 'Sign up', pasoTanque: 'Create a tank', pasoApunta: 'Log measurements or events', pasoParticipa: 'Take part (post, comment, forum)', pasoVuelve: 'Come back after week one',
    mayorCaida: 'Biggest drop', semanas: 'Sign-ups and active users per week', altas: 'Sign-ups', activos: 'Active',
    cohortes: 'Retention by sign-up week', cohortesAyuda: '% of each group that came back in week 1, 2, 3 and 4 after signing up.', semana: 'Week', personas: 'People', sem: 'W{n}',
    conPush: 'With push notifications', conResumen: 'With weekly digest', sinDatos: 'No data yet: tracking starts today.',
    usuarios: 'Users', usuarios7d: 'New this week', tanques: 'Tanks', publicaciones7d: 'Posts this week',
    hilos7d: 'Threads this week', anunciosActivos: 'Active listings', tiendasPro: 'Pro stores', reportesPendientes: 'Pending reports',
    sinDenuncias: 'No pending reports.', verContenido: 'View', borrar: 'Delete content', revisado: 'Reviewed', descartar: 'Dismiss', mostrar: 'Show again', mostrado: 'Content visible again; reports dismissed.',
    borrado: 'Content deleted', confirmarBorrar: 'Delete this content? This can’t be undone.',
    motivo: { spam: 'Spam', ofensivo: 'Offensive', fraude: 'Fraud', maltrato_animal: 'Animal cruelty', especie_protegida: 'Protected species', otro: 'Other' },
    denunciadoPor: 'reported by @{u}',
    plan: 'Plan', proHasta: 'Pro until', verificada: 'Verified', activarPro: 'Activate Pro for 1 year and verify', quitarPro: 'Remove Pro',
    verificar: 'Verify', quitarVerificacion: 'Remove verification', guardado: 'Saved',
    nuevaCampana: 'New campaign', tituloCampana: 'Title', texto: 'Text', imagen: 'Image URL', enlace: 'Link',
    ubicacion: 'Placement', prioridad: 'Priority', fin: 'Ends on', tienda: 'Store (optional)', ninguna: 'None',
    crear: 'Create campaign', activa: 'Active', pausada: 'Paused', activar: 'Activate', pausar: 'Pause', sinCampanas: 'No campaigns yet.',
  },
};

// Tabla y enlace de cada tipo de contenido denunciable
const OBJETO = {
  publicacion: { tabla: 'publicaciones', enlace: (id) => `/post/?id=${id}` },
  comentario: { tabla: 'comentarios' },
  hilo: { tabla: 'foro_hilos', enlace: (id) => `/foro/hilo/?id=${id}` },
  respuesta: { tabla: 'foro_respuestas' },
  anuncio: { tabla: 'anuncios', enlace: (id) => `/mercado/anuncio/?id=${id}` },
  perfil: {},
  tienda: {},
  mensaje: {},
};

function Resumen({ x }) {
  const [r, setR] = useState(null);
  useEffect(() => { supabase.rpc('admin_resumen').then(({ data }) => setR(data)); }, []);
  if (!r) return <Cargando alto={90} n={2} />;
  const cifras = [['usuarios', r.usuarios], ['usuarios7d', r.usuarios_7d], ['tanques', r.tanques], ['publicaciones7d', r.publicaciones_7d],
    ['hilos7d', r.hilos_7d], ['anunciosActivos', r.anuncios_activos], ['tiendasPro', `${r.tiendas_pro} / ${r.tiendas}`], ['reportesPendientes', r.reportes_pendientes]];
  return (
    <div className="admin-cifras">
      {cifras.map(([k, v]) => <div key={k} className={k === 'reportesPendientes' && r.reportes_pendientes > 0 ? 'alerta' : ''}><span className="cifra">{v}</span><span className="mini texto-3">{x[k]}</span></div>)}
    </div>
  );
}

const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);

// Enganche: activos, embudo de activación, altas por semana y retención (admin_crecimiento)
function Crecimiento({ x }) {
  const { locale } = useT();
  const [c, setC] = useState(null);
  useEffect(() => { supabase.rpc('admin_crecimiento').then(({ data }) => setC(data)); }, []);
  if (!c) return <Cargando alto={90} n={3} />;

  const { activos: a, embudo: e } = c;
  const pasos = [['pasoRegistro', e.registro, e.registro], ['pasoTanque', e.tanque, e.registro], ['pasoApunta', e.apunta, e.registro],
    ['pasoParticipa', e.participa, e.registro], ['pasoVuelve', e.vuelve, e.vuelve_base]];
  // El paso que más gente pierde respecto al anterior (sin el de volver, que se mide sobre otra base)
  let caida = null;
  for (let i = 1; i < 4; i++) {
    const perdida = pct(pasos[i - 1][1], e.registro) - pct(pasos[i][1], e.registro);
    if (perdida > 0 && (!caida || perdida > caida.perdida)) caida = { i, perdida };
  }
  const maxSemana = Math.max(1, ...c.semanas.map((s) => Math.max(s.altas, s.activos)));
  const fecha = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="admin-cifras">
        {[['activosDia', a.dia], ['activosSemana', a.semana], ['activosMes', a.mes], ['reales', a.total]].map(([k, v]) =>
          <div key={k}><span className="cifra">{v}</span><span className="mini texto-3">{x[k]}</span></div>)}
        <div title={x.pegajosidadAyuda}><span className="cifra">{pct(a.dia, a.mes)} %</span><span className="mini texto-3">{x.pegajosidad}</span></div>
      </div>

      <section className="cristal-suave admin-bloque">
        <h2 className="titulo-s">{x.embudo}</h2>
        <p className="mini texto-3">{x.embudoAyuda}</p>
        <ol className="embudo">
          {pasos.map(([k, n, base], i) => (
            <li key={k} className={caida?.i === i ? 'caida' : undefined}>
              <div className="embudo-fila"><span>{x[k]}</span><span><strong>{n}</strong> <span className="texto-3">· {pct(n, base)} %</span></span></div>
              <div className="embudo-barra"><span style={{ width: `${pct(n, base)}%` }} /></div>
              {caida?.i === i && <span className="mini embudo-caida">{x.mayorCaida}: −{caida.perdida} %</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="cristal-suave admin-bloque">
        <h2 className="titulo-s">{x.semanas}</h2>
        <div className="grafico-semanas" role="img" aria-label={x.semanas}>
          {c.semanas.map((s) => (
            <div key={s.semana} title={`${fecha(s.semana)} · ${x.altas}: ${s.altas} · ${x.activos}: ${s.activos}`}>
              <span className="barra-activos" style={{ height: `${(100 * s.activos) / maxSemana}%` }} />
              <span className="barra-altas" style={{ height: `${(100 * s.altas) / maxSemana}%` }} />
            </div>
          ))}
        </div>
        <p className="mini texto-3 leyenda-semanas"><span className="punto-altas" /> {x.altas} <span className="punto-activos" /> {x.activos}</p>
      </section>

      <section className="cristal-suave admin-bloque">
        <h2 className="titulo-s">{x.cohortes}</h2>
        <p className="mini texto-3">{x.cohortesAyuda}</p>
        {c.cohortes?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabla-cohortes">
              <thead><tr><th>{x.semana}</th><th>{x.personas}</th>{[1, 2, 3, 4].map((n) => <th key={n}>{x.sem.replace('{n}', n)}</th>)}</tr></thead>
              <tbody>
                {c.cohortes.map((k) => (
                  <tr key={k.semana}>
                    <td>{fecha(k.semana)}</td><td>{k.personas}</td>
                    {k.retencion.map((v, i) => <td key={i} style={v == null ? undefined : { background: `rgba(var(--c-tinta), ${0.05 + v / 140})` }}>{v == null ? '·' : `${v} %`}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="texto-2 pequeno">{x.sinDatos}</p>}
      </section>

      <div className="admin-cifras">
        <div><span className="cifra">{c.avisos.push}</span><span className="mini texto-3">{x.conPush}</span></div>
        <div><span className="cifra">{c.avisos.resumen}</span><span className="mini texto-3">{x.conResumen}</span></div>
      </div>
    </div>
  );
}

function Denuncias({ x }) {
  const tostada = useTostada();
  const [lista, setLista] = useState(null);
  const cargar = useCallback(() => {
    supabase.from('reportes').select('*, autor:perfiles!usuario_id(usuario)').eq('estado', 'pendiente').order('creado_en', { ascending: false }).limit(100)
      .then(({ data }) => setLista(data || []));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function estado(r, nuevo) {
    await supabase.from('reportes').update({ estado: nuevo }).eq('id', r.id);
    setLista((l) => l.filter((y) => y.id !== r.id));
  }
  // Con 5 denuncias el contenido se oculta solo (ver migración de moderación); si eran injustas, se vuelve
  // a mostrar y se descartan todas sus denuncias pendientes
  async function mostrar(r) {
    const { error } = await supabase.rpc('admin_mostrar', { p_tipo: r.tipo, p_id: Number(r.objeto_id), p_visible: true });
    if (error) return tostada(error.message);
    await supabase.from('reportes').update({ estado: 'descartado' }).eq('tipo', r.tipo).eq('objeto_id', r.objeto_id).eq('estado', 'pendiente');
    tostada(x.mostrado);
    cargar();
  }
  async function borrar(r) {
    if (!window.confirm(x.confirmarBorrar)) return;
    const { error } = await supabase.from(OBJETO[r.tipo].tabla).delete().eq('id', r.objeto_id);
    if (error) return tostada(error.message);
    await supabase.from('reportes').update({ estado: 'revisado' }).eq('tipo', r.tipo).eq('objeto_id', r.objeto_id);
    tostada(x.borrado);
    cargar();
  }

  if (!lista) return <Cargando alto={70} n={3} />;
  if (!lista.length) return <Vacio titulo={x.sinDenuncias} />;
  return (
    <ul className="admin-lista">
      {lista.map((r) => {
        const o = OBJETO[r.tipo] || {};
        return (
          <li key={r.id} className="cristal-suave">
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{x.motivo[r.motivo] || r.motivo}</strong> <span className="chip">{r.tipo} #{r.objeto_id.slice(0, 8)}</span>
              {r.detalle && <p className="pequeno texto-2" style={{ marginTop: 4 }}>{r.detalle}</p>}
              <p className="mini texto-3">{x.denunciadoPor.replace('{u}', r.autor?.usuario || '?')} · {formatRelativeTime(r.creado_en)}</p>
            </div>
            <div className="admin-acciones">
              {o.enlace && <Link href={o.enlace(r.objeto_id)} className="btn btn-s" target="_blank">{x.verContenido}</Link>}
              {o.tabla && <button type="button" className="btn btn-s" onClick={() => mostrar(r)}><Eye size={14} /> {x.mostrar}</button>}
              {o.tabla && <button type="button" className="btn btn-s btn-peligro" onClick={() => borrar(r)}><Trash2 size={14} /> {x.borrar}</button>}
              <button type="button" className="btn btn-s" onClick={() => estado(r, 'revisado')}><Check size={14} /> {x.revisado}</button>
              <button type="button" className="btn btn-s btn-fantasma" onClick={() => estado(r, 'descartado')}><X size={14} /> {x.descartar}</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Tiendas({ x }) {
  const tostada = useTostada();
  const [lista, setLista] = useState(null);
  const cargar = useCallback(() => {
    supabase.from('tiendas').select('id, slug, nombre, ciudad, pais, plan, pro_hasta, verificada, num_resenas, valoracion').order('creado_en', { ascending: false })
      .then(({ data }) => setLista(data || []));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function cambiar(ti, cambios) {
    const fila = { plan: ti.plan, pro_hasta: ti.pro_hasta, verificada: ti.verificada, ...cambios };
    const { error } = await supabase.rpc('admin_tienda', { p_tienda: ti.id, p_plan: fila.plan, p_pro_hasta: fila.pro_hasta, p_verificada: fila.verificada });
    if (error) return tostada(error.message);
    tostada(x.guardado);
    cargar();
  }
  const enUnAno = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); };

  if (!lista) return <Cargando alto={70} n={3} />;
  return (
    <ul className="admin-lista">
      {lista.map((ti) => (
        <li key={ti.id} className="cristal-suave">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/tiendas/tienda/?s=${ti.slug}`} target="_blank"><strong>{ti.nombre}</strong></Link>
            {ti.verificada && <BadgeCheck size={15} style={{ color: 'var(--agua)', marginLeft: 6, verticalAlign: '-2px' }} />}
            <p className="mini texto-3">{ti.ciudad} · {ti.pais} · {ti.valoracion}★ ({ti.num_resenas})</p>
            <p className="mini">{x.plan}: <b>{ti.plan === 'pro' ? 'Pro' : 'Gratis'}</b>{ti.pro_hasta && <> · {x.proHasta} {ti.pro_hasta}</>}</p>
          </div>
          <div className="admin-acciones">
            {ti.plan === 'pro'
              ? <button type="button" className="btn btn-s btn-fantasma" onClick={() => cambiar(ti, { plan: 'gratis', pro_hasta: null })}>{x.quitarPro}</button>
              : <button type="button" className="btn btn-s btn-primario" onClick={() => cambiar(ti, { plan: 'pro', pro_hasta: enUnAno(), verificada: true })}><Crown size={14} /> {x.activarPro}</button>}
            <button type="button" className="btn btn-s" onClick={() => cambiar(ti, { verificada: !ti.verificada })}>{ti.verificada ? x.quitarVerificacion : x.verificar}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const UBICACIONES = ['feed', 'lateral', 'mercado', 'foro', 'tiendas', 'wiki'];

function Campanas({ x }) {
  const tostada = useTostada();
  const [lista, setLista] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [f, setF] = useState({ titulo: '', texto: '', imagen_url: '', enlace: '', ubicacion: 'feed', prioridad: 0, fin: '', tienda_id: '' });
  const cargar = useCallback(() => {
    supabase.from('campanas').select('*, tienda:tiendas(nombre)').order('creado_en', { ascending: false }).then(({ data }) => setLista(data || []));
  }, []);
  useEffect(() => {
    cargar();
    supabase.from('tiendas').select('id, nombre').order('nombre').then(({ data }) => setTiendas(data || []));
  }, [cargar]);

  async function crear(e) {
    e.preventDefault();
    const { error } = await supabase.from('campanas').insert({
      titulo: f.titulo.trim(), texto: f.texto.trim() || null, imagen_url: f.imagen_url.trim() || null, enlace: f.enlace.trim(),
      ubicacion: f.ubicacion, prioridad: Number(f.prioridad) || 0, fin: f.fin || null, tienda_id: f.tienda_id ? Number(f.tienda_id) : null,
    });
    if (error) return tostada(error.message);
    setF({ ...f, titulo: '', texto: '', imagen_url: '', enlace: '' });
    tostada(x.guardado);
    cargar();
  }
  async function alternar(c) {
    await supabase.from('campanas').update({ activa: !c.activa }).eq('id', c.id);
    cargar();
  }
  const campo = (k, props = {}) => <input className="entrada" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...props} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form onSubmit={crear} className="cristal-suave" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="titulo-s">{x.nuevaCampana}</h2>
        <div className="fila-campos">
          <label className="campo"><span>{x.tituloCampana}</span>{campo('titulo', { required: true, maxLength: 80 })}</label>
          <label className="campo"><span>{x.enlace}</span>{campo('enlace', { required: true, placeholder: '/es/tiendas/tienda/?s=…' })}</label>
        </div>
        <label className="campo"><span>{x.texto}</span>{campo('texto', { maxLength: 200 })}</label>
        <div className="fila-campos">
          <label className="campo"><span>{x.imagen}</span>{campo('imagen_url')}</label>
          <label className="campo"><span>{x.ubicacion}</span>
            <Selector className="entrada" value={f.ubicacion} onChange={(e) => setF({ ...f, ubicacion: e.target.value })}>{UBICACIONES.map((u) => <option key={u}>{u}</option>)}</Selector>
          </label>
        </div>
        <div className="fila-campos">
          <label className="campo"><span>{x.tienda}</span>
            <Selector className="entrada" value={f.tienda_id} onChange={(e) => setF({ ...f, tienda_id: e.target.value })}>
              <option value="">{x.ninguna}</option>{tiendas.map((ti) => <option key={ti.id} value={ti.id}>{ti.nombre}</option>)}
            </Selector>
          </label>
          <label className="campo"><span>{x.prioridad}</span>{campo('prioridad', { type: 'number' })}</label>
          <label className="campo"><span>{x.fin}</span>{campo('fin', { type: 'date' })}</label>
        </div>
        <button className="btn btn-primario" style={{ alignSelf: 'flex-start' }}>{x.crear}</button>
      </form>
      {!lista ? <Cargando alto={60} n={2} /> : !lista.length ? <Vacio titulo={x.sinCampanas} /> : (
        <ul className="admin-lista">
          {lista.map((c) => (
            <li key={c.id} className="cristal-suave">
              {c.imagen_url && <img loading="lazy" src={c.imagen_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{c.titulo}</strong> <span className="chip">{c.ubicacion}</span>
                <p className="mini texto-3">{c.tienda?.nombre || '—'} · {c.activa ? x.activa : x.pausada}{c.fin && <> · {x.fin} {c.fin}</>}</p>
              </div>
              <button type="button" className="btn btn-s" onClick={() => alternar(c)}>{c.activa ? x.pausar : x.activar}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PESTANAS = ['resumen', 'crecimiento', 'denuncias', 'tiendas', 'campanas'];

export default function AdminPage() {
  return <Suspense><Admin /></Suspense>;
}

function Admin() {
  const { perfil, cargando } = useSesion();
  const { lang } = useT();
  const x = TEXTOS[lang] || TEXTOS.en;
  // La pestaña puede venir en el enlace (?s=denuncias), p. ej. desde la burbuja de administración
  const s = useSearchParams().get('s');
  const [pestana, setPestana] = useState(PESTANAS.includes(s) ? s : 'resumen');
  const [sPrevio, setSPrevio] = useState(s);
  if (s !== sPrevio) { setSPrevio(s); if (PESTANAS.includes(s)) setPestana(s); }

  if (cargando) return null;
  if (!perfil?.es_admin) return <div className="contenido"><div className="columna"><Vacio titulo={x.soloAdmin} /></div></div>;

  return (
    <div className="contenido ancho">
      <div className="columna">
        <h1 className="titulo-l" style={{ paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}><ShieldCheck size={26} style={{ color: 'var(--agua)' }} /> {x.titulo}</h1>
        <Pestanas etiqueta={x.titulo} valor={pestana} onCambio={setPestana}
          opciones={[['resumen', x.resumen], ['crecimiento', x.crecimiento], ['denuncias', x.denuncias], ['tiendas', x.tiendas], ['campanas', x.campanas]]} />
        {pestana === 'resumen' && <Resumen x={x} />}
        {pestana === 'crecimiento' && <Crecimiento x={x} />}
        {pestana === 'denuncias' && <Denuncias x={x} />}
        {pestana === 'tiendas' && <Tiendas x={x} />}
        {pestana === 'campanas' && <Campanas x={x} />}
      </div>
    </div>
  );
}
