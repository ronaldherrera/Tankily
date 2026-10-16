-- =====================================================================
-- Tankily v1 — esquema completo
-- Todo gira en torno a los tanques: perfiles → tanques → habitantes,
-- mediciones y diario; la parte social (muro, foro, mercado, tiendas)
-- puede enlazar con un tanque.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Archivar el prototipo (no se borra nada: pasa al esquema "prototipo",
--    que no está expuesto por la API)
-- ---------------------------------------------------------------------
create schema if not exists prototipo;
revoke all on schema prototipo from anon, authenticated;

alter view if exists public.vista_publicaciones set schema prototipo;
alter view if exists public.vista_comentarios_posteos set schema prototipo;
alter view if exists public.vista_comentarios_acuario set schema prototipo;
alter view if exists public.vista_respuestas_comentarios_acuario set schema prototipo;
alter table if exists public.reacciones_comentarios_acuario set schema prototipo;
alter table if exists public.respuestas_comentarios_acuario set schema prototipo;
alter table if exists public.comentarios_acuario set schema prototipo;
alter table if exists public.reacciones set schema prototipo;
alter table if exists public.comentarios set schema prototipo;
alter table if exists public.publicaciones set schema prototipo;
alter table if exists public.seguidores set schema prototipo;
alter table if exists public.mediciones set schema prototipo;
alter table if exists public.habitantes set schema prototipo;
alter table if exists public.acuarios set schema prototipo;
alter table if exists public.perfiles set schema prototipo;
alter table if exists public._test set schema prototipo;

-- ---------------------------------------------------------------------
-- 1. Perfiles
-- ---------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users on delete cascade,
  usuario text not null unique check (usuario ~ '^[a-z0-9_]{3,20}$'),
  nombre text check (char_length(nombre) <= 50),
  bio text check (char_length(bio) <= 300),
  avatar_url text,
  portada_url text,
  provincia text,
  nivel text check (nivel in ('principiante','intermedio','avanzado','profesional')),
  es_admin boolean not null default false,
  creado_en timestamptz not null default now()
);

create function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false)
$$;

create function public.crear_perfil_nuevo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidato text;
  n int := 0;
begin
  base := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'usuario', split_part(new.email, '@', 1), ''),
    '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := 'acuarista'; end if;
  base := left(base, 16);
  candidato := base;
  while exists (select 1 from public.perfiles where usuario = candidato) loop
    n := n + 1;
    candidato := base || n::text;
  end loop;
  insert into public.perfiles (id, usuario, nombre)
  values (new.id, candidato, left(new.raw_user_meta_data->>'nombre', 50));
  return new;
end $$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- Usuarios ya existentes
insert into public.perfiles (id, usuario)
select id, 'acuarista' || left(replace(id::text, '-', ''), 8) from auth.users
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 2. Seguidores
-- ---------------------------------------------------------------------
create table public.seguidores (
  seguidor_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  seguido_id uuid not null references public.perfiles on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);
create index on public.seguidores (seguido_id);

-- ---------------------------------------------------------------------
-- 3. Tanques y todo lo que cuelga de ellos
-- ---------------------------------------------------------------------
create table public.tanques (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  nombre text not null check (char_length(nombre) between 1 and 60),
  tipo text not null check (tipo in ('reef','marino_peces','nano_marino','comunidad','plantado',
    'gambas','ciclidos','discos','agua_fria','estanque','biotopo','paludario','otro')),
  litros int check (litros between 1 and 1000000),
  largo_cm int check (largo_cm > 0),
  ancho_cm int check (ancho_cm > 0),
  alto_cm int check (alto_cm > 0),
  descripcion text check (char_length(descripcion) <= 2000),
  equipo jsonb not null default '{}',
  foto_url text,
  montado_en date,
  cambio_agua_cada_dias int check (cambio_agua_cada_dias between 1 and 90),
  visibilidad text not null default 'publico' check (visibilidad in ('publico','seguidores','privado')),
  creado_en timestamptz not null default now()
);
create index on public.tanques (usuario_id);
create index on public.tanques (creado_en desc);

