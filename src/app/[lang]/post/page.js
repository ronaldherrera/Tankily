"use client";

import { Suspense, useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { Vacio, Cargando } from '@/components/ui';
import PostCard from '@/components/feed/PostCard';
import { SELECT_POST } from '@/components/feed/Feed';
import Lateral from '@/components/Lateral';
import { useT } from '@/i18n/IdiomaProvider';

function Publicacion() {
  const id = useSearchParams().get('id');
  const { usuario, cargando } = useSesion();
  const [post, setPost] = useState(undefined);
  const { t } = useT();
  const [gusta, setGusta] = useState(false);

  useEffect(() => {
    if (!id || cargando) return;
    supabase.from('publicaciones').select(SELECT_POST).eq('id', id).maybeSingle().then(async ({ data }) => {
      if (usuario && data) {
        const { data: g } = await supabase.from('me_gusta').select('publicacion_id').eq('usuario_id', usuario.id).eq('publicacion_id', data.eco_de && !data.contenido ? data.eco_de : data.id);
        setGusta((g || []).length > 0);
      }
      setPost(data);
      if (data?.autor) document.title = `${data.autor.nombre || data.autor.usuario}: "${(data.contenido || '').slice(0, 60)}" · Tankily`;
    });
  }, [id, usuario, cargando]);

  return (
    <div className="contenido">
      <div className="columna">
        {post === undefined ? <Cargando alto={220} n={1} /> : !post ? (
          <Vacio titulo={t('post.noExiste')} accion={<Link href="/" className="btn">{t('post.irAlMuro')}</Link>} />
        ) : (
          <PostCard post={post} meGusta={gusta} destacado />
        )}
      </div>
      <Lateral />
    </div>
  );
}

export default function PostPage() {
  return <Suspense><Publicacion /></Suspense>;
}
