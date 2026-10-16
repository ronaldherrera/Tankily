-- Tareas periódicas de mantenimiento por tanque (test del agua, filtro, abono…).
-- El cambio de agua no va aquí: sigue usando tanques.cambio_agua_cada_dias y los eventos del diario.
-- Son privadas: solo el dueño del tanque las ve y las gestiona.

create table public.tareas (
  id bigint generated always as identity primary key,
  tanque_id bigint not null references public.tanques on delete cascade,
  tipo text not null check (tipo in ('test','filtro','limpieza','abono','dosificacion','poda','alimento','otro')),
  nombre text check (char_length(nombre) between 1 and 60),
  cada_dias int not null check (cada_dias between 1 and 365),
  ultima_vez timestamptz,
  creado_en timestamptz not null default now(),
  -- Una tarea "otro" necesita nombre
  constraint tareas_nombre_otro check (tipo <> 'otro' or nombre is not null)
);
create index on public.tareas (tanque_id);

alter table public.tareas enable row level security;

create policy "tareas: dueño" on public.tareas for all to authenticated
  using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));

revoke all on public.tareas from anon;
