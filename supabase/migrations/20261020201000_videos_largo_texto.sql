-- La migración de vídeos reutilizó el nombre publicaciones_contenido_check, que era el automático del límite de
-- 2.000 caracteres del texto: se restaura ese límite con un nombre propio.
alter table public.publicaciones drop constraint if exists publicaciones_contenido_largo;
alter table public.publicaciones add constraint publicaciones_contenido_largo check (char_length(contenido) <= 2000);
