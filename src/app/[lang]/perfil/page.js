'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

export default function PerfilPage() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [acuarios, setAcuarios] = useState([]);
  const [actividad, setActividad] = useState([]);
  const [counts, setCounts] = useState({ seguidores: 0, siguiendo: 0 });
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState('actividad');
  const router = useRouter();

  useEffect(() => {
    async function cargarTodo() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 1. Perfil y Acuarios
        const [perfilRes, acuariosRes] = await Promise.all([
          supabase.from('perfiles').select('*').eq('id', user.id).single(),
          supabase.from('acuarios').select('*').eq('usuario_id', user.id)
        ]);
        
        setPerfil(perfilRes.data);
        const misAcuarios = acuariosRes.data || [];
        setAcuarios(misAcuarios);

        // 2. Counts
        const { count: followers } = await supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido_id', user.id);
        const { count: following } = await supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguidor_id', user.id);
        setCounts({ seguidores: followers || 0, siguiendo: following || 0 });

        // 3. Actividad con Múltiples Fuentes
        const idsAcuarios = misAcuarios.map(a => a.id);

        const [postsRes, reaccionesRes, respuestasRes, medicionesRes] = await Promise.all([
          supabase.from('publicaciones').select('*').eq('usuario_id', user.id),
          supabase.from('reacciones').select('*, publicaciones(contenido)').eq('usuario_id', user.id),
          supabase.from('respuestas_comentarios_acuario').select('*').eq('usuario_id', user.id),
          idsAcuarios.length > 0 
            ? supabase.from('mediciones').select('*, acuarios(nombre)').in('acuario_id', idsAcuarios)
            : Promise.resolve({ data: [] })
        ]);

        const totalActividad = [
          ...(postsRes.data || []).map(x => ({ ...x, tipo: 'post' })),
          ...(reaccionesRes.data || []).map(x => ({ ...x, tipo: 'like' })),
          ...(respuestasRes.data || []).map(x => ({ ...x, tipo: 'respuesta' })),
          ...(medicionesRes.data || []).map(x => ({ ...x, tipo: 'medicion' }))
        ].sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));

        setActividad(totalActividad);
      }
      setCargando(false);
    }
    cargarTodo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (cargando) return <div style={{ padding: '2rem' }}>Cargando perfil...</div>;

  if (!user) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Únete a la comunidad de Tankily</h2>
        <p>Inicia sesión para ver tu perfil y gestionar tus acuarios.</p>
        <br/>
        <Link href="/acceder" style={{ background: 'black', color: 'white', padding: '1rem 2rem', textDecoration: 'none', borderRadius: '4px' }}>Ir a Iniciar Sesión</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* Cabecera de Perfil (Estilo Twitter) */}
      <div style={{ position: 'relative', marginBottom: '4rem' }}>
        <div style={{ height: '150px', background: '#eee', borderRadius: '8px' }}></div>
        <div style={{ 
          position: 'absolute', bottom: '-40px', left: '20px',
          width: '100px', height: '100px', background: 'white', borderRadius: '50%', border: '4px solid white', overflow: 'hidden'
        }}>
          <div style={{ width: '100%', height: '100%', background: '#ccc' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', gap: '0.5rem' }}>
          <Link href="/perfil/editar" style={{ padding: '0.5rem 1rem', border: '1px solid black', borderRadius: '20px', fontWeight: 'bold' }}>Editar Perfil</Link>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Salir</button>
        </div>
      </div>

      <div style={{ paddingLeft: '20px' }}>
        <h1 style={{ margin: 0 }}>{perfil?.nombre_usuario || 'Acuarista'}</h1>
        <p style={{ color: 'gray', marginBottom: '1rem' }}>@{perfil?.nombre_usuario?.toLowerCase().replace(/\s/g, '') || 'usuario'}</p>
        <p>{perfil?.biografia || 'Hola, soy un apasionado de los acuarios.'}</p>
        
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.9rem' }}>
          <span><strong>{counts.siguiendo}</strong> Siguiendo</span>
          <span><strong>{counts.seguidores}</strong> Seguidores</span>
          <span>🏆 <strong>{perfil?.karma || 0}</strong> Karma</span>
        </div>
      </div>

      {/* TABS (Unificado con estilo Muro) */}
      <div style={{ display: 'flex', gap: '0.1rem', background: '#f8f8f8', borderBottom: '1px solid #eee', marginTop: '2rem', borderRadius: '8px', overflow: 'hidden' }}>
        <button 
          onClick={() => setTabActiva('actividad')} 
          style={{ 
            flex: 1, padding: '1rem', border: 'none', 
            background: tabActiva === 'actividad' ? 'white' : 'transparent', 
            fontWeight: tabActiva === 'actividad' ? 'bold' : 'normal', 
            cursor: 'pointer', transition: 'all 0.2s', color: 'black' 
          }}
        >
          Actividad
        </button>
        <button 
          onClick={() => setTabActiva('tanques')} 
          style={{ 
            flex: 1, padding: '1rem', border: 'none', 
            background: tabActiva === 'tanques' ? 'white' : 'transparent', 
            fontWeight: tabActiva === 'tanques' ? 'bold' : 'normal', 
            cursor: 'pointer', transition: 'all 0.2s', color: 'black' 
          }}
        >
          Tanques
        </button>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {tabActiva === 'tanques' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Mis Tanques</h3>
              <Link href="/acuarios/nuevo" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px' }}>+ Nuevo Tanque</Link>
            </div>
            {acuarios.length === 0 ? (
              <p style={{ fontStyle: 'italic' }}>Aún no has registrado ningún tanque.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {acuarios.map(a => (
                  <Link key={a.id} href={`/acuario?id=${a.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'black' }}>
                    <h3>{a.nombre}</h3>
                    <p style={{ color: 'gray' }}>{a.litros} Litros - {a.tipo_agua}</p>
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Ver Tanque →</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3>Actividad Reciente</h3>
            {actividad.length === 0 ? (
              <p style={{ fontStyle: 'italic' }}>Aún no hay actividad registrada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {actividad.map((item, idx) => (
                  <div key={idx} className="card" style={{ borderRadius: '8px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'gray' }}>
                      <span>
                        {item.tipo === 'post' && '📝 Publicaste'}
                        {item.tipo === 'like' && '❤️ Te gustó una publicación'}
                        {item.tipo === 'respuesta' && '💬 Respondiste'}
                        {item.tipo === 'medicion' && `🧪 Medición en ${item.acuarios?.nombre || 'Tanque'}`}
                      </span>
                      <span>{formatRelativeTime(item.creado_en)}</span>
                    </div>
                    
                    <div style={{ fontSize: '1rem' }}>
                      {item.tipo === 'post' && item.contenido}
                      {item.tipo === 'like' && (
                        <div style={{ fontStyle: 'italic', color: '#555' }}>"{item.publicaciones?.contenido?.substring(0, 60)}..."</div>
                      )}
                      {item.tipo === 'respuesta' && item.contenido}
                      {item.tipo === 'medicion' && (
                        <strong>{item.parametro}: <span style={{ color: 'black' }}>{item.valor}</span></strong>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
