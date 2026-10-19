-- Avisos por email: mensajes nuevos y respuestas en el foro (cada 15 minutos, agrupados) y un resumen
-- semanal opcional. Los envía la Edge Function `avisos`, a la que llama pg_cron por pg_net.
--
-- Solo se avisa de lo que sigue sin leer pasados 10 minutos (si la persona está en la web, no recibe
-- nada), como mucho un correo por tipo y hora, y nunca a las cuentas de demostración (*.invalid).

-- 1) Preferencias. Si alguien no tiene fila, valen los valores por defecto.
create table public.avisos_email (
  usuario_id uuid primary key references public.perfiles on delete cascade default auth.uid(),
  mensajes boolean not null default true,
  foro boolean not null default true,
  resumen boolean not null default false,
  idioma text not null default 'es' check (idioma in ('es','en','de','pt','fr','it','nl','pl')),
  -- Para darse de baja desde el propio correo sin iniciar sesión
  baja uuid not null unique default gen_random_uuid(),
  -- Hasta dónde se ha avisado ya de cada tipo
  hasta_mensajes timestamptz,
  hasta_foro timestamptz,
  hasta_resumen timestamptz
);
alter table public.avisos_email enable row level security;

create policy "avisos_email: las mías" on public.avisos_email for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "avisos_email: crear la mía" on public.avisos_email for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "avisos_email: cambiar la mía" on public.avisos_email for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

revoke all on public.avisos_email from anon, authenticated;
grant select (usuario_id, mensajes, foro, resumen, idioma) on public.avisos_email to authenticated;
grant insert (usuario_id, mensajes, foro, resumen, idioma) on public.avisos_email to authenticated;
grant update (mensajes, foro, resumen, idioma) on public.avisos_email to authenticated;

-- Baja con el enlace del correo (sin sesión). p_tipo: 'mensajes', 'foro', 'resumen' o 'todo'.
create or replace function public.baja_avisos(p_token uuid, p_tipo text default 'todo')
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.avisos_email set
    mensajes = mensajes and p_tipo not in ('mensajes', 'todo'),
    foro = foro and p_tipo not in ('foro', 'todo'),
    resumen = resumen and p_tipo not in ('resumen', 'todo')
  where baja = p_token;
  return found;
end $$;
revoke execute on function public.baja_avisos(uuid, text) from public;
grant execute on function public.baja_avisos(uuid, text) to anon, authenticated;

