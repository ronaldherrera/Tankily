-- Métricas de crecimiento y enganche para el panel de administración (pestaña "Crecimiento").
-- Datos propios y mínimos: qué días entra cada persona con sesión (sin páginas, horas ni dispositivo).
-- Con eso y lo que ya hay en la base de datos se calculan activos, embudo de activación y retención.
-- Las cuentas de demostración (*.invalid) no cuentan.

create table public.actividad_diaria (
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  dia date not null default current_date,
  primary key (usuario_id, dia)
);
alter table public.actividad_diaria enable row level security;
create policy "actividad_diaria: apuntar la mía" on public.actividad_diaria for insert to authenticated
  with check (usuario_id = (select auth.uid()) and dia = current_date);
revoke all on public.actividad_diaria from anon, authenticated;
grant insert (usuario_id, dia) on public.actividad_diaria to authenticated;

-- La web la llama una vez al día por persona (si ya estaba apuntado, no hace nada)
create or replace function public.apuntar_visita() returns void
language sql security definer set search_path = '' as $$
  insert into public.actividad_diaria (usuario_id) select auth.uid() where auth.uid() is not null
  on conflict do nothing;
$$;
revoke execute on function public.apuntar_visita() from public, anon;
grant execute on function public.apuntar_visita() to authenticated;

create or replace function public.admin_crecimiento()
returns json language plpgsql security definer set search_path = '' as $$
declare r json;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;

  with reales as (
    select p.id, p.creado_en from public.perfiles p join auth.users u on u.id = p.id
    where u.email not like '%.invalid'
  ),
  act as (select a.* from public.actividad_diaria a join reales r on r.id = a.usuario_id),
  -- Lo que ha hecho cada persona (para el embudo)
  hizo as (
    select r.id, r.creado_en,
      exists (select 1 from public.tanques t where t.usuario_id = r.id) tanque,
      exists (select 1 from public.mediciones m join public.tanques t on t.id = m.tanque_id where t.usuario_id = r.id)
        or exists (select 1 from public.tanque_eventos e join public.tanques t on t.id = e.tanque_id where t.usuario_id = r.id) apunta,
      exists (select 1 from public.publicaciones x where x.usuario_id = r.id)
        or exists (select 1 from public.foro_hilos x where x.usuario_id = r.id)
        or exists (select 1 from public.foro_respuestas x where x.usuario_id = r.id)
        or exists (select 1 from public.comentarios x where x.usuario_id = r.id) participa,
      exists (select 1 from act a where a.usuario_id = r.id and a.dia >= (r.creado_en::date + 7)) vuelve
    from reales r
  ),
  semanas as (select generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week')::date semana),
  cohortes as (
    select date_trunc('week', r.creado_en)::date semana, r.id, r.creado_en::date alta
    from reales r where r.creado_en > date_trunc('week', now()) - interval '8 weeks'
  )
  select json_build_object(
    'activos', json_build_object(
      'dia', (select count(distinct usuario_id) from act where dia = current_date),
      'semana', (select count(distinct usuario_id) from act where dia > current_date - 7),
      'mes', (select count(distinct usuario_id) from act where dia > current_date - 30),
      'total', (select count(*) from reales)),
    'embudo', (select json_build_object(
      'registro', count(*), 'tanque', count(*) filter (where tanque), 'apunta', count(*) filter (where apunta),
      'participa', count(*) filter (where participa), 'vuelve', count(*) filter (where vuelve and creado_en < now() - interval '7 days'),
      'vuelve_base', count(*) filter (where creado_en < now() - interval '7 days')) from hizo),
    'avisos', json_build_object(
      'push', (select count(distinct s.usuario_id) from public.push_suscripciones s join reales r on r.id = s.usuario_id),
      'resumen', (select count(*) from public.avisos_email a join reales r on r.id = a.usuario_id where a.resumen)),
    -- Altas y activos por semana (últimas 12)
    'semanas', (select json_agg(json_build_object('semana', s.semana,
        'altas', (select count(*) from reales r where date_trunc('week', r.creado_en)::date = s.semana),
        'activos', (select count(distinct a.usuario_id) from act a where date_trunc('week', a.dia)::date = s.semana))
      order by s.semana) from semanas s),
    -- Retención: de quienes se registraron cada semana, qué parte volvió en la semana 1, 2, 3 y 4
    'cohortes', (select json_agg(json_build_object('semana', c.semana, 'personas', c.n, 'retencion', array(
        select case when c.semana + 6 + w * 7 + 6 > current_date then null else round(100.0 * (
          select count(*) from cohortes k where k.semana = c.semana and exists (
            select 1 from act a where a.usuario_id = k.id and a.dia between k.alta + w * 7 and k.alta + w * 7 + 6)) / c.n) end
        from generate_series(1, 4) w order by w)) order by c.semana desc)
      from (select semana, count(*) n from cohortes group by semana) c)
  ) into r;
  return r;
end $$;
revoke execute on function public.admin_crecimiento() from public, anon;
grant execute on function public.admin_crecimiento() to authenticated;
