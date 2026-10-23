-- Chat: "en línea" / "últ. vez hace…" y a qué idioma se traducen tus mensajes para la otra persona.
-- La web apunta la conexión cada minuto mientras está a la vista (AppShell.js) y el chat pregunta por el
-- estado de la otra persona (estado_chat). Solo ve tu última conexión quien tiene una conversación contigo.

create table if not exists public.conexiones (
  usuario_id uuid primary key references public.perfiles on delete cascade,
  visto_en timestamptz not null default now()
);
alter table public.conexiones enable row level security;
-- Sin políticas: solo se escribe y se lee con las dos funciones de abajo
revoke all on public.conexiones from anon, authenticated;

create or replace function public.marcar_conexion() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.conexiones (usuario_id, visto_en) values (auth.uid(), now())
  on conflict (usuario_id) do update set visto_en = now();
end $$;
revoke execute on function public.marcar_conexion() from public, anon;
grant execute on function public.marcar_conexion() to authenticated;

-- idioma: en el que la otra persona usa la web (sus mensajes recibidos se le traducen a él)
-- visto_en: su última conexión, solo si ya hay mensajes entre las dos personas
create or replace function public.estado_chat(p_con uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'idioma', (select a.idioma from public.avisos_email a where a.usuario_id = p_con),
    'visto_en', case when exists (
        select 1 from public.mensajes m
        where (m.emisor_id = auth.uid() and m.receptor_id = p_con) or (m.emisor_id = p_con and m.receptor_id = auth.uid())
      ) then (select c.visto_en from public.conexiones c where c.usuario_id = p_con) end)
  where auth.uid() is not null;
$$;
revoke execute on function public.estado_chat(uuid) from public, anon;
grant execute on function public.estado_chat(uuid) to authenticated;