-- 2) Lo que hay que avisar ahora. Solo la usa la Edge Function (service_role).
--    p_tipo 'mensajes' o 'foro': una fila por persona con lo nuevo sin leer desde el último aviso.
--    p_tipo 'resumen': lo sin leer de la última semana y las tareas de mantenimiento que vencen.
create or replace function public.avisos_por_enviar(p_tipo text)
returns table (usuario_id uuid, email text, idioma text, baja uuid, total int, actores text[], detalle jsonb)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  corte timestamptz := now() - interval '10 minutes';
begin
  -- Toda persona con cuenta confirmada tiene su fila (así tiene token de baja)
  insert into public.avisos_email (usuario_id, idioma)
  select p.id, coalesce(nullif(u.raw_user_meta_data->>'idioma', ''), 'es')
  from public.perfiles p join auth.users u on u.id = p.id
  where u.email_confirmed_at is not null
    and coalesce(nullif(u.raw_user_meta_data->>'idioma', ''), 'es') in ('es','en','de','pt','fr','it','nl','pl')
  on conflict on constraint avisos_email_pkey do nothing;

  if p_tipo = 'mensajes' then
    return query
    select a.usuario_id, u.email::text, a.idioma, a.baja, count(*)::int,
      (array_agg(distinct coalesce(nullif(pe.nombre, ''), '@' || pe.usuario)))[1:3], null::jsonb
    from public.avisos_email a
    join auth.users u on u.id = a.usuario_id
    join public.mensajes m on m.receptor_id = a.usuario_id
    join public.perfiles pe on pe.id = m.emisor_id
    where a.mensajes and u.email not like '%.invalid'
      and (a.hasta_mensajes is null or a.hasta_mensajes < now() - interval '1 hour')
      and not m.leido and m.creado_en <= corte
      and m.creado_en > coalesce(a.hasta_mensajes, now() - interval '2 days')
    group by a.usuario_id, u.email, a.idioma, a.baja;

  elsif p_tipo = 'foro' then
    return query
    select a.usuario_id, u.email::text, a.idioma, a.baja, count(*)::int,
      (array_agg(distinct coalesce(nullif(pe.nombre, ''), '@' || pe.usuario)))[1:3],
      jsonb_build_object('hilos', (array_agg(distinct h.titulo))[1:3], 'soluciones', count(*) filter (where n.tipo = 'solucion'))
    from public.avisos_email a
    join auth.users u on u.id = a.usuario_id
    join public.notificaciones n on n.usuario_id = a.usuario_id
    join public.foro_hilos h on h.id = n.hilo_id
    left join public.perfiles pe on pe.id = n.actor_id
    where a.foro and u.email not like '%.invalid'
      and (a.hasta_foro is null or a.hasta_foro < now() - interval '1 hour')
      and n.tipo in ('respuesta_foro', 'solucion') and not n.leida and n.creado_en <= corte
      and n.creado_en > coalesce(a.hasta_foro, now() - interval '2 days')
    group by a.usuario_id, u.email, a.idioma, a.baja;

  elsif p_tipo = 'resumen' then
    return query
    with avisos as (
      select n.usuario_id, n.tipo, count(*)::int c from public.notificaciones n
      where not n.leida and n.creado_en > now() - interval '7 days'
      group by 1, 2
    ), sin_leer as (
      select m.receptor_id usuario_id, count(*)::int c from public.mensajes m
      where not m.leido and m.creado_en > now() - interval '7 days' group by 1
    ), tareas as (
      select t.usuario_id, count(*)::int c from public.tareas ta join public.tanques t on t.id = ta.tanque_id
      where coalesce(ta.ultima_vez, ta.creado_en) + make_interval(days => ta.cada_dias) < now() + interval '7 days'
      group by 1
    )
    select a.usuario_id, u.email::text, a.idioma, a.baja,
      (coalesce((select sum(c) from avisos v where v.usuario_id = a.usuario_id), 0)
        + coalesce(s.c, 0) + coalesce(tr.c, 0))::int,
      null::text[],
      jsonb_build_object(
        'avisos', coalesce((select jsonb_object_agg(v.tipo, v.c) from avisos v where v.usuario_id = a.usuario_id), '{}'),
        'mensajes', coalesce(s.c, 0), 'tareas', coalesce(tr.c, 0))
    from public.avisos_email a
    join auth.users u on u.id = a.usuario_id
    left join sin_leer s on s.usuario_id = a.usuario_id
    left join tareas tr on tr.usuario_id = a.usuario_id
    where a.resumen and u.email not like '%.invalid'
      and (a.hasta_resumen is null or a.hasta_resumen < now() - interval '6 days')
      and (exists (select 1 from avisos v where v.usuario_id = a.usuario_id) or s.c > 0 or tr.c > 0);
  end if;
end $$;

-- Tras enviar: no se vuelve a avisar de lo anterior a este momento
create or replace function public.avisos_enviado(p_usuario uuid, p_tipo text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.avisos_email set
    hasta_mensajes = case when p_tipo = 'mensajes' then now() - interval '10 minutes' else hasta_mensajes end,
    hasta_foro = case when p_tipo = 'foro' then now() - interval '10 minutes' else hasta_foro end,
    hasta_resumen = case when p_tipo = 'resumen' then now() else hasta_resumen end
  where usuario_id = p_usuario;
end $$;

revoke execute on function public.avisos_por_enviar(text) from public, anon, authenticated;
revoke execute on function public.avisos_enviado(uuid, text) from public, anon, authenticated;
grant execute on function public.avisos_por_enviar(text) to service_role;
grant execute on function public.avisos_enviado(uuid, text) to service_role;
grant select, update on public.avisos_email to service_role;

-- 3) Programación. La clave compartida con la función se guarda en Vault (scripts/clave_avisos.mjs).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create or replace function public.lanzar_avisos(p_tipo text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  clave text := (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_clave');
begin
  if clave is null then return; end if; -- sin configurar todavía
  perform net.http_post(
    url := 'https://ivizkgmogzvscygcxepy.supabase.co/functions/v1/avisos',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-avisos', clave),
    body := jsonb_build_object('tipo', p_tipo),
    timeout_milliseconds := 60000);
end $$;
revoke execute on function public.lanzar_avisos(text) from public, anon, authenticated;

select cron.schedule('avisos-rapidos', '*/15 * * * *', $$ select public.lanzar_avisos('rapidos') $$);
-- Lunes a las 8:00 UTC (9:00/10:00 en España)
select cron.schedule('avisos-resumen', '0 8 * * 1', $$ select public.lanzar_avisos('resumen') $$);
