-- Los administradores ven todos los tanques, también los privados y los de "solo seguidores",
-- con todo lo que cuelga de ellos (habitantes, mediciones, diario, publicaciones del tanque y
-- tareas de mantenimiento). Solo lectura: editar y borrar sigue siendo cosa del dueño.
-- Para soporte y moderación desde el panel de administración.

create or replace function public.puede_ver_tanque(p_tanque bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tanques t
    where t.id = p_tanque and (
      t.visibilidad = 'publico'
      or t.usuario_id = auth.uid()
      or (t.visibilidad = 'seguidores' and exists (
        select 1 from public.seguidores s
        where s.seguidor_id = auth.uid() and s.seguido_id = t.usuario_id))
      or public.es_admin()
    )
  )
$$;

drop policy if exists "tanques: ver según visibilidad" on public.tanques;
create policy "tanques: ver según visibilidad" on public.tanques for select using (
  visibilidad = 'publico'
  or usuario_id = (select auth.uid())
  or (visibilidad = 'seguidores' and exists (
    select 1 from public.seguidores s
    where s.seguidor_id = (select auth.uid()) and s.seguido_id = tanques.usuario_id))
  or (select public.es_admin())
);

create policy "tareas: administradores leen" on public.tareas for select to authenticated
  using ((select public.es_admin()));
