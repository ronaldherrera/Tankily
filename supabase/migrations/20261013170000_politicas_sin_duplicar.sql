-- Rendimiento (aviso "multiple_permissive_policies" del analizador de Supabase): las políticas
-- "gestionar" eran FOR ALL y se sumaban a la de lectura en cada SELECT, así que cada fila evaluaba
-- dos reglas. Se separan en INSERT/UPDATE/DELETE; la lectura queda en una sola regla.
-- Los permisos no cambian: puede_ver_tanque ya incluye al dueño del tanque.

-- Habitantes
drop policy if exists "habitantes: gestionar" on public.habitantes;
create policy "habitantes: añadir" on public.habitantes for insert to authenticated with check (public.es_dueno_tanque(tanque_id));
create policy "habitantes: editar" on public.habitantes for update to authenticated using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));
create policy "habitantes: borrar" on public.habitantes for delete to authenticated using (public.es_dueno_tanque(tanque_id));

-- Mediciones
drop policy if exists "mediciones: gestionar" on public.mediciones;
create policy "mediciones: añadir" on public.mediciones for insert to authenticated with check (public.es_dueno_tanque(tanque_id));
create policy "mediciones: editar" on public.mediciones for update to authenticated using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));
create policy "mediciones: borrar" on public.mediciones for delete to authenticated using (public.es_dueno_tanque(tanque_id));

-- Diario del tanque
drop policy if exists "eventos: gestionar" on public.tanque_eventos;
create policy "eventos: añadir" on public.tanque_eventos for insert to authenticated with check (public.es_dueno_tanque(tanque_id));
create policy "eventos: editar" on public.tanque_eventos for update to authenticated using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));
create policy "eventos: borrar" on public.tanque_eventos for delete to authenticated using (public.es_dueno_tanque(tanque_id));

-- Campañas: una sola regla de lectura (vigentes para todos, todas para administradores)
drop policy if exists "campanas: vigentes" on public.campanas;
drop policy if exists "campanas: admin" on public.campanas;
create policy "campanas: ver" on public.campanas for select
  using ((activa and inicio <= current_date and (fin is null or fin >= current_date)) or public.es_admin());
create policy "campanas: crear (admin)" on public.campanas for insert to authenticated with check (public.es_admin());
create policy "campanas: editar (admin)" on public.campanas for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "campanas: borrar (admin)" on public.campanas for delete to authenticated using (public.es_admin());
