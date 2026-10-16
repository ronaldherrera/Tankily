-- Envíos: hasta dónde envía un anuncio o una tienda (además del sí/no de `anuncios.envio` y
-- `tiendas.venta_online`). Distancia: coordenadas de las tiendas, obtenidas de su dirección pública
-- con OpenStreetMap al guardar la ficha. Los anuncios de particulares no guardan coordenadas: la web
-- usa el centro de su provincia, para no exponer dónde vive nadie.

alter table public.anuncios
  add column envio_alcance text check (envio_alcance in ('provincia', 'pais', 'internacional'));

alter table public.tiendas
  add column envio_alcance text check (envio_alcance in ('provincia', 'pais', 'internacional')),
  add column lat double precision check (lat between -90 and 90),
  add column lng double precision check (lng between -180 and 180);

-- Los dueños pueden cambiar estas columnas (la tabla solo permite editar columnas concretas)
grant update (envio_alcance) on public.anuncios to authenticated;
grant update (envio_alcance, lat, lng) on public.tiendas to authenticated;

-- Los anuncios que ya tenían envío pasan a "todo el país", que era lo que se entendía
update public.anuncios set envio_alcance = 'pais' where envio and envio_alcance is null;
update public.tiendas set envio_alcance = 'pais' where venta_online and envio_alcance is null;
