-- La baja desde el correo también sirve para los recordatorios de mantenimiento
create or replace function public.baja_avisos(p_token uuid, p_tipo text default 'todo')
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.avisos_email set
    mensajes = mensajes and p_tipo not in ('mensajes', 'todo'),
    foro = foro and p_tipo not in ('foro', 'todo'),
    resumen = resumen and p_tipo not in ('resumen', 'todo'),
    recordatorios = recordatorios and p_tipo not in ('recordatorios', 'todo')
  where baja = p_token;
  return found;
end $$;
