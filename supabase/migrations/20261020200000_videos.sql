-- Vídeos cortos en las publicaciones. El archivo vive en Cloudflare R2 (Worker worker/media, sin coste de descarga);
-- aquí solo se guarda dónde está: { url, poster, duracion (s), ancho, alto }.

alter table public.publicaciones add column if not exists video jsonb
  check (
    video is null or (
      jsonb_typeof(video) = 'object'
      and video->>'url' ~ '^https://[a-z0-9.-]+\.workers\.dev/'
      and (video->>'poster' is null or video->>'poster' ~ '^https://[a-z0-9.-]+\.workers\.dev/')
      and coalesce((video->>'duracion')::numeric, 0) <= 61
    )
  );

-- Una publicación puede llevar solo vídeo (antes hacía falta texto, fotos o ser un eco)
do $$
declare c text;
begin
  select conname into c from pg_constraint
  where conrelid = 'public.publicaciones'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%eco_de IS NOT NULL%';
  if c is not null then execute format('alter table public.publicaciones drop constraint %I', c); end if;
end $$;
alter table public.publicaciones drop constraint if exists publicaciones_contenido_check;
alter table public.publicaciones add constraint publicaciones_contenido_check
  check (contenido <> '' or cardinality(imagenes) > 0 or eco_de is not null or video is not null);
