-- Quita de la comunidad de demostración todo lo del mercado y las tiendas (decisión del 23/10/2026):
-- los anuncios de las cuentas de muestra y las cuatro cuentas que solo eran tiendas. Al borrar esas cuentas se van
-- en cascada sus tiendas, reseñas, campañas, publicaciones, comentarios y respuestas del foro.
begin;
delete from public.anuncios where usuario_id in (select id from auth.users where email like '%@demo.tankily.invalid');
delete from auth.users where email in (
  'lumen_reef@demo.tankily.invalid', 'raiz_roca@demo.tankily.invalid',
  'cantabrico_azul@demo.tankily.invalid', 'pecera_viva@demo.tankily.invalid'
);
commit;
