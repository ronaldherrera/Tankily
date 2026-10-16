-- Borra la comunidad de demostración. Al eliminar los usuarios de demo se borran en cascada
-- sus perfiles, tanques, publicaciones, tiendas, anuncios, mensajes, campañas y demás.
delete from auth.users where email like '%@demo.tankily.invalid';
