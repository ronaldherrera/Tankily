-- La foto de perfil la sube cada usuario: ya no se copia la de Google al registrarse (Google limita las fotos
-- enlazadas desde otras webs con un 429 y no se ven). Sin foto, la web muestra la inicial (Avatar en components/ui.js).

create or replace function public.crear_perfil_nuevo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nombre_real text := nullif(coalesce(meta->>'nombre', meta->>'full_name', meta->>'name'), '');
  base text;
  candidato text;
  n int := 0;
begin
  base := lower(regexp_replace(
    coalesce(meta->>'usuario',
      -- Sin usuario elegido: el nombre real sin tildes ni espacios, o la parte del email antes de la @
      public.unaccent_simple(nombre_real),
      split_part(new.email, '@', 1), ''),
    '[^a-zA-Z0-9_.-]', '', 'g'));
  -- Puntos y guiones: nunca dos seguidos, ni al principio ni al final
  base := btrim(regexp_replace(base, '([.-])[.-]+', '', 'g'), '.-');
  if char_length(base) < 3 then base := 'acuarista'; end if;
  base := rtrim(left(base, 16), '.-');
  candidato := base;
  while exists (select 1 from public.perfiles where usuario = candidato) loop
    n := n + 1;
    candidato := base || n::text;
  end loop;
  insert into public.perfiles (id, usuario, nombre)
  values (new.id, candidato, left(nombre_real, 50));
  return new;
end $$;

-- Quien ya se registró con Google se queda sin esa foto (las subidas por los usuarios no se tocan)
update public.perfiles set avatar_url = null where avatar_url like '%googleusercontent.com%';
