-- Al entrar con Google, Apple, Facebook o Microsoft, el perfil hereda el nombre y la foto de la cuenta.
-- Cada proveedor usa claves distintas en los metadatos: full_name / name y avatar_url / picture.
-- El nombre de usuario sale del nombre real si no hay uno elegido ("Laura Ferrer" → lauraferrer).
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
    '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := 'acuarista'; end if;
  base := left(base, 16);
  candidato := base;
  while exists (select 1 from public.perfiles where usuario = candidato) loop
    n := n + 1;
    candidato := base || n::text;
  end loop;
  insert into public.perfiles (id, usuario, nombre, avatar_url)
  values (new.id, candidato, left(nombre_real, 50), nullif(coalesce(meta->>'avatar_url', meta->>'picture'), ''));
  return new;
end $$;

-- Quita tildes de las letras latinas más comunes (sin depender de la extensión unaccent)
create or replace function public.unaccent_simple(t text) returns text
language sql immutable set search_path = '' as $$
  select translate(t,
    'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇßłŁąĄęĘśŚźŹżŻćĆńŃ',
    'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNCslLaAeEsSzZzZcCnN')
$$;
revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;
