-- Mensajes privados traducidos: cada uno se escribe en su idioma y quien lo recibe lo lee en el suyo
-- (con "Ver original"), igual que las publicaciones. Ver src/lib/traduccion.js y la función `traducir`.

-- Idioma en que se escribió cada mensaje (los anteriores quedan sin idioma y no se traducen)
alter table public.mensajes add column if not exists idioma text check (idioma ~ '^[a-z]{2}$');

-- Caché de traducciones: la de un mensaje solo la pueden leer el emisor y el receptor
-- (la subconsulta respeta la RLS de mensajes de quien lee)
drop policy if exists "traducciones: lectura" on public.traducciones;
create policy "traducciones: lectura" on public.traducciones for select using (
  case tabla
    when 'publicaciones' then exists (select 1 from public.publicaciones p where p.id = fila_id)
    when 'comentarios' then exists (select 1 from public.comentarios c where c.id = fila_id)
    when 'mensajes' then exists (select 1 from public.mensajes m where m.id = fila_id)
    else true -- foro: hilos y respuestas son públicos
  end
);

-- Al borrar un mensaje (o la cuenta) se borran también sus traducciones
create trigger traducciones_mensajes after delete on public.mensajes
  for each row execute function public.borrar_traducciones();
