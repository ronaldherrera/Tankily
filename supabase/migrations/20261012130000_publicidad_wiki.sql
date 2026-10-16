-- Las campañas propias también pueden mostrarse en WikiTank
alter table public.campanas drop constraint if exists campanas_ubicacion_check;
alter table public.campanas add constraint campanas_ubicacion_check
  check (ubicacion in ('feed', 'lateral', 'mercado', 'foro', 'tiendas', 'wiki'));
