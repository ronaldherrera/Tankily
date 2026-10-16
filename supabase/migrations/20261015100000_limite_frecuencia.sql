-- Freno antispam: límite de publicaciones por usuario y periodo, en la propia base de datos
-- (vale igual para la web que para cualquiera que use la API directamente). Los límites son
-- holgados para un uso normal y cortan a bots y cuentas que inundan. Los administradores y los
-- procesos internos (sin usuario, como los datos de demostración) no tienen límite.
-- La web traduce el error por su código: LIMITE_FRECUENCIA (src/lib/errores.js).

create or replace function public.limitar_frecuencia()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  columna text := tg_argv[0];          -- columna con el autor (usuario_id, emisor_id…)
  maximo int := tg_argv[1]::int;       -- inserciones permitidas…
  periodo interval := tg_argv[2]::interval; -- …en este periodo
  autor uuid := (to_jsonb(new) ->> columna)::uuid;
  recientes int;
begin
  if autor is null or (select auth.uid()) is null or public.es_admin() then return new; end if;
  execute format('select count(*) from %I.%I where %I = $1 and creado_en > now() - $2', tg_table_schema, tg_table_name, columna)
    into recientes using autor, periodo;
  if recientes >= maximo then
    raise exception 'LIMITE_FRECUENCIA' using errcode = 'P0001',
      hint = format('%s en %s', maximo, periodo);
  end if;
  return new;
end $$;

revoke execute on function public.limitar_frecuencia() from public, anon, authenticated;

create trigger limite_publicaciones before insert on public.publicaciones
  for each row execute function public.limitar_frecuencia('usuario_id', '20', '1 hour');
create trigger limite_comentarios before insert on public.comentarios
  for each row execute function public.limitar_frecuencia('usuario_id', '60', '1 hour');
create trigger limite_foro_hilos before insert on public.foro_hilos
  for each row execute function public.limitar_frecuencia('usuario_id', '8', '1 hour');
create trigger limite_foro_respuestas before insert on public.foro_respuestas
  for each row execute function public.limitar_frecuencia('usuario_id', '40', '1 hour');
create trigger limite_anuncios before insert on public.anuncios
  for each row execute function public.limitar_frecuencia('usuario_id', '15', '1 day');
create trigger limite_mensajes before insert on public.mensajes
  for each row execute function public.limitar_frecuencia('emisor_id', '60', '10 minutes');
create trigger limite_resenas before insert on public.tienda_resenas
  for each row execute function public.limitar_frecuencia('usuario_id', '10', '1 day');
create trigger limite_reportes before insert on public.reportes
  for each row execute function public.limitar_frecuencia('usuario_id', '20', '1 hour');

-- Los recuentos usan estos índices (autor + fecha) para no recorrer la tabla entera
create index if not exists comentarios_usuario_creado_idx on public.comentarios (usuario_id, creado_en desc);
create index if not exists foro_hilos_usuario_creado_idx on public.foro_hilos (usuario_id, creado_en desc);
create index if not exists foro_respuestas_usuario_creado_idx on public.foro_respuestas (usuario_id, creado_en desc);
create index if not exists anuncios_usuario_creado_idx on public.anuncios (usuario_id, creado_en desc);
create index if not exists mensajes_emisor_creado_idx on public.mensajes (emisor_id, creado_en desc);
create index if not exists reportes_usuario_creado_idx on public.reportes (usuario_id, creado_en desc);
