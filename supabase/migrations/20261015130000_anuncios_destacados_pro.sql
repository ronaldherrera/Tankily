-- El plan Pro promete "anuncios destacados en el mercado", pero `anuncios.destacado` solo lo podía
-- activar un administrador a mano. Ahora un anuncio está destacado si lo marcó un administrador
-- o si es de una tienda con el Pro vigente (y deja de estarlo solo cuando el Pro caduca).
-- Es un campo calculado de PostgREST: la web lo pide y ordena por él como si fuera una columna.
create or replace function public.destacado_ahora(a public.anuncios)
returns boolean language sql stable set search_path = '' as $$
  select a.destacado or exists (
    select 1 from public.tiendas t
    where t.id = a.tienda_id and t.plan = 'pro' and (t.pro_hasta is null or t.pro_hasta >= current_date)
  );
$$;

grant execute on function public.destacado_ahora(public.anuncios) to anon, authenticated;
