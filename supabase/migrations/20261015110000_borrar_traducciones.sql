-- Las traducciones guardadas (tabla traducciones) no tienen clave foránea con el contenido original,
-- así que al borrar una publicación, un comentario, un hilo o una respuesta (o una cuenta entera,
-- que borra todo en cascada) sus traducciones se quedaban. Ahora se borran con el original.

create or replace function public.borrar_traducciones()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.traducciones where tabla = tg_table_name and fila_id = old.id;
  return old;
end $$;

revoke execute on function public.borrar_traducciones() from public, anon, authenticated;

create trigger traducciones_publicaciones after delete on public.publicaciones
  for each row execute function public.borrar_traducciones();
create trigger traducciones_comentarios after delete on public.comentarios
  for each row execute function public.borrar_traducciones();
create trigger traducciones_foro_hilos after delete on public.foro_hilos
  for each row execute function public.borrar_traducciones();
create trigger traducciones_foro_respuestas after delete on public.foro_respuestas
  for each row execute function public.borrar_traducciones();

-- Limpieza de las que ya habían quedado huérfanas
delete from public.traducciones tr
where (tr.tabla = 'publicaciones' and not exists (select 1 from public.publicaciones x where x.id = tr.fila_id))
   or (tr.tabla = 'comentarios' and not exists (select 1 from public.comentarios x where x.id = tr.fila_id))
   or (tr.tabla = 'foro_hilos' and not exists (select 1 from public.foro_hilos x where x.id = tr.fila_id))
   or (tr.tabla = 'foro_respuestas' and not exists (select 1 from public.foro_respuestas x where x.id = tr.fila_id));