create function public.puede_ver_tanque(p_tanque bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tanques t
    where t.id = p_tanque and (
      t.visibilidad = 'publico'
      or t.usuario_id = auth.uid()
      or (t.visibilidad = 'seguidores' and exists (
        select 1 from public.seguidores s
        where s.seguidor_id = auth.uid() and s.seguido_id = t.usuario_id))
    )
  )
$$;

create function public.es_dueno_tanque(p_tanque bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tanques where id = p_tanque and usuario_id = auth.uid())
$$;

create table public.habitantes (
  id bigint generated always as identity primary key,
  tanque_id bigint not null references public.tanques on delete cascade,
  categoria text not null check (categoria in ('pez','coral','invertebrado','planta','anfibio','otro')),
  nombre text not null check (char_length(nombre) between 1 and 80),
  nombre_cientifico text check (char_length(nombre_cientifico) <= 100),
  cantidad int not null default 1 check (cantidad between 1 and 100000),
  wiki_ruta text,
  notas text check (char_length(notas) <= 500),
  anadido_en date not null default current_date,
  creado_en timestamptz not null default now()
);
create index on public.habitantes (tanque_id);

create table public.mediciones (
  id bigint generated always as identity primary key,
  tanque_id bigint not null references public.tanques on delete cascade,
  parametro text not null check (parametro in ('temperatura','ph','kh','gh','amonio','nitrito',
    'nitrato','fosfato','salinidad','calcio','magnesio','silicato','co2','tds','otro')),
  valor numeric not null,
  nota text check (char_length(nota) <= 300),
  medido_en timestamptz not null default now(),
  creado_en timestamptz not null default now()
);
create index on public.mediciones (tanque_id, parametro, medido_en desc);

create table public.tanque_eventos (
  id bigint generated always as identity primary key,
  tanque_id bigint not null references public.tanques on delete cascade,
  tipo text not null check (tipo in ('cambio_agua','limpieza','filtro','dosificacion',
    'alta','baja','tratamiento','poda','otro')),
  nota text check (char_length(nota) <= 500),
  fecha timestamptz not null default now(),
  creado_en timestamptz not null default now()
);
create index on public.tanque_eventos (tanque_id, fecha desc);

create table public.tanque_seguidores (
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  tanque_id bigint not null references public.tanques on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, tanque_id)
);
create index on public.tanque_seguidores (tanque_id);

-- ---------------------------------------------------------------------
-- 4. Muro: publicaciones, me gusta, comentarios
-- ---------------------------------------------------------------------
create table public.publicaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  tanque_id bigint references public.tanques on delete set null,
  contenido text not null default '' check (char_length(contenido) <= 2000),
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 6),
  tipo text not null default 'post' check (tipo in ('post','medicion','eco')),
  eco_de bigint references public.publicaciones on delete cascade,
  etiquetas text[] not null default '{}',
  num_me_gusta int not null default 0,
  num_comentarios int not null default 0,
  num_ecos int not null default 0,
  creado_en timestamptz not null default now(),
  check (contenido <> '' or cardinality(imagenes) > 0 or eco_de is not null)
);
create index on public.publicaciones (creado_en desc);
create index on public.publicaciones (usuario_id, creado_en desc);
create index on public.publicaciones (tanque_id, creado_en desc);
create index on public.publicaciones (eco_de);
create index on public.publicaciones using gin (etiquetas);

create table public.me_gusta (
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  publicacion_id bigint not null references public.publicaciones on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, publicacion_id)
);
create index on public.me_gusta (publicacion_id);

create table public.comentarios (
  id bigint generated always as identity primary key,
  publicacion_id bigint not null references public.publicaciones on delete cascade,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  contenido text not null check (char_length(contenido) between 1 and 1000),
  creado_en timestamptz not null default now()
);
create index on public.comentarios (publicacion_id, creado_en);

-- ---------------------------------------------------------------------
-- 5. Foro
-- ---------------------------------------------------------------------
create table public.foro_categorias (
  slug text primary key,
  nombre text not null,
  descripcion text not null,
  grupo text not null,
  orden int not null default 0
);

