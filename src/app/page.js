"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";

export default function Home() {
  const [activeTab, setActiveTab] = useState("generico");
  const [user, setUser] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargandoPosts, setCargandoPosts] = useState(true);

  useEffect(() => {
    cargarSesion();
    cargarPosts();

    // SUSCRIPCIÓN EN TIEMPO REAL
    const canal = supabase
      .channel('publicaciones_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'publicaciones' }, () => {
        cargarPosts(); // Recargar al haber cambios
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [activeTab]);

  async function cargarSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  }

  async function cargarPosts() {
    const { data: { session } } = await supabase.auth.getSession();
    setCargandoPosts(true);
    
    let consulta = supabase.from('vista_publicaciones').select('*, reacciones(count)');

    if (activeTab === "siguiendo" && session?.user) {
      const { data: siguiendo } = await supabase
        .from('seguidores')
        .select('seguido_id')
        .eq('seguidor_id', session.user.id)
        .not('seguido_id', 'is', null);
      
      const idsSeguidos = siguiendo?.map(s => s.seguido_id) || [];
      idsSeguidos.push(session.user.id);
      consulta = consulta.in('usuario_id', idsSeguidos);
    }

    const { data, error } = await consulta.order('creado_en', { ascending: false });
    if (!error) setPublicaciones(data || []);
    setCargandoPosts(false);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {user && (
        <PostComposer user={user} onPostCreated={cargarPosts} />
      )}

      {/* Tabs / Filtros */}
      <div style={{ display: 'flex', gap: '0.1rem', background: '#f8f8f8', borderBottom: '1px solid #eee', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
        <button 
          onClick={() => setActiveTab("generico")}
          style={{ 
            flex: 1, background: activeTab === "generico" ? 'white' : 'transparent',
            border: 'none', padding: '1rem', fontWeight: activeTab === "generico" ? 'bold' : 'normal',
            cursor: 'pointer', color: 'black'
          }}
        >
          Para ti
        </button>
        <button 
          onClick={() => setActiveTab("siguiendo")}
          style={{ 
            flex: 1, background: activeTab === "siguiendo" ? 'white' : 'transparent',
            border: 'none', padding: '1rem', fontWeight: activeTab === "siguiendo" ? 'bold' : 'normal',
            cursor: 'pointer', color: 'black'
          }}
        >
          Siguiendo
        </button>
      </div>

      <div className="posts">
        {cargandoPosts ? (
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'gray' }}>Cargando comunidad...</p>
        ) : publicaciones.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'gray', marginTop: '2rem' }}>
            {activeTab === "siguiendo" ? "Aún no sigues a nadie. ¡Explora el acuario de otros!" : "¡Sé el primero en saludar a la comunidad!"}
          </p>
        ) : (
          publicaciones.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              user={user} 
              onUpdate={cargarPosts} 
            />
          ))
        )}
      </div>
    </div>
  );
}

