-- El upsert de la web (insert … on conflict do update) reescribe todas las columnas enviadas, también
-- usuario_id: sin este permiso daba 403. La política de UPDATE sigue obligando a que sea la propia fila.
grant update (usuario_id) on public.avisos_email to authenticated;
