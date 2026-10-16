-- Anuncios guardados (favoritos del mercado). Privados: cada usuario solo ve y gestiona los suyos.
create table public.anuncios_guardados (
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  anuncio_id bigint not null references public.anuncios on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, anuncio_id)
);
create index on public.anuncios_guardados (anuncio_id);

alter table public.anuncios_guardados enable row level security;
create policy "guardados: ver los míos" on public.anuncios_guardados for select to authenticated using (usuario_id = (select auth.uid()));
create policy "guardados: guardar" on public.anuncios_guardados for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "guardados: quitar" on public.anuncios_guardados for delete to authenticated using (usuario_id = (select auth.uid()));
revoke all on public.anuncios_guardados from anon;
