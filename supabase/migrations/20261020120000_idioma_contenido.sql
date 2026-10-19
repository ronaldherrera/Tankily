-- Idioma de tanques y anuncios (los hilos ya lo tienen): cada uno tiene su página indexable solo en el idioma
-- de su contenido (/es/tanque/arrecife-del-salon-12/), en lugar de en los 8, para no multiplicar archivos en
-- el alojamiento. Se toma el idioma de la web de quien lo crea (avisos_email.idioma, que la web mantiene al día).

alter table public.tanques add column if not exists idioma text not null default 'es'
  check (idioma in ('es','en','de','pt','fr','it','nl','pl'));
alter table public.anuncios add column if not exists idioma text not null default 'es'
  check (idioma in ('es','en','de','pt','fr','it','nl','pl'));

update public.tanques t set idioma = a.idioma from public.avisos_email a where a.usuario_id = t.usuario_id;
update public.anuncios n set idioma = a.idioma from public.avisos_email a where a.usuario_id = n.usuario_id;

create or replace function public.idioma_del_autor() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.idioma := coalesce((select a.idioma from public.avisos_email a where a.usuario_id = new.usuario_id), new.idioma, 'es');
  return new;
end $$;
revoke execute on function public.idioma_del_autor() from public, anon, authenticated;

drop trigger if exists tanques_idioma on public.tanques;
create trigger tanques_idioma before insert on public.tanques for each row execute function public.idioma_del_autor();
drop trigger if exists anuncios_idioma on public.anuncios;
create trigger anuncios_idioma before insert on public.anuncios for each row execute function public.idioma_del_autor();
