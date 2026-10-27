-- Mensajes privados denunciados: el administrador solo puede leer un mensaje si alguien lo ha
-- denunciado, y con él el trozo de esa conversación que lo rodea (hasta 10 antes y 10 después)
-- para entender el contexto. El resto de mensajes privados sigue sin ser visible para nadie más.

create or replace function public.admin_mensaje_denunciado(p_mensaje bigint)
returns json language plpgsql security definer set search_path = '' as $$
declare
  m record;
  r json;
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if not exists (select 1 from public.reportes x where x.tipo = 'mensaje' and x.objeto_id = p_mensaje::text) then
    raise exception 'Este mensaje no tiene denuncias';
  end if;
  select * into m from public.mensajes where id = p_mensaje;
  if not found then return null; end if;

  select json_agg(f order by f.creado_en) into r from (
    (select x.id, x.emisor_id, x.contenido, x.creado_en from public.mensajes x
     where ((x.emisor_id = m.emisor_id and x.receptor_id = m.receptor_id) or (x.emisor_id = m.receptor_id and x.receptor_id = m.emisor_id))
       and x.creado_en <= m.creado_en
     order by x.creado_en desc limit 11)
    union
    (select x.id, x.emisor_id, x.contenido, x.creado_en from public.mensajes x
     where ((x.emisor_id = m.emisor_id and x.receptor_id = m.receptor_id) or (x.emisor_id = m.receptor_id and x.receptor_id = m.emisor_id))
       and x.creado_en > m.creado_en
     order by x.creado_en limit 10)
  ) f;

  return json_build_object(
    'mensaje', m.id,
    'emisor', (select json_build_object('id', p.id, 'usuario', p.usuario, 'nombre', p.nombre) from public.perfiles p where p.id = m.emisor_id),
    'receptor', (select json_build_object('id', p.id, 'usuario', p.usuario, 'nombre', p.nombre) from public.perfiles p where p.id = m.receptor_id),
    'conversacion', coalesce(r, '[]'::json));
end $$;
revoke execute on function public.admin_mensaje_denunciado(bigint) from public, anon;
grant execute on function public.admin_mensaje_denunciado(bigint) to authenticated;

-- Borrar un mensaje denunciado (sus denuncias quedan como revisadas)
create or replace function public.admin_borrar_mensaje(p_mensaje bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if not exists (select 1 from public.reportes x where x.tipo = 'mensaje' and x.objeto_id = p_mensaje::text) then
    raise exception 'Este mensaje no tiene denuncias';
  end if;
  delete from public.mensajes where id = p_mensaje;
  update public.reportes set estado = 'revisado' where tipo = 'mensaje' and objeto_id = p_mensaje::text;
end $$;
revoke execute on function public.admin_borrar_mensaje(bigint) from public, anon;
grant execute on function public.admin_borrar_mensaje(bigint) to authenticated;