insert into public.foro_categorias (slug, nombre, descripcion, grupo, orden) values
  ('reef', 'Reef y corales', 'Acuarios de arrecife, corales duros y blandos, química del agua salada.', 'Marino', 10),
  ('marino-peces', 'Peces marinos', 'Fowlr, compatibilidades, cuarentena y alimentación de peces marinos.', 'Marino', 20),
  ('nano-marino', 'Nano marino', 'Arrecifes de menos de 100 litros: estabilidad, especies y montaje.', 'Marino', 30),
  ('comunidad', 'Agua dulce tropical', 'Acuarios comunitarios, tetras, vivíparos, corydoras y compañía.', 'Agua dulce', 40),
  ('plantado', 'Plantados y aquascaping', 'Plantas, CO2, abonado, iluminación y diseño de layouts.', 'Agua dulce', 50),
  ('gambas', 'Gambas e invertebrados', 'Neocaridinas, caridinas, caracoles y cría de invertebrados.', 'Agua dulce', 60),
  ('ciclidos', 'Cíclidos', 'Africanos, americanos, discos y escalares.', 'Agua dulce', 70),
  ('agua-fria', 'Agua fría y estanques', 'Goldfish, kois, estanques de exterior y especies de agua fría.', 'Agua dulce', 80),
  ('enfermedades', 'Enfermedades y diagnóstico', 'Síntomas, tratamientos y cuarentena. Incluye fotos y parámetros.', 'Ayuda', 90),
  ('equipamiento', 'Equipamiento', 'Filtros, iluminación, skimmers, bombas y comparativas.', 'Ayuda', 100),
  ('bricolaje', 'Bricolaje (DIY)', 'Muebles, sumps, reactores y proyectos hechos a mano.', 'Ayuda', 110),
  ('principiantes', 'Primeros pasos', 'Ciclado, primer acuario y dudas de quien empieza. Aquí no hay preguntas tontas.', 'Ayuda', 120),
  ('presentaciones', 'Presentaciones', 'Preséntate y enseña tu tanque a la comunidad.', 'Comunidad', 130),
  ('quedadas', 'Quedadas y eventos', 'Ferias, quedadas locales e intercambios en persona.', 'Comunidad', 140);

create table public.foro_hilos (
  id bigint generated always as identity primary key,
  categoria text not null references public.foro_categorias,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  tanque_id bigint references public.tanques on delete set null,
  titulo text not null check (char_length(titulo) between 5 and 140),
  contenido text not null check (char_length(contenido) between 1 and 10000),
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 6),
  solucion_id bigint,
  num_respuestas int not null default 0,
  ultima_actividad timestamptz not null default now(),
  fijado boolean not null default false,
  cerrado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index on public.foro_hilos (categoria, fijado desc, ultima_actividad desc);
create index on public.foro_hilos (ultima_actividad desc);
create index on public.foro_hilos (usuario_id);

create table public.foro_respuestas (
  id bigint generated always as identity primary key,
  hilo_id bigint not null references public.foro_hilos on delete cascade,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  contenido text not null check (char_length(contenido) between 1 and 10000),
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 6),
  num_votos int not null default 0,
  creado_en timestamptz not null default now()
);
create index on public.foro_respuestas (hilo_id, creado_en);

alter table public.foro_hilos add constraint foro_hilos_solucion_fk
  foreign key (solucion_id) references public.foro_respuestas on delete set null;

create table public.foro_votos (
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  respuesta_id bigint not null references public.foro_respuestas on delete cascade,
  primary key (usuario_id, respuesta_id)
);
create index on public.foro_votos (respuesta_id);

-- ---------------------------------------------------------------------
-- 6. Tiendas
-- ---------------------------------------------------------------------
create table public.tiendas (
  id bigint generated always as identity primary key,
  propietario_id uuid not null unique references public.perfiles on delete cascade default auth.uid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  nombre text not null check (char_length(nombre) between 2 and 80),
  descripcion text check (char_length(descripcion) <= 2000),
  logo_url text,
  portada_url text,
  web text,
  telefono text,
  email_contacto text,
  direccion text,
  ciudad text,
  provincia text not null,
  especialidades text[] not null default '{}',
  venta_online boolean not null default false,
  horario text check (char_length(horario) <= 300),
  plan text not null default 'gratis' check (plan in ('gratis','pro')),
  pro_hasta date,
  verificada boolean not null default false,
  num_resenas int not null default 0,
  valoracion numeric(2,1) not null default 0,
  creado_en timestamptz not null default now()
);
create index on public.tiendas (provincia);

