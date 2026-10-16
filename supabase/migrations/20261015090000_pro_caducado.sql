-- El resumen del panel de administración contaba como Pro las tiendas con el plan caducado
-- (plan sigue en 'pro' hasta que alguien lo cambia). Ahora solo cuenta las vigentes, igual que
-- la web (esPro en src/lib/tiendas.js). Mismo cuerpo que en 20261013160000 salvo esa línea.
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
    'tiendas_pro', (select count(*) from public.tiendas where plan = 'pro' and (pro_hasta is null or pro_hasta >= current_date)),
    'reportes_pendientes', (select count(*) from public.reportes where estado = 'pendiente')
  ) into r;
  return r;
end $$;
