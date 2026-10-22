import { LayoutDashboard, TrendingUp, Users, Flag, Store, Megaphone, Plug } from 'lucide-react';

// Secciones del panel de administración, agrupadas. Las usan el menú del panel (/admin/) y la burbuja flotante
// (components/shell/BotonAdmin.js): una sección nueva se añade aquí, con su texto en i18n/textos/administracion.js
export const GRUPOS_ADMIN = [
  ['general', [['resumen', LayoutDashboard], ['crecimiento', TrendingUp]]],
  ['comunidad', [['usuarios', Users], ['denuncias', Flag]]],
  ['negocio', [['tiendas', Store], ['campanas', Megaphone]]],
  ['sistema', [['proveedores', Plug]]],
];

export const SECCIONES_ADMIN = GRUPOS_ADMIN.flatMap(([, secciones]) => secciones.map(([clave]) => clave));