create table public.tienda_resenas (
  tienda_id bigint not null references public.tiendas on delete cascade,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  puntuacion int not null check (puntuacion between 1 and 5),
  texto text check (char_length(texto) <= 1000),
  creado_en timestamptz not null default now(),
  primary key (tienda_id, usuario_id)
);

-- ---------------------------------------------------------------------
-- 7. Mercado (compraventa) y mensajes
-- ---------------------------------------------------------------------
create table public.anuncios (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  tienda_id bigint references public.tiendas on delete set null,
  titulo text not null check (char_length(titulo) between 3 and 100),
  descripcion text not null default '' check (char_length(descripcion) <= 4000),
  categoria text not null check (categoria in ('peces','corales','invertebrados','plantas',
    'acuarios','iluminacion','filtracion','equipamiento','alimentacion','otros')),
  modalidad text not null default 'venta' check (modalidad in ('venta','cambio','regalo')),
  precio numeric(10,2) check (precio >= 0),
  provincia text not null,
  envio boolean not null default false,
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 8),
  estado text not null default 'activo' check (estado in ('activo','reservado','vendido')),
  destacado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index on public.anuncios (estado, destacado desc, creado_en desc);
create index on public.anuncios (categoria);
create index on public.anuncios (provincia);
create index on public.anuncios (usuario_id);
create index on public.anuncios (tienda_id);

create table public.mensajes (
  id bigint generated always as identity primary key,
  emisor_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  receptor_id uuid not null references public.perfiles on delete cascade,
  anuncio_id bigint references public.anuncios on delete set null,
  contenido text not null check (char_length(contenido) between 1 and 2000),
  leido boolean not null default false,
  creado_en timestamptz not null default now(),
  check (emisor_id <> receptor_id)
);
create index on public.mensajes (receptor_id, creado_en desc);
create index on public.mensajes (emisor_id, creado_en desc);

-- ---------------------------------------------------------------------
-- 8. Notificaciones, publicidad y moderación
-- ---------------------------------------------------------------------
create table public.notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles on delete cascade,
  actor_id uuid references public.perfiles on delete cascade,
  tipo text not null check (tipo in ('me_gusta','comentario','seguidor','eco','mencion',
    'respuesta_foro','solucion','resena','seguidor_tanque')),
  publicacion_id bigint references public.publicaciones on delete cascade,
  hilo_id bigint references public.foro_hilos on delete cascade,
  tanque_id bigint references public.tanques on delete cascade,
  tienda_id bigint references public.tiendas on delete cascade,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);
create index on public.notificaciones (usuario_id, creado_en desc);

create table public.campanas (
  id bigint generated always as identity primary key,
  tienda_id bigint references public.tiendas on delete cascade,
  titulo text not null,
  texto text,
  imagen_url text,
  enlace text not null,
  ubicacion text not null check (ubicacion in ('feed','lateral','mercado','foro','tiendas')),
  activa boolean not null default true,
  inicio date not null default current_date,
  fin date,
  prioridad int not null default 0,
  creado_en timestamptz not null default now()
);
create index on public.campanas (ubicacion, activa);

create table public.reportes (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles on delete cascade default auth.uid(),
  tipo text not null check (tipo in ('publicacion','comentario','hilo','respuesta','anuncio',
    'perfil','tienda','mensaje')),
  objeto_id text not null,
  motivo text not null check (motivo in ('spam','ofensivo','fraude','maltrato_animal',
    'especie_protegida','otro')),
  detalle text check (char_length(detalle) <= 1000),
  estado text not null default 'pendiente' check (estado in ('pendiente','revisado','descartado')),
  creado_en timestamptz not null default now()
);

-- =====================================================================
-- 9. Triggers: etiquetas, contadores y notificaciones
-- =====================================================================
create function public.extraer_etiquetas() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.etiquetas := coalesce((
    select array_agg(distinct lower(m[1]))
    from regexp_matches(coalesce(new.contenido, ''), '#([[:alnum:]_]{2,40})', 'g') as m
  ), '{}');
  return new;
end $$;

create trigger publicaciones_etiquetas before insert or update of contenido on public.publicaciones
  for each row execute function public.extraer_etiquetas();

