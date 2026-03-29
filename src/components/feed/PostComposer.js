"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PostComposer({ user, onPostCreated }) {
  const [nuevoPost, setNuevoPost] = useState("");
  const [cargandoEnvio, setCargandoEnvio] = useState(false);

  const enviarPost = async (e) => {
    e.preventDefault();
    if (!nuevoPost.trim() || !user) return;
    setCargandoEnvio(true);

    const { error } = await supabase
      .from('publicaciones')
      .insert([{ 
        usuario_id: user.id, 
        contenido: nuevoPost 
      }]);

    if (error) {
      alert("Error al publicar: " + error.message);
    } else {
      setNuevoPost("");
      if (onPostCreated) onPostCreated();
    }
    setCargandoEnvio(false);
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>¿Qué tienes en mente para tu tanque?</h3>
      <form onSubmit={enviarPost}>
        <textarea 
          placeholder="¿Qué hay de nuevo en tu acuario? Usa #hashtags o menciona a @alguien..." 
          value={nuevoPost}
          onChange={(e) => setNuevoPost(e.target.value)}
          style={{
            width: '100%', minHeight: '100px', padding: '1rem', 
            border: '1px solid #eee', borderRadius: '8px', fontSize: '1rem',
            resize: 'vertical', fontFamily: 'inherit'
          }}
        ></textarea>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ color: 'gray', fontSize: '0.8rem' }}>
            Tip: Comparte tus mediciones desde la página de tu acuario.
          </div>
          <button 
            type="submit" 
            disabled={cargandoEnvio || !nuevoPost.trim()}
            style={{
              background: 'black', 
              color: 'white', 
              padding: '0.6rem 2rem', 
              borderRadius: '20px', 
              border: 'none', 
              fontWeight: 'bold',
              cursor: (cargandoEnvio || !nuevoPost.trim()) ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s'
            }}
          >
            {cargandoEnvio ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
}
