-- Estado del chat: además de la hora exacta de la última conexión (conexiones.visto_en), el último día que la
-- persona entró en la web (actividad_diaria), para poder decir "últ. vez ayer" a quien aún no tiene hora exacta.
-- Igual que antes, solo con una conversación entre las dos personas.

create or replace function public.estado_chat(p_con uuid) returns json
language sql stable security definer set search_path = '' as $$
  with hablan as (
    select exists (
      select 1 from public.mensajes m
      where (m.emisor_id = auth.uid() and m.receptor_id = p_con) or (m.emisor_id = p_con and m.receptor_id = auth.uid())
    ) si
  )
  select json_build_object(
    'idioma', (select a.idioma from public.avisos_email a where a.usuario_id = p_con),
    'visto_en', case when hablan.si then (select c.visto_en from public.conexiones c where c.usuario_id = p_con) end,
    'ultimo_dia', case when hablan.si then (select max(a.dia) from public.actividad_diaria a where a.usuario_id = p_con) end)
  from hablan
  where auth.uid() is not null;
$$;
revoke execute on function public.estado_chat(uuid) from public, anon;
grant execute on function public.estado_chat(uuid) to authenticated;
