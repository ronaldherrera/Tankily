-- El prototipo archivado no debe ser accesible por la API
revoke all on all tables in schema prototipo from anon, authenticated;
revoke all on all sequences in schema prototipo from anon, authenticated;

-- Las funciones de trigger no deben poder llamarse directamente vía RPC
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;
revoke execute on function public.extraer_etiquetas() from public, anon, authenticated;
revoke execute on function public.tras_publicacion() from public, anon, authenticated;
revoke execute on function public.tras_borrar_publicacion() from public, anon, authenticated;
revoke execute on function public.contar_me_gusta() from public, anon, authenticated;
revoke execute on function public.contar_comentarios() from public, anon, authenticated;
revoke execute on function public.tras_seguir() from public, anon, authenticated;
revoke execute on function public.tras_seguir_tanque() from public, anon, authenticated;
revoke execute on function public.tras_respuesta_foro() from public, anon, authenticated;
revoke execute on function public.validar_solucion() from public, anon, authenticated;
revoke execute on function public.contar_votos() from public, anon, authenticated;
revoke execute on function public.recalcular_valoracion() from public, anon, authenticated;
revoke execute on function public.tocar_actualizado() from public, anon, authenticated;
