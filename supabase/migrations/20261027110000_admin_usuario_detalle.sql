-- Panel de administración, pestaña Usuarios: al pulsar un paso (Tanques, Apuntes, Publicaciones, Foro,
-- Comentarios) se ve qué ha hecho esa persona, lo último primero (como mucho 50). Incluye lo privado
-- (tanques no públicos, contenido oculto por moderación) y lo marca, para poder ayudar o moderar.

create or replace function public.admin_usuario_detalle(p_usuario uuid, p_tipo text)
returns json language plpgsql security definer set search_path = '' as $$
declare r json;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  if p_tipo = 'tanques' then
    select coalesce(json_agg(f order by f.creado_en desc), '[]') into r from (
      select t.id, t.nombre, t.tipo, t.litros, t.visibilidad, t.foto_url, t.creado_en,
        (select count(*) from public.mediciones m where m.tanque_id = t.id)
          + (select count(*) from public.tanque_eventos e where e.tanque_id = t.id) apuntes
      from public.tanques t where t.usuario_id = p_usuario
      order by t.creado_en desc limit 50) f;

  elsif p_tipo = 'apuntes' then
    select coalesce(json_agg(f order by f.fecha desc), '[]') into r from (
      select * from (
        select 'medicion' clase, m.parametro que, m.valor, m.nota, m.medido_en fecha, t.id tanque_id, t.nombre tanque
        from public.mediciones m join public.tanques t on t.id = m.tanque_id where t.usuario_id = p_usuario
        union all
        select 'evento', e.tipo, null, e.nota, e.fecha, t.id, t.nombre
        from public.tanque_eventos e join public.tanques t on t.id = e.tanque_id where t.usuario_id = p_usuario
      ) a order by fecha desc limit 50) f;

  elsif p_tipo = 'publicaciones' then
    select coalesce(json_agg(f order by f.creado_en desc), '[]') into r from (
      select p.id, p.tipo, left(p.contenido, 240) contenido, coalesce(array_length(p.imagenes, 1), 0) imagenes,
        p.video is not null video, p.num_me_gusta, p.num_comentarios, p.oculto, p.creado_en
      from public.publicaciones p where p.usuario_id = p_usuario
      order by p.creado_en desc limit 50) f;

  elsif p_tipo = 'foro' then
    select coalesce(json_agg(f order by f.creado_en desc), '[]') into r from (
      select * from (
        select 'hilo' clase, h.id hilo_id, h.titulo, left(h.contenido, 240) contenido, h.num_respuestas, h.oculto, h.creado_en
        from public.foro_hilos h where h.usuario_id = p_usuario
        union all
        select 'respuesta', h.id, h.titulo, left(x.contenido, 240), null, x.oculto, x.creado_en
        from public.foro_respuestas x join public.foro_hilos h on h.id = x.hilo_id where x.usuario_id = p_usuario
      ) a order by creado_en desc limit 50) f;

  elsif p_tipo = 'comentarios' then
    select coalesce(json_agg(f order by f.creado_en desc), '[]') into r from (
      select c.id, c.publicacion_id, left(c.contenido, 240) contenido, c.oculto, c.creado_en
      from public.comentarios c where c.usuario_id = p_usuario
      order by c.creado_en desc limit 50) f;

  else
    raise exception 'Tipo no válido';
  end if;
  return r;
end $$;
revoke execute on function public.admin_usuario_detalle(uuid, text) from public, anon;
grant execute on function public.admin_usuario_detalle(uuid, text) to authenticated;
