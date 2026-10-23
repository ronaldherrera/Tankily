-- Cuentas de muestra (la comunidad de demostración de supabase/demo): el perfil lo indica con "muestra ⓘ" junto al
-- @usuario. Solo se ve en la página de perfil. Los usuarios no pueden cambiarla (no está en el grant de update).
alter table public.perfiles add column if not exists muestra boolean not null default false;

update public.perfiles p set muestra = true
from auth.users u
where u.id = p.id and u.email like '%@demo.tankily.invalid';
