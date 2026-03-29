"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export default function CommentSection({ postId, user }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarComentarios();
  }, [postId]);

  const cargarComentarios = async () => {
    const { data, error } = await supabase
      .from('vista_comentarios_posteos')
      .select('*')
      .eq('publicacion_id', postId)
      .order('creado_en', { ascending: true });

    if (!error) {
      setComentarios(data || []);
    }
    setLoading(false);
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !user) return;

    const { error } = await supabase
      .from('comentarios')
      .insert([{ 
        publicacion_id: postId,
        usuario_id: user.id,
        contenido: nuevoComentario
      }]);

    if (!error) {
      setNuevoComentario("");
      cargarComentarios();
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', borderLeft: '2px solid #eee', paddingLeft: '1rem' }}>
      {user && (
        <form onSubmit={enviarComentario} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            placeholder="Escribe tu respuesta..." 
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px', fontSize: '0.9rem' }}
          />
          <button 
            type="submit"
            disabled={!nuevoComentario.trim()}
            style={{ 
              background: 'black', color: 'white', border: 'none', 
              padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer',
              opacity: !nuevoComentario.trim() ? 0.5 : 1
            }}
          >
            Responder
          </button>
        </form>
      )}
      
      {loading ? (
        <small style={{ color: 'gray' }}>Cargando comentarios...</small>
      ) : comentarios.length === 0 ? (
        <small style={{ color: 'gray' }}>Aún no hay respuestas.</small>
      ) : (
        comentarios.map(c => (
          <div key={c.id} style={{ marginBottom: '0.8rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <strong>@{c.nombre_usuario || 'Acuarista'}</strong>
              <span style={{ color: 'gray', fontSize: '0.8rem' }}>{formatRelativeTime(c.creado_en)}</span>
            </div>
            <p style={{ marginTop: '0.2rem' }}>{c.contenido}</p>
          </div>
        ))
      )}
    </div>
  );
}
