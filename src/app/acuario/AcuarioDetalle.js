"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

export default function AcuarioDetalle({ id }) {
  const [acuario, setAcuario] = useState(null);
  const [habitantes, setHabitantes] = useState([]);
  const [mediciones, setMediciones] = useState([]);
  const [esDuenio, setEsDuenio] = useState(false);
  const [siguiendoAcuario, setSiguiendoAcuario] = useState(false);
  const [siguiendoAlPropietario, setSiguiendoAlPropietario] = useState(false);
  const [seguidoresCount, setSeguidoresCount] = useState(0);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estados para Respuestas e Hilos
  const [respuestasAbiertas, setRespuestasAbiertas] = useState({});
  const [respuestasPorComentario, setRespuestasPorComentario] = useState({});
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');

  // Formulario nuevo habitante
  const [nombreH, setNombreH] = useState('');
  const [cantidadH, setCantidadH] = useState(1);
  const [tipoH, setTipoH] = useState('Pez');

  // Formulario nueva medición
  const [parametroM, setParametroM] = useState('pH');
  const [valorM, setValorM] = useState('');
  const [publicarM, setPublicarM] = useState(true); // Por defecto activo para fomentar comunidad

  useEffect(() => {
    async function cargarTodo() {
      const { data: { user } } = await supabase.auth.getUser();
      const numId = Number(id);
      
      const { data: a } = await supabase.from('acuarios').select('*').eq('id', numId).single();
      if (!a) return setCargando(false);

      setAcuario(a);
      const duenio = user?.id === a?.usuario_id;
      setEsDuenio(duenio);

      const { data: h } = await supabase.from('habitantes').select('*').eq('acuario_id', numId);
      setHabitantes(h || []);

      // ¿Sigo al dueño? (Para privacidad avanzada)
      if (user && !duenio) {
        const { data: sOwner } = await supabase
          .from('seguidores')
          .select('id')
          .eq('seguidor_id', user.id)
          .eq('seguido_id', a.usuario_id)
          .maybeSingle();
        setSiguiendoAlPropietario(!!sOwner);
      }

      if (a?.mediciones_publicas || duenio) {
        const { data: m } = await supabase.from('mediciones').select('*').eq('acuario_id', numId).order('creado_en', { ascending: false });
        setMediciones(m || []);
      }

      const { data: sData } = await supabase.from('seguidores').select('id').eq('acuario_id', numId);
      setSeguidoresCount(sData?.length || 0);

      const { data: c } = await supabase
        .from('vista_comentarios_acuario')
        .select('*')
        .eq('acuario_id', numId)
        .order('creado_en', { ascending: false });
      setComentarios(c || []);

      if (user) {
        const { data: s } = await supabase.from('seguidores').select('id').eq('seguidor_id', user.id).eq('acuario_id', numId).maybeSingle();
        setSiguiendoAcuario(!!s);
      }

      setCargando(false);
    }
    cargarTodo();
  }, [id]);

  const toggleSeguir = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Inicia sesión para seguir acuarios");
    const numId = Number(id);
    if (siguiendoAcuario) {
      await supabase.from('seguidores').delete().eq('seguidor_id', user.id).eq('acuario_id', numId);
    } else {
      await supabase.from('seguidores').insert([{ seguidor_id: user.id, acuario_id: numId }]);
    }
    setSiguiendoAcuario(!siguiendoAcuario);
    // Refrescar contador
    const { data: sData } = await supabase.from('seguidores').select('id').eq('acuario_id', numId);
    setSeguidoresCount(sData?.length || 0);
  };

  const toggleRespuestas = async (comentarioId) => {
    const estaAbierto = respuestasAbiertas[comentarioId];
    setRespuestasAbiertas(prev => ({ ...prev, [comentarioId]: !estaAbierto }));
    if (!estaAbierto) cargarRespuestas(comentarioId);
  };

  const cargarRespuestas = async (comentarioId) => {
    const { data } = await supabase
      .from('vista_respuestas_comentarios_acuario')
      .select('*')
      .eq('comentario_acuario_id', comentarioId)
      .order('creado_en', { ascending: true });
    setRespuestasPorComentario(prev => ({ ...prev, [comentarioId]: data || [] }));
  };

  const publicarRespuesta = async (comentarioId) => {
    if (!nuevaRespuesta.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Inicia sesión para responder");

    const { error } = await supabase.from('respuestas_comentarios_acuario').insert({
      comentario_acuario_id: comentarioId,
      usuario_id: user.id,
      contenido: nuevaRespuesta
    });

    if (!error) {
      setNuevaRespuesta('');
      cargarRespuestas(comentarioId);
    }
  };

  const reaccionarComentario = async (comentarioId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Inicia sesión para dar Me gusta");

    const { data: existe } = await supabase
      .from('reacciones_comentarios_acuario')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('comentario_acuario_id', comentarioId)
      .maybeSingle();

    if (existe) {
      await supabase.from('reacciones_comentarios_acuario').delete().eq('id', existe.id);
    } else {
      await supabase.from('reacciones_comentarios_acuario').insert({
        usuario_id: user.id,
        comentario_acuario_id: comentarioId
      });
    }
    // Refrescar comentarios para ver el nuevo contador
    const { data: c } = await supabase.from('vista_comentarios_acuario').select('*').eq('acuario_id', Number(id)).order('creado_en', { ascending: false });
    setComentarios(c || []);
  };

  const togglePrivacidad = async () => {
    if (!esDuenio) return;
    const nuevoEstado = !acuario.es_privado;
    const { error } = await supabase.from('acuarios').update({ es_privado: nuevoEstado }).eq('id', acuario.id);
    if (!error) {
      setAcuario({ ...acuario, es_privado: nuevoEstado });
    }
  };

  const añadirMedicion = async (e) => {
    e.preventDefault();
    if (!valorM) return;
    const { data: { user } } = await supabase.auth.getUser();
    const numId = Number(id);
    
    // 1. Guardar la medición
    const { data: medicion, error } = await supabase
      .from('mediciones')
      .insert([{ acuario_id: numId, parametro: parametroM, valor: valorM }])
      .select()
      .single();

    if (!error) {
      // 2. Si el checkbox está marcado, publicar en el muro
      if (publicarM && user) {
        const contenido = `📊 Nueva medición en mi tanque "${acuario.nombre}": ${parametroM} = ${valorM}`;
        await supabase.from('publicaciones').insert([{
          usuario_id: user.id,
          contenido: contenido,
          tipo_referencia: 'medicion',
          id_referencia: medicion.id
        }]);
      }

      setValorM('');
      const { data } = await supabase.from('mediciones').select('*').eq('acuario_id', numId).order('creado_en', { ascending: false });
      setMediciones(data || []);
    }
  };

  const toggleMedicionesPublicas = async () => {
    const nuevoEstado = !acuario.mediciones_publicas;
    const { error } = await supabase.from('acuarios').update({ mediciones_publicas: nuevoEstado }).eq('id', Number(id));
    if (!error) setAcuario({ ...acuario, mediciones_publicas: nuevoEstado });
  };

  const añadirHabitante = async (e) => {
    e.preventDefault();
    const numId = Number(id);
    const { error } = await supabase.from('habitantes').insert([{ nombre: nombreH, cantidad: parseInt(cantidadH), tipo: tipoH, acuario_id: numId }]);
    if (!error) {
      setNombreH(''); setCantidadH(1);
      const { data } = await supabase.from('habitantes').select('*').eq('acuario_id', numId);
      setHabitantes(data || []);
    }
  };

  const borrarHabitante = async (hid) => {
    const { error } = await supabase.from('habitantes').delete().eq('id', hid);
    if (!error) setHabitantes(habitantes.filter(h => h.id !== hid));
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Inicia sesión para comentar");
    const numId = Number(id);

    const { error } = await supabase.from('comentarios_acuario').insert({
      acuario_id: numId,
      usuario_id: user.id,
      contenido: nuevoComentario
    });

    if (error) {
      alert(`Error al publicar: ${error.message}`);
      console.error(error);
    } else {
      setNuevoComentario('');
      const { data } = await supabase
        .from('vista_comentarios_acuario')
        .select('*')
        .eq('acuario_id', numId)
        .order('creado_en', { ascending: false });
      setComentarios(data || []);
    }
  };

    if (cargando) return <div style={{ padding: '2rem' }}>Cargando acuario...</div>;
  if (!acuario) return <div style={{ padding: '2rem' }}>Acuario no encontrado.</div>;

  const puedeVer = !acuario.es_privado || esDuenio || siguiendoAlPropietario;

  if (!puedeVer) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '12px', border: '1px dashed #ccc' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔒 Tanque Privado</h2>
        <p style={{ color: 'gray', marginBottom: '2rem' }}>
          Este acuario es privado. Solo los seguidores del propietario pueden ver sus detalles y mediciones.
        </p>
        <button 
          onClick={() => {
            // Aquí podríamos poner lógica para seguir al propietario directamente
            alert("Para ver este acuario, primero debes seguir a su propietario en su perfil.");
          }}
          style={{ padding: '0.8rem 1.5rem', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Saber más
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <Link href="/perfil" style={{ color: 'gray', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>← Volver</Link>
      
      <div style={{ background: 'black', color: 'white', padding: '2rem', borderRadius: '8px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0 }}>{acuario.nombre}</h1>
            <p style={{ opacity: 0.8 }}>{acuario.litros} Litros • {acuario.tipo_agua}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {esDuenio && (
              <button 
                onClick={togglePrivacidad}
                style={{ 
                  background: 'transparent', color: 'white', border: '1px solid white', 
                  padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' 
                }}
              >
                {acuario.es_privado ? '🔒 Privado' : '🌍 Público'}
              </button>
            )}
            <button 
              onClick={toggleSeguir}
              style={{ 
                background: siguiendoAcuario ? 'transparent' : 'white', 
                color: siguiendoAcuario ? 'black' : 'white', 
                border: siguiendoAcuario ? '2px solid white' : 'none',
                padding: '0.5rem 1.5rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' 
              }}
            >
              {siguiendoAcuario ? 'Siguiendo ✓' : 'Seguir Acuario'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.9rem', opacity: 0.9 }}>
          <span>👤 <strong>{seguidoresCount}</strong> seguidores</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Mediciones Físico-Químicas</h3>
            {esDuenio && (
              <button 
                onClick={toggleMedicionesPublicas} 
                style={{ 
                  fontSize: '0.75rem', padding: '0.3rem 0.6rem', border: '1px solid #ccc', 
                  borderRadius: '12px', background: 'none', cursor: 'pointer', color: 'gray' 
                }}
              >
                {acuario.mediciones_publicas ? '🔓 Medidas Públicas' : '🔒 Medidas Privadas'}
              </button>
            )}
          </div>

          {(acuario.mediciones_publicas || esDuenio) ? (
            <div>
              {esDuenio && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <form onSubmit={añadirMedicion} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select value={parametroM} onChange={e => setParametroM(e.target.value)} style={{ padding: '0.5rem' }}>
                      <option value="pH">pH</option>
                      <option value="Temperatura">Temperatura</option>
                      <option value="KH">KH</option>
                      <option value="GH">GH</option>
                      <option value="NO3">Nitratos (NO3)</option>
                      <option value="NO2">Nitritos (NO2)</option>
                    </select>
                    <input placeholder="Valor" value={valorM} onChange={e => setValorM(e.target.value)} style={{ flex: 1, padding: '0.5rem' }} />
                    <button type="submit" style={{ background: 'black', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}>Registrar</button>
                  </form>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#555' }}>
                    <input 
                      type="checkbox" 
                      checked={publicarM} 
                      onChange={(e) => setPublicarM(e.target.checked)} 
                    />
                    Compartir actualización en el muro comunitario 🌍
                  </label>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                {mediciones.length === 0 ? <p style={{ color: 'gray' }}>Sin mediciones registradas.</p> : (
                  mediciones.slice(0, 6).map(m => (
                    <div key={m.id} style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'gray' }}>{m.parametro}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.valor}</div>
                      <div style={{ fontSize: '0.7rem' }}>{new Date(m.creado_en).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p style={{ padding: '2rem', background: '#eee', textAlign: 'center', borderRadius: '8px' }}>🤐 Las mediciones son privadas.</p>
          )}

          <div style={{ marginTop: '2rem' }}>
            <h3>Habitantes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {habitantes.map(h => (
                <div key={h.id} style={{ padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{h.cantidad}x {h.nombre}</span>
                  {esDuenio && <button onClick={() => borrarHabitante(h.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h3>Comunidad / Comentarios</h3>
            <form onSubmit={enviarComentario} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              <input 
                placeholder="Escribe un consejo o comentario para este acuario..." 
                value={nuevoComentario}
                onChange={e => setNuevoComentario(e.target.value)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button type="submit" style={{ background: 'black', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '4px', cursor: 'pointer' }}>Publicar</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {comentarios.map(c => (
                <div key={c.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                    <strong>@{c.nombre_usuario || 'Anónimo'}</strong>
                    <span style={{ color: 'gray' }}>{formatRelativeTime(c.creado_en)}</span>
                  </div>
                  <div style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>{c.contenido}</div>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'gray' }}>
                    <button 
                      onClick={() => reaccionarComentario(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: c.likes_count > 0 ? 'red' : 'gray' }}
                    >
                      {c.likes_count > 0 ? '❤️' : '🤍'} {c.likes_count || 0}
                    </button>
                    <button 
                      onClick={() => toggleRespuestas(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'gray' }}
                    >
                      💬 Responder {respuestasPorComentario[c.id]?.length > 0 ? `(${respuestasPorComentario[c.id].length})` : ''}
                    </button>
                  </div>

                  {/* Hilo de Respuestas */}
                  {respuestasAbiertas[c.id] && (
                    <div style={{ marginTop: '1rem', marginLeft: '1.5rem', borderLeft: '2px solid #eee', paddingLeft: '1rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        {respuestasPorComentario[c.id]?.map(r => (
                          <div key={r.id} style={{ marginBottom: '0.8rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <strong>@{r.nombre_usuario || 'Acuarista'}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'gray' }}>{formatRelativeTime(r.creado_en)}</span>
                            </div>
                            <div>{r.contenido}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          placeholder="Escribe una respuesta..." 
                          value={nuevaRespuesta}
                          onChange={e => setNuevaRespuesta(e.target.value)}
                          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #eee', fontSize: '0.85rem' }}
                        />
                        <button 
                          onClick={() => publicarRespuesta(c.id)}
                          style={{ background: 'black', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {comentarios.length === 0 && <p style={{ color: 'gray' }}>Sé el primero en comentar este acuario.</p>}
            </div>
          </div>
        </div>

        {esDuenio && (
          <div style={{ border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', alignSelf: 'start' }}>
            <h3>Administrar Tanque</h3>
            <p style={{ fontSize: '0.9rem', color: 'gray', marginBottom: '1rem' }}>Solo tú puedes ver este panel.</p>
            <form onSubmit={añadirHabitante} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input placeholder="Nombre del bicho/planta" value={nombreH} onChange={e => setNombreH(e.target.value)} required style={{ padding: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" value={cantidadH} onChange={e => setCantidadH(e.target.value)} min="1" required style={{ width: '60px' }} />
                <select value={tipoH} onChange={e => setTipoH(e.target.value)} style={{ flex: 1, padding: '0.5rem' }}>
                  <option value="Pez">Pez</option>
                  <option value="Planta">Planta</option>
                  <option value="Invertebrado">Invertebrado</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <button type="submit" style={{ background: 'black', color: 'white', padding: '0.7rem', border: 'none', cursor: 'pointer' }}>Añadir Habitante</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
