"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import CommentSection from "./CommentSection";

export default function PostCard({ post, user, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.reacciones_count || post.reacciones?.[0]?.count || 0);
  const [hasLiked, setHasLiked] = useState(post.reacciones?.[0]?.count > 0);

  const handleLike = async () => {
    if (!user) return alert("Debes iniciar sesión para dar Me gusta");

    if (hasLiked) {
      setLikesCount(prev => Math.max(0, prev - 1));
      setHasLiked(false);
      await supabase.from('reacciones').delete().eq('usuario_id', user.id).eq('publicacion_id', post.id);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
      await supabase.from('reacciones').insert([{ usuario_id: user.id, publicacion_id: post.id }]);
    }
    if (onUpdate) onUpdate();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    alert("¡Enlace copiado al portapapeles!");
  };

  return (
    <div className="card" style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', borderRadius: 0 }}>
      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <div style={{ width: '40px', height: '40px', background: '#ccc', borderRadius: '50%', flexShrink: 0 }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong>@{post.nombre_usuario || 'Acuarista Anónimo'}</strong>
            <span style={{ color: 'gray', fontSize: '0.9rem' }}>• {formatRelativeTime(post.creado_en)}</span>
          </div>

          {/* Renderizado especial para mediciones sharing */}
          {post.tipo_referencia === 'medicion' ? (
            <div style={{ 
              marginTop: '0.5rem', padding: '1rem', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px',
              borderLeft: '4px solid black'
            }}>
              <p style={{ fontSize: '1.05rem', fontWeight: '500' }}>{post.contenido}</p>
              <small style={{ color: 'gray', display: 'block', marginTop: '0.5rem' }}>📊 Parámetro registrado en el diario</small>
            </div>
          ) : (
            <p style={{ marginTop: '0.5rem', fontSize: '1.1rem', lineHeight: '1.4' }}>{post.contenido}</p>
          )}

          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', color: 'gray' }}>
            <span 
              onClick={() => setShowComments(!showComments)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Comentar"
            >
              💬 <span>{post.comentarios_count || 0}</span>
            </span>
            
            <span 
              onClick={() => alert("Función de Eco (repost) próximamente")}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} 
              title="Eco (Repost)"
            >
              🔄 <span>{post.ecos_count || 0}</span>
            </span>

            <span 
              onClick={handleLike}
              style={{ cursor: 'pointer', color: hasLiked ? 'red' : 'gray', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Me gusta"
            >
              {hasLiked ? '❤️' : '🤍'} <span>{likesCount}</span>
            </span>

            <span 
              onClick={handleShare}
              style={{ cursor: 'pointer' }}
              title="Compartir enlace"
            >
              🔗
            </span>
          </div>

          {showComments && (
            <CommentSection postId={post.id} user={user} />
          )}
        </div>
      </div>
    </div>
  );
}
