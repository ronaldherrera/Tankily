-- Panel de administración, pestaña Usuarios: también el idioma con el que cada persona usa la web
-- (avisos_email.idioma, que la web actualiza al entrar con el idioma elegido; ver AppShell.js).

create or replace function public.admin_usuarios(p_demo boolean default false)
returns json language plpgsql security definer set search_path = '' as $$
declare r json;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  select coalesce(json_agg(f order by f.creado_en desc), '[]'::json) into r from (
    select p.id, p.usuario, p.nombre, p.avatar_url, p.pais, p.nivel, p.es_admin, p.creado_en,
      u.email, u.email like '%.invalid' demo,
      coalesce(u.raw_app_meta_data->>'provider', 'email') proveedor,
      u.email_confirmed_at is not null confirmado,
      coalesce((select a.idioma from public.avisos_email a where a.usuario_id = p.id), nullif(u.raw_user_meta_data->>'idioma', '')) idioma,
      (select max(a.dia) from public.actividad_diaria a where a.usuario_id = p.id) ultimo_dia,
      (select count(*) from public.actividad_diaria a where a.usuario_id = p.id) dias_activo,
      (select count(*) from public.tanques t where t.usuario_id = p.id) tanques,
      (select count(*) from public.mediciones m join public.tanques t on t.id = m.tanque_id where t.usuario_id = p.id)
        + (select count(*) from public.tanque_eventos e join public.tanques t on t.id = e.tanque_id where t.usuario_id = p.id) apuntes,
      (select count(*) from public.publicaciones x where x.usuario_id = p.id) publicaciones,
      (select count(*) from public.foro_hilos x where x.usuario_id = p.id)
        + (select count(*) from public.foro_respuestas x where x.usuario_id = p.id) foro,
      (select count(*) from public.comentarios x where x.usuario_id = p.id) comentarios,
      exists (select 1 from public.push_suscripciones s where s.usuario_id = p.id) push,
      coalesce((select a.resumen from public.avisos_email a where a.usuario_id = p.id), false) resumen
    from public.perfiles p join auth.users u on u.id = p.id
    where p_demo is null or (u.email like '%.invalid') = p_demo
    order by p.creado_en desc
    limit 500
  ) f;
  return r;
end $$;
revoke execute on function public.admin_usuarios(boolean) from public, anon;
grant execute on function public.admin_usuarios(boolean) to authenticated;