create function public.notificar(p_destino uuid, p_actor uuid, p_tipo text,
  p_publicacion bigint default null, p_hilo bigint default null,
  p_tanque bigint default null, p_tienda bigint default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_destino is null or p_destino = p_actor then return; end if;
  insert into public.notificaciones (usuario_id, actor_id, tipo, publicacion_id, hilo_id, tanque_id, tienda_id)
  values (p_destino, p_actor, p_tipo, p_publicacion, p_hilo, p_tanque, p_tienda);
end $$;
revoke execute on function public.notificar from public, anon, authenticated;

-- Publicación nueva: menciones y ecos
create function public.tras_publicacion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  mencionado uuid;
  autor_original uuid;
begin
  for mencionado in
    select p.id from public.perfiles p
    where p.usuario in (
      select lower(m[1]) from regexp_matches(coalesce(new.contenido, ''), '@([a-zA-Z0-9_]{3,20})', 'g') as m)
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
create trigger publicaciones_despues after insert on public.publicaciones
  for each row execute function public.tras_publicacion();

create function public.tras_borrar_publicacion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.eco_de is not null then
    update public.publicaciones set num_ecos = greatest(num_ecos - 1, 0) where id = old.eco_de;
  end if;
  return null;
end $$;
create trigger publicaciones_borrada after delete on public.publicaciones
  for each row execute function public.tras_borrar_publicacion();

-- Me gusta
create function public.contar_me_gusta() returns trigger
language plpgsql security definer set search_path = '' as $$
declare autor uuid;
begin
  if tg_op = 'INSERT' then
    update public.publicaciones set num_me_gusta = num_me_gusta + 1 where id = new.publicacion_id
      returning usuario_id into autor;
    perform public.notificar(autor, new.usuario_id, 'me_gusta', new.publicacion_id);
  else
    update public.publicaciones set num_me_gusta = greatest(num_me_gusta - 1, 0) where id = old.publicacion_id;
  end if;
  return null;
end $$;
create trigger me_gusta_contador after insert or delete on public.me_gusta
  for each row execute function public.contar_me_gusta();

-- Comentarios
create function public.contar_comentarios() returns trigger
language plpgsql security definer set search_path = '' as $$
declare autor uuid;
begin
  if tg_op = 'INSERT' then
    update public.publicaciones set num_comentarios = num_comentarios + 1 where id = new.publicacion_id
      returning usuario_id into autor;
    perform public.notificar(autor, new.usuario_id, 'comentario', new.publicacion_id);
  else
    update public.publicaciones set num_comentarios = greatest(num_comentarios - 1, 0) where id = old.publicacion_id;
  end if;
  return null;
end $$;
create trigger comentarios_contador after insert or delete on public.comentarios
  for each row execute function public.contar_comentarios();

-- Seguidores
create function public.tras_seguir() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notificar(new.seguido_id, new.seguidor_id, 'seguidor');
  return null;
end $$;
create trigger seguidores_notificar after insert on public.seguidores
  for each row execute function public.tras_seguir();

create function public.tras_seguir_tanque() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.notificar((select usuario_id from public.tanques where id = new.tanque_id),
    new.usuario_id, 'seguidor_tanque', null, null, new.tanque_id);
  return null;
end $$;
create trigger tanque_seguidores_notificar after insert on public.tanque_seguidores
  for each row execute function public.tras_seguir_tanque();

-- Foro: respuestas
create function public.tras_respuesta_foro() returns trigger
language plpgsql security definer set search_path = '' as $$
declare autor uuid;
begin
  if tg_op = 'INSERT' then
    update public.foro_hilos set num_respuestas = num_respuestas + 1, ultima_actividad = now()
      where id = new.hilo_id returning usuario_id into autor;
    perform public.notificar(autor, new.usuario_id, 'respuesta_foro', null, new.hilo_id);
  else
    update public.foro_hilos set num_respuestas = greatest(num_respuestas - 1, 0) where id = old.hilo_id;
  end if;
  return null;
end $$;
create trigger foro_respuestas_contador after insert or delete on public.foro_respuestas
  for each row execute function public.tras_respuesta_foro();

-- Foro: la solución tiene que ser una respuesta del propio hilo
create function public.validar_solucion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare autor_respuesta uuid;
begin
  if new.solucion_id is distinct from old.solucion_id and new.solucion_id is not null then
    select usuario_id into autor_respuesta from public.foro_respuestas
      where id = new.solucion_id and hilo_id = new.id;
    if not found then
      raise exception 'La solución debe ser una respuesta de este hilo';
    end if;
    perform public.notificar(autor_respuesta, new.usuario_id, 'solucion', null, new.id);
  end if;
  return new;
end $$;
create trigger foro_hilos_solucion before update of solucion_id on public.foro_hilos
  for each row execute function public.validar_solucion();

-- Foro: votos
create function public.contar_votos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.foro_respuestas set num_votos = num_votos + 1 where id = new.respuesta_id;
  else
    update public.foro_respuestas set num_votos = greatest(num_votos - 1, 0) where id = old.respuesta_id;
  end if;
  return null;
end $$;
create trigger foro_votos_contador after insert or delete on public.foro_votos
  for each row execute function public.contar_votos();

-- Tiendas: valoración media
create function public.recalcular_valoracion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t bigint := coalesce(new.tienda_id, old.tienda_id);
begin
  update public.tiendas set
    num_resenas = (select count(*) from public.tienda_resenas where tienda_id = t),
    valoracion = coalesce((select round(avg(puntuacion)::numeric, 1) from public.tienda_resenas where tienda_id = t), 0)
  where id = t;
  if tg_op = 'INSERT' then
    perform public.notificar((select propietario_id from public.tiendas where id = t),
      new.usuario_id, 'resena', null, null, null, t);
  end if;
  return null;
end $$;
create trigger tienda_resenas_valoracion after insert or update or delete on public.tienda_resenas
  for each row execute function public.recalcular_valoracion();

-- Anuncios: fecha de actualización
create function public.tocar_actualizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end $$;
create trigger anuncios_actualizado before update on public.anuncios
  for each row execute function public.tocar_actualizado();

-- Borrar la propia cuenta (RGPD): elimina el usuario y, en cascada, todo su contenido
create function public.eliminar_mi_cuenta() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.eliminar_mi_cuenta from public, anon;
grant execute on function public.eliminar_mi_cuenta to authenticated;

-- =====================================================================
-- 10. Seguridad: RLS en todas las tablas
-- =====================================================================
alter table public.perfiles enable row level security;
alter table public.seguidores enable row level security;
alter table public.tanques enable row level security;
alter table public.habitantes enable row level security;
alter table public.mediciones enable row level security;
alter table public.tanque_eventos enable row level security;
alter table public.tanque_seguidores enable row level security;
alter table public.publicaciones enable row level security;
alter table public.me_gusta enable row level security;
alter table public.comentarios enable row level security;
alter table public.foro_categorias enable row level security;
alter table public.foro_hilos enable row level security;
alter table public.foro_respuestas enable row level security;
alter table public.foro_votos enable row level security;
alter table public.tiendas enable row level security;
alter table public.tienda_resenas enable row level security;
alter table public.anuncios enable row level security;
alter table public.mensajes enable row level security;
alter table public.notificaciones enable row level security;
alter table public.campanas enable row level security;
alter table public.reportes enable row level security;

-- Perfiles: lectura pública; cada uno edita lo suyo (sin poder tocar es_admin)
create policy "perfiles: lectura pública" on public.perfiles for select using (true);
create policy "perfiles: editar el propio" on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.perfiles from anon, authenticated;
grant update (usuario, nombre, bio, avatar_url, portada_url, provincia, nivel) on public.perfiles to authenticated;

-- Seguidores
create policy "seguidores: lectura pública" on public.seguidores for select using (true);
create policy "seguidores: seguir" on public.seguidores for insert to authenticated
  with check (seguidor_id = (select auth.uid()));
create policy "seguidores: dejar de seguir" on public.seguidores for delete to authenticated
  using (seguidor_id = (select auth.uid()));

-- Tanques
create policy "tanques: ver según visibilidad" on public.tanques for select using (
  visibilidad = 'publico'
  or usuario_id = (select auth.uid())
  or (visibilidad = 'seguidores' and exists (
    select 1 from public.seguidores s
    where s.seguidor_id = (select auth.uid()) and s.seguido_id = tanques.usuario_id))
);
create policy "tanques: crear los propios" on public.tanques for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "tanques: editar los propios" on public.tanques for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "tanques: borrar los propios" on public.tanques for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Habitantes, mediciones y diario: se ven si se ve el tanque, los gestiona el dueño
create policy "habitantes: ver" on public.habitantes for select using (public.puede_ver_tanque(tanque_id));
create policy "habitantes: gestionar" on public.habitantes for all to authenticated
  using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));

