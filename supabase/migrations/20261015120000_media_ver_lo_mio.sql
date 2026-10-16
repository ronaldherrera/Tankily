-- Cada usuario puede listar los archivos de SU carpeta del bucket media. Sin esta política, la API
-- de Storage no deja listar ni borrar (borrar exige poder ver el archivo), así que al eliminar la
-- cuenta sus fotos se quedaban. Las imágenes se siguen sirviendo por su URL pública como antes;
-- esto no permite ver ni listar las carpetas de otros.
create policy "media: ver lo mío" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
