// Textos de las secciones: español e inglés en textos/*.js (objetos es y en) y funciones nuevas con los
// 8 idiomas en el mismo archivo (MULTI). Los diccionarios completos se montan en porIdioma/<código>.js.
import * as comun from './textos/comun.js';
import * as muro from './textos/muro.js';
import * as tanques from './textos/tanques.js';
import * as cuenta from './textos/cuenta.js';
import * as foro from './textos/foro.js';
import * as mercado from './textos/mercado.js';
import * as tiendas from './textos/tiendas.js';
import * as legal from './textos/legal.js';
import * as wiki from './textos/wiki.js';
import * as cuidado from './textos/cuidado.js';
import * as herramientas from './textos/herramientas.js';
import * as chat from './textos/chat.js';
import * as traduccion from './textos/traduccion.js';
import * as social from './textos/social.js';
import * as pasos from './textos/pasos.js';
import * as anadir from './textos/anadir.js';
import * as logros from './textos/logros.js';
import * as estadisticas from './textos/estadisticas.js';
import * as guardados from './textos/guardados.js';
import * as relacionados from './textos/relacionados.js';
import * as bienvenida from './textos/bienvenida.js';
import * as seo from './textos/seo.js';
import * as conEspecie from './textos/conEspecie.js';
import * as invitacion from './textos/invitacion.js';
import * as errores from './textos/errores.js';
import * as cercania from './textos/cercania.js';
import * as distancia from './textos/distancia.js';
import * as catalogo from './textos/catalogo.js';
import * as instalar from './textos/instalar.js';
import * as apoyar from './textos/apoyar.js';
import * as contrasena from './textos/contrasena.js';
import * as selector from './textos/selector.js';
import * as recorte from './textos/recorte.js';
import * as seguimiento from './textos/seguimiento.js';
import * as cita from './textos/cita.js';
import * as administracion from './textos/administracion.js';
import * as verificar from './textos/verificar.js';
import * as avisos from './textos/avisos.js';

const SECCIONES = [comun, muro, tanques, cuenta, foro, mercado, tiendas, legal, wiki];
// Funciones nuevas con los 8 idiomas en el mismo archivo
const MULTI = [cuidado, herramientas, chat, traduccion, social, pasos, anadir, logros, estadisticas, guardados, relacionados, bienvenida, seo, conEspecie, invitacion, errores, cercania, distancia, catalogo, instalar, apoyar, contrasena, selector, recorte, seguimiento, cita, administracion, verificar, avisos];

export const conMulti = (lang, base) => Object.assign({}, base, ...MULTI.map((s) => s[lang]));
export const desdeSecciones = (lang) => conMulti(lang, Object.assign({}, ...SECCIONES.map((s) => s[lang])));