create policy "mediciones: ver" on public.mediciones for select using (public.puede_ver_tanque(tanque_id));
create policy "mediciones: gestionar" on public.mediciones for all to authenticated
  using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));

create policy "eventos: ver" on public.tanque_eventos for select using (public.puede_ver_tanque(tanque_id));
create policy "eventos: gestionar" on public.tanque_eventos for all to authenticated
  using (public.es_dueno_tanque(tanque_id)) with check (public.es_dueno_tanque(tanque_id));

create policy "tanque_seguidores: lectura" on public.tanque_seguidores for select using (true);
create policy "tanque_seguidores: seguir" on public.tanque_seguidores for insert to authenticated
  with check (usuario_id = (select auth.uid()) and public.puede_ver_tanque(tanque_id));
create policy "tanque_seguidores: dejar" on public.tanque_seguidores for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Publicaciones (si van ligadas a un tanque no visible, heredan su visibilidad)
create policy "publicaciones: ver" on public.publicaciones for select
  using (tanque_id is null or public.puede_ver_tanque(tanque_id));
create policy "publicaciones: crear" on public.publicaciones for insert to authenticated
  with check (usuario_id = (select auth.uid())
    and (tanque_id is null or public.es_dueno_tanque(tanque_id)));
create policy "publicaciones: editar las propias" on public.publicaciones for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "publicaciones: borrar (autor o admin)" on public.publicaciones for delete to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());
revoke update on public.publicaciones from anon, authenticated;
grant update (contenido, imagenes, tanque_id) on public.publicaciones to authenticated;

