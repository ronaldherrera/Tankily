-- Mantenimiento con calendario: cada tarea (y el cambio de agua del tanque) puede tener una fecha
-- concreta para la próxima vez. Si la tiene, manda sobre "última vez + cada N días"; al marcarla como
-- hecha se borra y la tarea vuelve a su ritmo normal desde ese día.

alter table public.tareas add column proxima date;
alter table public.tanques add column cambio_agua_proximo date;

-- Cuándo toca una tarea (lo mismo que calcula la web en src/lib/tareas.js)
create or replace function public.toca_tarea(p_proxima date, p_ultima timestamptz, p_desde timestamptz, p_cada int)
returns timestamptz language sql immutable set search_path = '' as $$
  select case
    when p_proxima is not null then p_proxima::timestamp at time zone 'UTC'
    when p_ultima is not null then p_ultima + make_interval(days => p_cada)
    else p_desde end;
$$;

-- Los recordatorios (email y push) y el resumen semanal usan la fecha programada
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
      where public.toca_tarea(ta.proxima, ta.ultima_vez, ta.creado_en, ta.cada_dias) < now() + interval '7 days'
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

  elsif p_tipo = 'recordatorios' then
    return query
    with vencen as (
      -- Tareas normales
      select t.usuario_id, t.id tanque_id, t.nombre tanque, ta.tipo, ta.nombre,
        public.toca_tarea(ta.proxima, ta.ultima_vez, ta.creado_en, ta.cada_dias) toca
      from public.tareas ta join public.tanques t on t.id = ta.tanque_id
      union all
      -- Cambio de agua (tarea "virtual" del tanque)
      select t.usuario_id, t.id, t.nombre, 'cambio_agua', null,
        public.toca_tarea(t.cambio_agua_proximo,
          (select max(e.fecha) from public.tanque_eventos e where e.tanque_id = t.id and e.tipo = 'cambio_agua'),
          t.creado_en + make_interval(days => t.cambio_agua_cada_dias), t.cambio_agua_cada_dias)
      from public.tanques t where t.cambio_agua_cada_dias is not null
    )
    select a.usuario_id, u.email::text, a.idioma, a.baja, count(*)::int, null::text[],
      jsonb_build_object(
        'tareas', jsonb_path_query_array(jsonb_agg(jsonb_build_object('tipo', v.tipo, 'nombre', v.nombre, 'tanque', v.tanque, 'tanque_id', v.tanque_id) order by v.toca), '$[0 to 4]'),
        'email', a.recordatorios,
        'push', a.push_recordatorios and exists (select 1 from public.push_suscripciones s where s.usuario_id = a.usuario_id))
    from public.avisos_email a
    join auth.users u on u.id = a.usuario_id
    join vencen v on v.usuario_id = a.usuario_id
    where u.email not like '%.invalid'
      and (a.recordatorios or (a.push_recordatorios and exists (select 1 from public.push_suscripciones s where s.usuario_id = a.usuario_id)))
      and v.toca > coalesce(a.hasta_recordatorios, now() - interval '1 day')
      and v.toca <= now() + interval '12 hours'
    group by a.usuario_id, u.email, a.idioma, a.baja, a.recordatorios, a.push_recordatorios;

  elsif p_tipo = 'empujon' then
    return query
    select a.usuario_id, u.email::text, a.idioma, a.baja, 1, null::text[], null::jsonb
    from public.avisos_email a
    join auth.users u on u.id = a.usuario_id
    join public.perfiles p on p.id = a.usuario_id
    where u.email not like '%.invalid' and not a.empujon_enviado
      and (a.mensajes or a.foro or a.resumen or a.recordatorios)
      and p.creado_en between now() - interval '72 hours' and now() - interval '48 hours'
      and not exists (select 1 from public.tanques t where t.usuario_id = a.usuario_id);
  end if;
end $$;
