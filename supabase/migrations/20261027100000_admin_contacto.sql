-- Panel de administración, pestaña Usuarios: escribir a una persona o a muchas a la vez y seguirlas.
-- Canales:
--   mensaje → mensaje privado desde la cuenta del administrador (avisa por push/email como cualquier mensaje)
--   push    → notificación push directa (función `push`, tipo 'directo')
--   correo  → correo desde krill@tankily.com (función `avisos`, tipo 'admin')
-- Push y correo son "Novedades de Tankily": cada persona puede quitarlas en /avisos/ o con el enlace
-- de baja del propio correo. Nunca se escribe a las cuentas de demostración (*.invalid).

-- 1) Preferencia nueva: novedades del equipo, por email y por push (activadas por defecto)
alter table public.avisos_email
  add column novedades boolean not null default true,
  add column push_novedades boolean not null default true;
grant select (novedades, push_novedades) on public.avisos_email to authenticated;
grant insert (novedades, push_novedades) on public.avisos_email to authenticated;
grant update (novedades, push_novedades) on public.avisos_email to authenticated;

create or replace function public.baja_avisos(p_token uuid, p_tipo text default 'todo')
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.avisos_email set
    mensajes = mensajes and p_tipo not in ('mensajes', 'todo'),
    foro = foro and p_tipo not in ('foro', 'todo'),
    resumen = resumen and p_tipo not in ('resumen', 'todo'),
    recordatorios = recordatorios and p_tipo not in ('recordatorios', 'todo'),
    novedades = novedades and p_tipo not in ('novedades', 'todo')
  where baja = p_token;
  return found;
end $$;

-- 2) Registro de envíos: qué se mandó, a quién y cuántos llegaron. El correo lo lee de aquí la función.
create table public.admin_envios (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  canal text not null check (canal in ('mensaje', 'push', 'correo')),
  titulo text check (char_length(titulo) <= 120),
  texto text not null check (char_length(texto) between 1 and 2000),
  enlace text check (enlace ~ '^/[A-Za-z0-9/_?=&.%#-]*$' and char_length(enlace) <= 300),
  destinatarios uuid[] not null,
  pedidos int not null,
  enviados int,
  creado_en timestamptz not null default now()
);
alter table public.admin_envios enable row level security;
create policy "admin_envios: administradores" on public.admin_envios for select to authenticated
  using (public.es_admin());
revoke all on public.admin_envios from anon, authenticated;
grant select on public.admin_envios to authenticated;
grant select, update on public.admin_envios to service_role;