create policy "me_gusta: lectura" on public.me_gusta for select using (true);
create policy "me_gusta: dar" on public.me_gusta for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "me_gusta: quitar" on public.me_gusta for delete to authenticated
  using (usuario_id = (select auth.uid()));

create policy "comentarios: ver" on public.comentarios for select using (true);
create policy "comentarios: crear" on public.comentarios for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "comentarios: borrar (autor, dueño del post o admin)" on public.comentarios for delete to authenticated
  using (usuario_id = (select auth.uid())
    or exists (select 1 from public.publicaciones p where p.id = publicacion_id and p.usuario_id = (select auth.uid()))
    or public.es_admin());

-- Foro
create policy "foro_categorias: lectura" on public.foro_categorias for select using (true);

create policy "foro_hilos: lectura" on public.foro_hilos for select using (true);
create policy "foro_hilos: crear" on public.foro_hilos for insert to authenticated
  with check (usuario_id = (select auth.uid()) and not fijado and not cerrado);
create policy "foro_hilos: editar (autor o admin)" on public.foro_hilos for update to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());
create policy "foro_hilos: borrar (autor o admin)" on public.foro_hilos for delete to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());
revoke update on public.foro_hilos from anon, authenticated;
grant update (titulo, contenido, imagenes, solucion_id, categoria, tanque_id) on public.foro_hilos to authenticated;

create policy "foro_respuestas: lectura" on public.foro_respuestas for select using (true);
create policy "foro_respuestas: crear en hilos abiertos" on public.foro_respuestas for insert to authenticated
  with check (usuario_id = (select auth.uid())
    and exists (select 1 from public.foro_hilos h where h.id = hilo_id and not h.cerrado));
create policy "foro_respuestas: editar las propias" on public.foro_respuestas for update to authenticated
  using (usuario_id = (select auth.uid()));
create policy "foro_respuestas: borrar (autor o admin)" on public.foro_respuestas for delete to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());
revoke update on public.foro_respuestas from anon, authenticated;
grant update (contenido, imagenes) on public.foro_respuestas to authenticated;

create policy "foro_votos: lectura" on public.foro_votos for select using (true);
create policy "foro_votos: votar" on public.foro_votos for insert to authenticated
  with check (usuario_id = (select auth.uid()));
