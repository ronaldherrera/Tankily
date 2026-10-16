-- Revisión de seguridad antes de abrir Tankily al público (16/10/2026).

-- 1. Comentarios: solo se ven si se puede ver la publicación. Antes, los comentarios de las
--    publicaciones de tanques privados o "solo seguidores" los podía leer cualquiera.
--    La subconsulta respeta la RLS de publicaciones de quien lee.
drop policy if exists "comentarios: ver" on public.comentarios;
create policy "comentarios: ver" on public.comentarios for select
  using (exists (select 1 from public.publicaciones p where p.id = publicacion_id));

-- 2. Traducciones guardadas: mismo criterio. Antes la caché era de lectura pública y dejaba leer,
--    ya traducido, el texto de publicaciones y comentarios privados.
drop policy if exists "traducciones: lectura" on public.traducciones;
create policy "traducciones: lectura" on public.traducciones for select using (
  case tabla
    when 'publicaciones' then exists (select 1 from public.publicaciones p where p.id = fila_id)
    when 'comentarios' then exists (select 1 from public.comentarios c where c.id = fila_id)
    else true -- foro: hilos y respuestas son públicos
  end
);

-- 3. Reseñas de tiendas: al editar solo se cambian la puntuación y el texto. Antes se podía escribir
--    una reseña en una tienda ajena y luego moverla a la propia (que no se puede reseñar).
revoke update on public.tienda_resenas from authenticated, anon;
grant update (puntuacion, texto) on public.tienda_resenas to authenticated;

-- 4. Publicaciones e hilos del foro: al editarlos, el tanque vinculado tiene que ser tuyo
--    (al crearlos ya se exigía; al editar se podía colgar una publicación en el diario de otro tanque).
drop policy if exists "publicaciones: editar las propias" on public.publicaciones;
create policy "publicaciones: editar las propias" on public.publicaciones for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()) and (tanque_id is null or public.es_dueno_tanque(tanque_id)));

drop policy if exists "foro_hilos: editar (autor o admin)" on public.foro_hilos;
create policy "foro_hilos: editar (autor o admin)" on public.foro_hilos for update to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin())
  with check (
    (usuario_id = (select auth.uid()) or public.es_admin())
    and (tanque_id is null or public.es_dueno_tanque(tanque_id) or public.es_admin())
  );

-- 5. Defensa en profundidad: los visitantes sin sesión no escriben en ninguna tabla. Las políticas ya
--    lo impedían (todas las de escritura son "to authenticated"); así no depende solo de ellas.
revoke insert, update, delete on all tables in schema public from anon;
