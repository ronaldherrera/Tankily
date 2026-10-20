-- Plan Pro de pago con Stripe. Cada tienda paga con un enlace de pago de Stripe (lleva su id como
-- client_reference_id) y la Edge Function `stripe` recibe los avisos de Stripe y mantiene el plan:
--   · pago inicial o renovación → plan 'pro', pro_hasta = fin del periodo pagado (+2 días de margen)
--   · cancelación → no se toca pro_hasta: sigue siendo Pro hasta el final de lo pagado (la web ya trata
--     como gratis las tiendas con pro_hasta vencido, ver esPro en src/lib/tiendas.js)
-- Aquí se guarda qué suscripción de Stripe corresponde a cada tienda. Solo la escribe la función.

create table public.tienda_suscripciones (
  tienda_id bigint primary key references public.tiendas on delete cascade,
  stripe_cliente text,
  stripe_suscripcion text unique,
  periodo text check (periodo in ('mes', 'año')),
  estado text not null default 'activa' check (estado in ('activa', 'cancelada', 'impagada')),
  hasta timestamptz,
  actualizado_en timestamptz not null default now()
);
alter table public.tienda_suscripciones enable row level security;

-- La tienda ve el estado de su suscripción (para su panel); nadie más
create policy "tienda_suscripciones: la mía" on public.tienda_suscripciones for select to authenticated
  using (exists (select 1 from public.tiendas t where t.id = tienda_id and t.propietario_id = (select auth.uid())));
revoke all on public.tienda_suscripciones from anon, authenticated;
grant select (tienda_id, periodo, estado, hasta) on public.tienda_suscripciones to authenticated;
grant select, insert, update on public.tienda_suscripciones to service_role;

-- Los administradores lo ven todo (panel de Admin → Tiendas)
create policy "tienda_suscripciones: administradores" on public.tienda_suscripciones for select to authenticated
  using (public.es_admin());