create policy "foro_votos: quitar" on public.foro_votos for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- Tiendas (plan, verificada y valoración solo los cambia el sistema)
create policy "tiendas: lectura pública" on public.tiendas for select using (true);
create policy "tiendas: crear la propia" on public.tiendas for insert to authenticated
  with check (propietario_id = (select auth.uid()) and plan = 'gratis' and not verificada
    and pro_hasta is null and num_resenas = 0 and valoracion = 0);
create policy "tiendas: editar la propia" on public.tiendas for update to authenticated
  using (propietario_id = (select auth.uid())) with check (propietario_id = (select auth.uid()));
create policy "tiendas: borrar la propia" on public.tiendas for delete to authenticated
  using (propietario_id = (select auth.uid()));
revoke update on public.tiendas from anon, authenticated;
grant update (slug, nombre, descripcion, logo_url, portada_url, web, telefono, email_contacto,
  direccion, ciudad, provincia, especialidades, venta_online, horario) on public.tiendas to authenticated;

create policy "resenas: lectura" on public.tienda_resenas for select using (true);
create policy "resenas: escribir (no en tu tienda)" on public.tienda_resenas for insert to authenticated
  with check (usuario_id = (select auth.uid())
    and not exists (select 1 from public.tiendas t where t.id = tienda_id and t.propietario_id = (select auth.uid())));
create policy "resenas: editar la propia" on public.tienda_resenas for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "resenas: borrar (autor o admin)" on public.tienda_resenas for delete to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());

-- Anuncios (destacado solo lo activa el sistema/plan Pro)
create policy "anuncios: lectura pública" on public.anuncios for select using (true);
create policy "anuncios: publicar" on public.anuncios for insert to authenticated
  with check (usuario_id = (select auth.uid()) and not destacado
    and (tienda_id is null or exists (
      select 1 from public.tiendas t where t.id = tienda_id and t.propietario_id = (select auth.uid()))));
create policy "anuncios: editar los propios" on public.anuncios for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "anuncios: borrar (autor o admin)" on public.anuncios for delete to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());
revoke update on public.anuncios from anon, authenticated;
grant update (titulo, descripcion, categoria, modalidad, precio, provincia, envio, imagenes, estado)
  on public.anuncios to authenticated;

-- Mensajes privados
create policy "mensajes: ver los míos" on public.mensajes for select to authenticated
  using ((select auth.uid()) in (emisor_id, receptor_id));
create policy "mensajes: enviar" on public.mensajes for insert to authenticated
  with check (emisor_id = (select auth.uid()) and not leido);
create policy "mensajes: marcar leídos" on public.mensajes for update to authenticated
  using (receptor_id = (select auth.uid())) with check (receptor_id = (select auth.uid()));
revoke update on public.mensajes from anon, authenticated;
grant update (leido) on public.mensajes to authenticated;

-- Notificaciones (las crean los triggers)
create policy "notificaciones: ver las mías" on public.notificaciones for select to authenticated
  using (usuario_id = (select auth.uid()));
create policy "notificaciones: marcar leídas" on public.notificaciones for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "notificaciones: borrar las mías" on public.notificaciones for delete to authenticated
  using (usuario_id = (select auth.uid()));
revoke update on public.notificaciones from anon, authenticated;
grant update (leida) on public.notificaciones to authenticated;

-- Publicidad: lectura de campañas vigentes, gestión solo admin
create policy "campanas: vigentes" on public.campanas for select
  using (activa and inicio <= current_date and (fin is null or fin >= current_date));
create policy "campanas: admin" on public.campanas for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Reportes
create policy "reportes: enviar" on public.reportes for insert to authenticated
  with check (usuario_id = (select auth.uid()) and estado = 'pendiente');
create policy "reportes: admin lee" on public.reportes for select to authenticated using (public.es_admin());
create policy "reportes: admin gestiona" on public.reportes for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- =====================================================================
-- 11. Imágenes: bucket público, cada usuario sube solo a su carpeta
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "media: subir a mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: actualizar lo mío" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: quitar lo mío" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- =====================================================================
-- 12. Tiempo real
-- =====================================================================
alter publication supabase_realtime add table public.publicaciones, public.notificaciones, public.mensajes;
