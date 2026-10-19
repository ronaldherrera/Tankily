-- 1) Un solo eco y una sola cita por persona y publicación (como "me gusta").
--    Antes de crear la regla se borran los repetidos, dejando el más antiguo de cada uno
--    (el trigger de borrado ya descuenta num_ecos de la publicación original).
delete from public.publicaciones p
  using public.publicaciones q
  where p.eco_de is not null and q.eco_de = p.eco_de and q.usuario_id = p.usuario_id
    and (p.contenido is null) = (q.contenido is null)
    and q.id < p.id;

create unique index if not exists publicaciones_un_eco on public.publicaciones (usuario_id, eco_de)
  where eco_de is not null and contenido is null;
create unique index if not exists publicaciones_una_cita on public.publicaciones (usuario_id, eco_de)
  where eco_de is not null and contenido is not null;

-- 2) Ocultar automáticamente lo muy denunciado: con 5 denuncias pendientes de personas distintas,
--    publicaciones, comentarios, hilos, respuestas y anuncios dejan de verse para todos salvo para su
--    autor y los administradores, hasta que un administrador lo revise (admin_mostrar).
alter table public.publicaciones add column if not exists oculto boolean not null default false;
alter table public.comentarios add column if not exists oculto boolean not null default false;
alter table public.foro_hilos add column if not exists oculto boolean not null default false;
alter table public.foro_respuestas add column if not exists oculto boolean not null default false;
alter table public.anuncios add column if not exists oculto boolean not null default false;

-- Nadie (salvo las funciones de abajo) puede cambiar "oculto". En el resto de tablas el permiso de
-- UPDATE ya era por columnas; en comentarios era de toda la tabla (aunque ninguna política deja editarlos):
-- se retira del todo, los comentarios no se editan.
revoke update on public.comentarios from authenticated, anon;

drop policy if exists "publicaciones: ver" on public.publicaciones;
create policy "publicaciones: ver" on public.publicaciones for select using (
  ((tanque_id is null) or public.puede_ver_tanque(tanque_id))
  and (not oculto or usuario_id = (select auth.uid()) or public.es_admin())
);

drop policy if exists "comentarios: ver" on public.comentarios;
create policy "comentarios: ver" on public.comentarios for select using (
  exists (select 1 from public.publicaciones p where p.id = publicacion_id)
  and (not oculto or usuario_id = (select auth.uid()) or public.es_admin())
);

drop policy if exists "foro_hilos: lectura" on public.foro_hilos;
create policy "foro_hilos: lectura" on public.foro_hilos for select using (
  not oculto or usuario_id = (select auth.uid()) or public.es_admin()
);

drop policy if exists "foro_respuestas: lectura" on public.foro_respuestas;
create policy "foro_respuestas: lectura" on public.foro_respuestas for select using (
  not oculto or usuario_id = (select auth.uid()) or public.es_admin()
);

drop policy if exists "anuncios: lectura pública" on public.anuncios;
create policy "anuncios: lectura pública" on public.anuncios for select using (
  not oculto or usuario_id = (select auth.uid()) or public.es_admin()
);

create or replace function public.revisar_denuncias() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  tabla text := case new.tipo
    when 'publicacion' then 'publicaciones' when 'comentario' then 'comentarios'
    when 'hilo' then 'foro_hilos' when 'respuesta' then 'foro_respuestas' when 'anuncio' then 'anuncios' end;
  personas int;
begin
  if tabla is null or new.objeto_id !~ '^\d+$' then return null; end if;
  select count(distinct usuario_id) into personas from public.reportes
    where tipo = new.tipo and objeto_id = new.objeto_id and estado = 'pendiente';
  if personas >= 5 then
    execute format('update public.%I set oculto = true where id = $1', tabla) using new.objeto_id::bigint;
  end if;
  return null;
end $$;
revoke execute on function public.revisar_denuncias() from public, anon, authenticated;

drop trigger if exists reportes_revisar on public.reportes;
create trigger reportes_revisar after insert on public.reportes
  for each row execute function public.revisar_denuncias();

-- Administración: volver a mostrar (o ocultar a mano) un contenido denunciado
create or replace function public.admin_mostrar(p_tipo text, p_id bigint, p_visible boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  tabla text := case p_tipo
    when 'publicacion' then 'publicaciones' when 'comentario' then 'comentarios'
    when 'hilo' then 'foro_hilos' when 'respuesta' then 'foro_respuestas' when 'anuncio' then 'anuncios' end;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if tabla is null then raise exception 'Tipo no válido'; end if;
  execute format('update public.%I set oculto = $1 where id = $2', tabla) using not p_visible, p_id;
end $$;
revoke execute on function public.admin_mostrar(text, bigint, boolean) from public, anon;
grant execute on function public.admin_mostrar(text, bigint, boolean) to authenticated;
