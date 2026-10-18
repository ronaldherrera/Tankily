-- Nombres de usuario con punto y guion (ronald.herrera, ronald-herrera): 3–20 caracteres en minúsculas,
-- números, guion bajo, puntos y guiones; punto y guion nunca al principio ni al final, ni dos seguidos. La web valida lo mismo (src/lib/usuario.js).

alter table public.perfiles drop constraint if exists perfiles_usuario_check;
alter table public.perfiles add constraint perfiles_usuario_check
  check (usuario ~ '^[a-z0-9_.-]{3,20}$' and usuario !~ '^[.-]|[.-]$|[.-]{2}');

-- Al registrarse: se respetan el punto y el guion del nombre elegido (antes se quitaban).
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
  base := btrim(regexp_replace(base, '([.-])[.-]+', '', 'g'), '.-');
  if char_length(base) < 3 then base := 'acuarista'; end if;
  base := rtrim(left(base, 16), '.-');
  candidato := base;
  while exists (select 1 from public.perfiles where usuario = candidato) loop
    n := n + 1;
    candidato := base || n::text;
  end loop;
  insert into public.perfiles (id, usuario, nombre, avatar_url)
  values (new.id, candidato, left(nombre_real, 50), nullif(coalesce(meta->>'avatar_url', meta->>'picture'), ''));
  return new;
end $$;

-- @menciones con punto o guion: empiezan y acaban en letra, número o guion bajo, así "gracias @ana." menciona a @ana.
create or replace function public.tras_publicacion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  mencionado uuid;
  autor_original uuid;
begin
  for mencionado in
    select p.id from public.perfiles p
    where p.usuario in (
      select lower(m[1]) from regexp_matches(coalesce(new.contenido, ''), '@([a-zA-Z0-9_][a-zA-Z0-9_.-]{1,18}[a-zA-Z0-9_])', 'g') as m)
  loop
    perform public.notificar(mencionado, new.usuario_id, 'mencion', new.id);
  end loop;

  if new.eco_de is not null then
    update public.publicaciones set num_ecos = num_ecos + 1 where id = new.eco_de
      returning usuario_id into autor_original;
    perform public.notificar(autor_original, new.usuario_id, 'eco', new.eco_de);
  end if;
  return null;
end $$;
