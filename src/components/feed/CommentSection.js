"use client";

import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Avatar, NombreAutor, useTostada } from '@/components/ui';
import TextoTraducible from './TextoTraducible';
import { detectarIdioma } from '@/lib/traduccion';
import { useT } from '@/i18n/IdiomaProvider';
import { mensajeError } from '@/lib/errores';

export default function CommentSection({ postId, autorPostId, onCambioTotal }) {
  const { usuario, perfil } = useSesion();
  const { t, lang } = useT();
  const tostada = useTostada();
  const [comentarios, setComentarios] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase
      .from('comentarios')
      .select(`id, contenido, idioma, creado_en, usuario_id, ${AUTOR}`)
      .eq('publicacion_id', postId)
      .order('creado_en', { ascending: true })
      .then(({ data }) => setComentarios(data || []));
  }, [postId]);

  async function enviar(e) {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;
    setEnviando(true);
    const { data, error } = await supabase
      .from('comentarios')
      .insert({ publicacion_id: postId, contenido, idioma: await detectarIdioma(contenido, lang) })
      .select(`id, contenido, idioma, creado_en, usuario_id, ${AUTOR}`)
      .single();
    setEnviando(false);
    if (error) tostada(mensajeError(error, t));
    else {
      setComentarios((c) => [...c, data]);
      setTexto('');
      onCambioTotal?.(1);
    }
  }

  async function borrar(id) {
    const { error } = await supabase.from('comentarios').delete().eq('id', id);
    if (!error) {
      setComentarios((c) => c.filter((x) => x.id !== id));
      onCambioTotal?.(-1);
    }
  }

  return (
    <div className="comentarios">
      {comentarios === null ? (
        <p className="texto-3 pequeno">{t('comentarios.cargando')}</p>
      ) : comentarios.length === 0 ? (
        <p className="texto-3 pequeno">{t('comentarios.ninguno')}</p>
      ) : (
        comentarios.map((c) => (
          <div key={c.id} className="comentario">
            <Avatar perfil={c.autor} tamano={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <NombreAutor perfil={c.autor} conUsuario={false} />
                <span className="texto-3 mini">{formatRelativeTime(c.creado_en)}</span>
                {usuario && (usuario.id === c.usuario_id || usuario.id === autorPostId) && (
                  <button className="btn btn-fantasma btn-icono btn-s" style={{ marginLeft: 'auto', width: 26, height: 26 }} onClick={() => borrar(c.id)} aria-label={t('comentarios.eliminar')}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <TextoTraducible tabla="comentarios" id={c.id} texto={c.contenido} idioma={c.idioma} />
            </div>
          </div>
        ))
      )}

      {usuario && (
        <form onSubmit={enviar} className="comentario" style={{ alignItems: 'center' }}>
          <Avatar perfil={perfil} tamano={30} />
          <input
            className="entrada"
            placeholder={t('comentarios.escribe')}
            value={texto}
            maxLength={1000}
            onChange={(e) => setTexto(e.target.value)}
            aria-label={t('comentarios.etiqueta')}
          />
          <button className="btn btn-primario btn-icono" disabled={enviando || !texto.trim()} aria-label={t('comentarios.enviar')}>
            <Send size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
