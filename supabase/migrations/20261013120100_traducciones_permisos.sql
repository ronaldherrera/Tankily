-- Al editar un texto también puede cambiar su idioma
grant update (idioma) on public.publicaciones to authenticated;
grant update (idioma) on public.foro_hilos to authenticated;
grant update (idioma) on public.foro_respuestas to authenticated;
