-- Panel de administración y estadísticas de tiendas.
--
-- 1. Acciones de administrador sobre campos protegidos (plan Pro, verificación, destacados, hilos
--    fijados/cerrados). Esos campos solo se pueden cambiar con la service role; estas funciones
--    comprueban que quien llama es administrador (perfiles.es_admin) y hacen el cambio.
-- 2. Visitas de tiendas por día (vistas de la ficha, clics en contacto y en la web), que las
--    tiendas Pro ven en su panel. Cualquiera puede registrar una visita; solo el dueño y los
--    administradores pueden leerlas.

create or replace function public.admin_tienda(p_tienda bigint, p_plan text, p_pro_hasta date, p_verificada boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if p_plan not in ('gratis', 'pro') then raise exception 'Plan no válido'; end if;
  update public.tiendas
    set plan = p_plan,
        pro_hasta = case when p_plan = 'pro' then p_pro_hasta else null end,
        verificada = p_verificada
    where id = p_tienda;
end $$;

create or replace function public.admin_hilo(p_hilo bigint, p_fijado boolean, p_cerrado boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  update public.foro_hilos set fijado = p_fijado, cerrado = p_cerrado where id = p_hilo;
end $$;

create or replace function public.admin_anuncio(p_anuncio bigint, p_destacado boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  update public.anuncios set destacado = p_destacado where id = p_anuncio;
end $$;

-- Resumen para la portada del panel
create or replace function public.admin_resumen()
returns json language plpgsql security definer set search_path = '' as $$
declare r json;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  select json_build_object(
    'usuarios', (select count(*) from public.perfiles),
    'usuarios_7d', (select count(*) from public.perfiles where creado_en > now() - interval '7 days'),
    'tanques', (select count(*) from public.tanques),
    'publicaciones_7d', (select count(*) from public.publicaciones where creado_en > now() - interval '7 days'),
    'hilos_7d', (select count(*) from public.foro_hilos where creado_en > now() - interval '7 days'),
    'anuncios_activos', (select count(*) from public.anuncios where estado = 'activo'),
    'tiendas', (select count(*) from public.tiendas),
    'tiendas_pro', (select count(*) from public.tiendas where plan = 'pro'),
    'reportes_pendientes', (select count(*) from public.reportes where estado = 'pendiente')
  ) into r;
  return r;
end $$;

revoke execute on function public.admin_tienda(bigint, text, date, boolean) from public, anon;
revoke execute on function public.admin_hilo(bigint, boolean, boolean) from public, anon;
revoke execute on function public.admin_anuncio(bigint, boolean) from public, anon;
revoke execute on function public.admin_resumen() from public, anon;
grant execute on function public.admin_tienda(bigint, text, date, boolean) to authenticated;
grant execute on function public.admin_hilo(bigint, boolean, boolean) to authenticated;
grant execute on function public.admin_anuncio(bigint, boolean) to authenticated;
grant execute on function public.admin_resumen() to authenticated;

-- --- Estadísticas de tiendas ---------------------------------------------------
create table public.tienda_visitas (
  tienda_id bigint not null references public.tiendas on delete cascade,
  dia date not null default current_date,
  vistas int not null default 0,
  contactos int not null default 0,
  web int not null default 0,
  primary key (tienda_id, dia)
);
alter table public.tienda_visitas enable row level security;
create policy "visitas: dueño o admin" on public.tienda_visitas for select to authenticated
  using (public.es_admin() or exists (select 1 from public.tiendas t where t.id = tienda_id and t.propietario_id = (select auth.uid())));
revoke insert, update, delete on public.tienda_visitas from anon, authenticated;

-- Suma una visita del tipo indicado al día de hoy (se llama desde la ficha de la tienda)
create or replace function public.registrar_visita_tienda(p_tienda bigint, p_tipo text default 'vista')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_tipo not in ('vista', 'contacto', 'web') then return; end if;
  insert into public.tienda_visitas (tienda_id, dia, vistas, contactos, web)
    values (p_tienda, current_date, (p_tipo = 'vista')::int, (p_tipo = 'contacto')::int, (p_tipo = 'web')::int)
  on conflict (tienda_id, dia) do update set
    vistas = public.tienda_visitas.vistas + excluded.vistas,
    contactos = public.tienda_visitas.contactos + excluded.contactos,
    web = public.tienda_visitas.web + excluded.web;
end $$;
grant execute on function public.registrar_visita_tienda(bigint, text) to anon, authenticated;
