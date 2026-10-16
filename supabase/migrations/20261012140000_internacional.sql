-- Tankily mundial: país (ISO 3166-1 alfa-2) en perfiles, anuncios y tiendas, y moneda en anuncios.
-- La columna "provincia" pasa a significar provincia o región (texto libre fuera de España).

alter table public.perfiles add column if not exists pais text check (pais ~ '^[A-Z]{2}$');

alter table public.anuncios add column if not exists pais text not null default 'ES' check (pais ~ '^[A-Z]{2}$');
alter table public.anuncios add column if not exists moneda text not null default 'EUR' check (moneda ~ '^[A-Z]{3}$');
create index if not exists anuncios_pais_idx on public.anuncios (pais);

alter table public.tiendas add column if not exists pais text not null default 'ES' check (pais ~ '^[A-Z]{2}$');
create index if not exists tiendas_pais_idx on public.tiendas (pais);

-- Permisos de edición por columna: añadir las nuevas
grant update (pais) on public.perfiles to authenticated;
grant update (pais, moneda) on public.anuncios to authenticated;
grant update (pais) on public.tiendas to authenticated;
