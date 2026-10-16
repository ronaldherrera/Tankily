-- Traducción del contenido de los usuarios ("Traducido del francés · Ver original").
-- 1. Cada texto guarda el idioma en que se escribió (ISO 639-1).
-- 2. Caché compartida: cada texto se traduce una sola vez por idioma de destino.
--    La lee cualquiera; solo la escribe la función `traducir` (service role), para que
--    nadie pueda colar traducciones falsas.

alter table public.publicaciones add column if not exists idioma text check (idioma ~ '^[a-z]{2}$');
alter table public.comentarios add column if not exists idioma text check (idioma ~ '^[a-z]{2}$');
alter table public.foro_hilos add column if not exists idioma text check (idioma ~ '^[a-z]{2}$');
alter table public.foro_respuestas add column if not exists idioma text check (idioma ~ '^[a-z]{2}$');

create table public.traducciones (
  tabla text not null check (tabla in ('publicaciones','comentarios','foro_hilos','foro_respuestas')),
  fila_id bigint not null,
  campo text not null check (campo in ('contenido','titulo')),
  idioma text not null check (idioma ~ '^[a-z]{2}$'),
  -- Huella del texto original: si se edita, la traducción guardada deja de valer
  huella text not null,
  texto text not null,
  creado_en timestamptz not null default now(),
  primary key (tabla, fila_id, campo, idioma)
);

alter table public.traducciones enable row level security;
create policy "traducciones: lectura" on public.traducciones for select using (true);
revoke insert, update, delete on public.traducciones from anon, authenticated;
