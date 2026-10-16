// Diccionarios por idioma.
// Español e inglés se escriben por secciones (textos/*.js, objetos es y en, uno junto al otro).
// El resto de idiomas tiene un archivo completo en idiomas/<código>.js con exactamente las mismas claves
// (lo comprueba `npm run i18n`). Cada diccionario completo se monta en porIdioma/<código>.js, que es lo que
// descarga el navegador (ver IdiomaProvider); este archivo los reúne para el servidor y los scripts.
import es from './porIdioma/es.js';
import en from './porIdioma/en.js';
import de from './porIdioma/de.js';
import pt from './porIdioma/pt.js';
import fr from './porIdioma/fr.js';
import it from './porIdioma/it.js';
import nl from './porIdioma/nl.js';
import pl from './porIdioma/pl.js';

export const diccionarios = { es, en, de, pt, fr, it, nl, pl };
