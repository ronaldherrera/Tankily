-- Notificaciones push (Web Push) en los dispositivos donde la persona las activa (/avisos/).
-- Al momento, sin agrupar: un mensaje nuevo o una notificación (respuestas del foro, comentarios,
-- menciones, seguidores…) llama a la Edge Function `push` por pg_net con la misma clave que los avisos
-- por email (Vault: avisos_clave). Los "me gusta" no se notifican por push: serían demasiados.

-- 1) Qué quiere recibir por push (en la misma fila que los avisos por email)
alter table public.avisos_email
  add column push_mensajes boolean not null default true,
  add column push_foro boolean not null default true,
  add column push_actividad boolean not null default true;
grant select (push_mensajes, push_foro, push_actividad) on public.avisos_email to authenticated;
grant insert (push_mensajes, push_foro, push_actividad) on public.avisos_email to authenticated;
grant update (push_mensajes, push_foro, push_actividad) on public.avisos_email to authenticated;

-- 2) Suscripciones: una por navegador/dispositivo
create table public.push_suscripciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  creado_en timestamptz not null default now()
);
create index on public.push_suscripciones (usuario_id);
alter table public.push_suscripciones enable row level security;

create policy "push_suscripciones: las mías" on public.push_suscripciones for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "push_suscripciones: quitar las mías" on public.push_suscripciones for delete to authenticated
  using (usuario_id = (select auth.uid()));
revoke all on public.push_suscripciones from anon, authenticated;
grant select (id, endpoint, creado_en), delete on public.push_suscripciones to authenticated;
grant select, delete on public.push_suscripciones to service_role;

-- Guardar la suscripción de este dispositivo. Si el navegador ya estaba suscrito con otra cuenta
-- (dispositivo compartido), pasa a la cuenta actual: los avisos siguen a quien tiene la sesión abierta.
create or replace function public.guardar_push(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into public.push_suscripciones (usuario_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set usuario_id = excluded.usuario_id, p256dh = excluded.p256dh,
    auth = excluded.auth, creado_en = now();
end $$;
revoke execute on function public.guardar_push(text, text, text) from public, anon;
grant execute on function public.guardar_push(text, text, text) to authenticated;

-- 3) Envío al momento
create or replace function public.lanzar_push(p_tipo text, p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  clave text := (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_clave');
begin
  if clave is null then return; end if;
  perform net.http_post(
    url := 'https://ivizkgmogzvscygcxepy.supabase.co/functions/v1/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-avisos', clave),
    body := jsonb_build_object('tipo', p_tipo, 'id', p_id),
    timeout_milliseconds := 30000);
end $$;
revoke execute on function public.lanzar_push(text, bigint) from public, anon, authenticated;

-- Solo se llama a la función si quien recibe tiene algún dispositivo suscrito y ese tipo activado
create or replace function public.push_mensaje() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.push_suscripciones s where s.usuario_id = new.receptor_id)
    and coalesce((select a.push_mensajes from public.avisos_email a where a.usuario_id = new.receptor_id), true) then
    perform public.lanzar_push('mensaje', new.id);
  end if;
  return null;
end $$;

create or replace function public.push_notificacion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grupo text := case when new.tipo in ('respuesta_foro', 'solucion') then 'foro'
    when new.tipo = 'me_gusta' then null else 'actividad' end;
begin
  if grupo is not null
    and exists (select 1 from public.push_suscripciones s where s.usuario_id = new.usuario_id)
    and coalesce((select case grupo when 'foro' then a.push_foro else a.push_actividad end
      from public.avisos_email a where a.usuario_id = new.usuario_id), true) then
    perform public.lanzar_push('notificacion', new.id);
  end if;
  return null;
end $$;
revoke execute on function public.push_mensaje() from public, anon, authenticated;
revoke execute on function public.push_notificacion() from public, anon, authenticated;

create trigger mensajes_push after insert on public.mensajes
  for each row execute function public.push_mensaje();
create trigger notificaciones_push after insert on public.notificaciones
  for each row execute function public.push_notificacion();