-- 3) Enviar. p_enlace: ruta de la web sin idioma ("/calculadoras/"); se añade el de cada persona.
-- Devuelve { envio, pedidos, destinatarios }: destinatarios = a cuántos se manda de verdad
-- (sin demo, sin uno mismo y, en push y correo, solo quien lo tiene activado).
create or replace function public.admin_enviar(p_canal text, p_usuarios uuid[], p_titulo text, p_texto text, p_enlace text default null, p_idioma text default 'es')
returns json language plpgsql security definer set search_path = '' as $$
declare
  yo uuid := auth.uid();
  clave text := (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_clave');
  lista uuid[];
  envio bigint;
  d record;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if p_canal not in ('mensaje', 'push', 'correo') then raise exception 'Canal no válido'; end if;
  if coalesce(array_length(p_usuarios, 1), 0) = 0 or array_length(p_usuarios, 1) > 1000 then raise exception 'Entre 1 y 1000 destinatarios'; end if;
  if p_canal <> 'mensaje' and nullif(trim(p_titulo), '') is null then raise exception 'Falta el título'; end if;
  if p_canal <> 'mensaje' and clave is null then raise exception 'Falta la clave de avisos en Vault'; end if;

  select coalesce(array_agg(u.id), '{}') into lista
  from auth.users u
  left join public.avisos_email a on a.usuario_id = u.id
  where u.id = any (p_usuarios) and u.id <> yo and u.email not like '%.invalid'
    and case p_canal
      when 'push' then coalesce(a.push_novedades, true) and exists (select 1 from public.push_suscripciones s where s.usuario_id = u.id)
      when 'correo' then coalesce(a.novedades, true) and u.email_confirmed_at is not null
      else true end;

  insert into public.admin_envios (canal, titulo, texto, enlace, destinatarios, pedidos, enviados)
  values (p_canal, nullif(trim(p_titulo), ''), trim(p_texto), nullif(trim(p_enlace), ''), lista,
    array_length(p_usuarios, 1), case when p_canal = 'correo' then null else coalesce(array_length(lista, 1), 0) end)
  returning id into envio;

  if p_canal = 'mensaje' then
    -- El enlace va al final del mensaje, como dirección completa; con el idioma en que se escribió,
    -- para que cada persona lo pueda leer traducido al suyo
    insert into public.mensajes (emisor_id, receptor_id, contenido, idioma)
    select yo, x, left(trim(p_texto) || coalesce(e'\n\nhttps://tankily.com' || nullif(trim(p_enlace), ''), ''), 2000),
      case when p_idioma ~ '^[a-z]{2}$' then p_idioma end
    from unnest(lista) x;
  elsif p_canal = 'push' then
    for d in select x id, coalesce(a.idioma, 'es') idioma from unnest(lista) x left join public.avisos_email a on a.usuario_id = x loop
      perform net.http_post(
        url := 'https://ivizkgmogzvscygcxepy.supabase.co/functions/v1/push',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-avisos', clave),
        body := jsonb_build_object('tipo', 'directo', 'usuario', d.id, 'titulo', trim(p_titulo), 'cuerpo', left(trim(p_texto), 200),
          'url', '/' || d.idioma || coalesce(nullif(trim(p_enlace), ''), '/'), 'etiqueta', 'novedades-' || envio),
        timeout_milliseconds := 30000);
    end loop;
  elsif coalesce(array_length(lista, 1), 0) > 0 then
    perform net.http_post(
      url := 'https://ivizkgmogzvscygcxepy.supabase.co/functions/v1/avisos',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-avisos', clave),
      body := jsonb_build_object('tipo', 'admin', 'envio', envio),
      timeout_milliseconds := 120000);
  end if;

  return json_build_object('envio', envio, 'pedidos', array_length(p_usuarios, 1), 'destinatarios', coalesce(array_length(lista, 1), 0));
end $$;
revoke execute on function public.admin_enviar(text, uuid[], text, text, text, text) from public, anon;
grant execute on function public.admin_enviar(text, uuid[], text, text, text, text) to authenticated;

-- Para la función `avisos`: el envío y sus destinatarios con correo, idioma y enlace de baja
create or replace function public.admin_envio_correos(p_envio bigint)
returns json language sql security definer set search_path = '' as $$
  select json_build_object(
    'titulo', e.titulo, 'texto', e.texto, 'enlace', e.enlace,
    'filas', coalesce((
      select json_agg(json_build_object('usuario_id', u.id, 'email', u.email, 'idioma', coalesce(a.idioma, 'es'), 'baja', a.baja))
      from unnest(e.destinatarios) x join auth.users u on u.id = x left join public.avisos_email a on a.usuario_id = u.id
      where coalesce(a.novedades, true)), '[]'::json))
  from public.admin_envios e where e.id = p_envio and e.canal = 'correo';
$$;
revoke execute on function public.admin_envio_correos(bigint) from public, anon, authenticated;
grant execute on function public.admin_envio_correos(bigint) to service_role;

-- Sin fila en avisos_email no hay token de baja: se crea al enviar el primer correo de novedades
create or replace function public.admin_token_baja(p_usuario uuid)
returns uuid language sql security definer set search_path = '' as $$
  insert into public.avisos_email (usuario_id) values (p_usuario)
  on conflict (usuario_id) do update set usuario_id = excluded.usuario_id
  returning baja;
$$;
revoke execute on function public.admin_token_baja(uuid) from public, anon, authenticated;
grant execute on function public.admin_token_baja(uuid) to service_role;

-- 4) Seguir o dejar de seguir a varias personas a la vez (la notificación "te sigue" sale como siempre)
create or replace function public.admin_seguir(p_usuarios uuid[], p_seguir boolean)
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if p_seguir then
    insert into public.seguidores (seguidor_id, seguido_id)
    select auth.uid(), p.id from public.perfiles p where p.id = any (p_usuarios) and p.id <> auth.uid()
    on conflict do nothing;
  else
    delete from public.seguidores where seguidor_id = auth.uid() and seguido_id = any (p_usuarios);
  end if;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.admin_seguir(uuid[], boolean) from public, anon;
grant execute on function public.admin_seguir(uuid[], boolean) to authenticated;

-- 5) La lista de usuarios dice también si ya los sigo y qué novedades aceptan
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
      coalesce((select a.resumen from public.avisos_email a where a.usuario_id = p.id), false) resumen,
      coalesce((select a.novedades from public.avisos_email a where a.usuario_id = p.id), true) novedades,
      coalesce((select a.push_novedades from public.avisos_email a where a.usuario_id = p.id), true) push_novedades,
      exists (select 1 from public.seguidores s where s.seguidor_id = auth.uid() and s.seguido_id = p.id) sigo
    from public.perfiles p join auth.users u on u.id = p.id
    where p_demo is null or (u.email like '%.invalid') = p_demo
    order by p.creado_en desc
    limit 500
  ) f;
  return r;
end $$;
revoke execute on function public.admin_usuarios(boolean) from public, anon;
grant execute on function public.admin_usuarios(boolean) to authenticated;
