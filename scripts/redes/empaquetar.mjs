// Deja cada publicación lista para subir en marca/redes/publicaciones/<fecha>-<slug>/: archivos numerados e
// INSTRUCCIONES.txt con el texto de cada red (Instagram, TikTok, Facebook y YouTube), hashtags y créditos.
// Parte de lo que genera generar.mjs --v2 en marca/redes/salida-v2. Las carpetas que ya existen no se tocan
// (la del 20/10 se escribió a mano), salvo con --rehacer.
// Uso: node scripts/redes/empaquetar.mjs [--solo 2,7] [--rehacer]
import fs from 'node:fs';
import path from 'node:path';
import { PIEZAS } from './piezas.mjs';
import { DIRECCION } from './direccion.mjs';

const RAIZ = process.cwd();
const ORIGEN = path.join(RAIZ, 'marca', 'redes', 'salida-v2');
const DESTINO = path.join(RAIZ, 'marca', 'redes', 'publicaciones');
const REHACER = process.argv.includes('--rehacer');
const soloArg = process.argv[process.argv.indexOf('--solo') + 1];
const solo = process.argv.includes('--solo') ? new Set(soloArg.split(',').map(Number)) : null;

const fuentes = [
  ...Object.values(JSON.parse(fs.readFileSync(path.join(RAIZ, 'marca', 'redes', 'fotos', 'creditos.json'), 'utf8'))),
  ...Object.values(JSON.parse(fs.readFileSync(path.join(RAIZ, 'marca', 'redes', 'videos', 'creditos.json'), 'utf8'))),
];
const LICENCIAS = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/', 'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/', 'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY 2.5': 'https://creativecommons.org/licenses/by/2.5/', 'CC BY-SA 2.5': 'https://creativecommons.org/licenses/by-sa/2.5/',
};
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (f) => { const d = new Date(f + 'T12:00:00'); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
const LINEA = '='.repeat(66);
const copiar = (t) => `---------- copiar desde aquí ----------\n${t.trim()}\n---------- hasta aquí ----------`;

// texto.txt = cuerpo + «Foto(s): …» + «Vídeo: …» + hashtags, en párrafos
function partes(texto) {
  const ps = texto.trim().split(/\n\n+/);
  const tags = ps[ps.length - 1].startsWith('#') ? ps.pop() : '';
  const creditos = ps.filter((p) => /^(Fotos?|Vídeo):/.test(p));
  const cuerpo = ps.filter((p) => !creditos.includes(p));
  return { cuerpo, creditos, tags };
}
// Créditos con enlace a la obra y a la licencia (para la descripción de YouTube)
function creditosLargos(creditos) {
  return creditos.map((c) => {
    const tipo = c.split(':')[0];
    const obras = c.slice(tipo.length + 1).replace(/\.$/, '').split(';').map((s) => s.trim());
    return obras.map((o) => {
      const f = fuentes.find((x) => o.startsWith(`${x.autor} (${x.licencia})`) || o.startsWith(`${x.autor.split(',')[0]}`));
      if (!f) return `${tipo}: ${o}`;
      return `${tipo}: ${o}. ${f.fuente}${LICENCIAS[f.licencia] ? ` (licencia: ${LICENCIAS[f.licencia]})` : ''}`;
    }).join('\n');
  }).join('\n');
}
const conEnlace = (p) => p.replace(/:?\s*enlace en el perfil\.?\s*/gi, ' 👉 https://tankily.com\n');

function instrucciones(pieza, { cuerpo, creditos, tags }, archivos, nLaminas = 0) {
  const titulo = (DIRECCION[pieza.n]?.portada?.titulo || pieza.gancho || pieza.titulo).replace(/\n/g, ' ');
  // En Instagram y TikTok los enlaces del texto no se pueden pulsar: se manda al perfil. En Facebook y YouTube, enlace completo
  const sinEnlace = (p) => p.replace(/\s*\(enlace en el perfil\)/g, '').replace(/tankily\.com\/\S*[^\s.,)]/g, 'tankily.com')
    .replace(/tankily\.com( y tankily\.com)+/g, 'tankily.com')
    .replace(/tankily\.com(?![^\n]*enlace en el perfil)([.,]?)/g, 'tankily.com (enlace en el perfil)$1');
  const conHttps = (p) => p.replace(/(^|\s)(tankily\.com(?:\/\S*)?)/g, '$1https://$2');
  const cuerpoRedes = cuerpo.map(sinEnlace), cuerpoWeb = cuerpo.map((p) => conHttps(conEnlace(p.replace(/\s*\(enlace en el perfil\)/g, ''))));
  const ig = [...cuerpoRedes, ...creditos, tags].join('\n\n');
  const fb = [...cuerpoWeb, ...creditos, tags.split(' ').slice(0, 3).join(' ')].join('\n\n');
  const tagsTT = [...tags.split(' ').slice(0, 3), '#aquariumtok', '#fyp'].join(' ');
  const tt = [cuerpoRedes[0], cuerpoRedes.length > 1 ? cuerpoRedes[cuerpoRedes.length - 1] : '', creditos.join(' '), tagsTT].filter(Boolean).join('\n\n');
  const licSA = creditos.join(' ').includes('-SA');
  const cab = [
    `${pieza.formato === 'reel' ? 'REEL' : 'CARRUSEL'}: «${titulo.toUpperCase()}»`,
    fechaLarga(pieza.fecha) + (pieza.serie ? ` · Serie «${pieza.serie}»` : ''),
    '',
    'ARCHIVOS DE ESTA CARPETA',
    ...archivos.map(([a, d]) => `- ${a}: ${d}`),
    '',
    'CUÁNDO',
    'Ese día, entre las 19:30 y las 21:00. Publica en todas las redes seguidas.',
    'Pásate los archivos al móvil (Google Drive, WhatsApp a ti mismo o cable) y publica desde las apps.',
    '',
  ];
  let cuerpoTxt;
  if (pieza.formato === 'reel') {
    cuerpoTxt = [
      'RECUERDA: no añadas música (el vídeo ya lleva voz y fondo de agua) y desactiva los subtítulos automáticos (ya van incrustados).',
      '', LINEA, '1) INSTAGRAM: REEL', LINEA,
      '1. Pulsa + y luego Reel, y elige 1-video.mp4. No recortes ni añadas música, filtros ni texto.',
      '2. «Editar portada», luego «Añadir de la galería»: 2-portada-9x16.jpg. Ajusta el recorte de la cuadrícula como en 3-portada-4x5.jpg.',
      '3. Texto:', '', copiar(ig), '',
      `4. En «Configuración avanzada», luego «Texto alternativo»: Reel de Tankily: ${titulo}${/[?!.]$/.test(titulo) ? '' : '.'}`,
      '5. Publica y responde a los comentarios durante la primera hora.',
      '', LINEA, '2) TIKTOK', LINEA,
      '1. Pulsa + y luego Subir, y elige 1-video.mp4. Sin sonido añadido.',
      '2. Portada: el fotograma del título, o «Subir» 2-portada-9x16.jpg si te deja.',
      '3. Texto:', '', copiar(tt), '',
      '4. Deja activados «Permitir comentarios», Dúo y Stitch, y publica.',
      '', LINEA, '3) FACEBOOK: REEL EN LA PÁGINA «TANKILY»', LINEA,
      '1. Cambia a la página Tankily. Pulsa «Reel» y elige 1-video.mp4. Portada: 2-portada-9x16.jpg o el fotograma del título.',
      '2. Texto:', '', copiar(fb), '',
      '', LINEA, '4) YOUTUBE: SHORT', LINEA,
      '1. En la app de YouTube pulsa +, luego «Crear un Short» y «Subir», y elige 1-video.mp4. Sin sonido añadido.',
      '2. Título:', '', copiar(`${titulo.slice(0, 88)} #Shorts`), '',
      '3. Descripción:', '', copiar([...cuerpoWeb, creditosLargos(creditos), `${tags} #Shorts`].filter(Boolean).join('\n\n')), '',
      '4. Visibilidad: Pública. Audiencia: «No, no es contenido creado para niños». Miniatura: el fotograma del título.',
    ];
  } else {
    cuerpoTxt = [
      'Los carruseles se publican en Instagram y Facebook. En TikTok es opcional (modo foto).',
      '', LINEA, '1) INSTAGRAM: CARRUSEL', LINEA,
      `1. Pulsa + y luego Publicación, toca «Seleccionar varias» y elige las imágenes EN ORDEN (01, 02… ${String(nLaminas).padStart(2, '0')}).`,
      '2. Formato 4:5 vertical. Si la app recorta a cuadrado, pulsa el icono de las flechas para ver la imagen entera.',
      '3. Texto:', '', copiar(ig), '',
      `4. En «Texto alternativo» de la primera imagen: ${titulo}.`,
      '', LINEA, '2) FACEBOOK: PUBLICACIÓN EN LA PÁGINA «TANKILY»', LINEA,
      '1. Cambia a la página Tankily, «Foto/vídeo» y elige las imágenes en orden.',
      '2. Texto:', '', copiar(fb), '',
      '', LINEA, '3) TIKTOK (OPCIONAL, MODO FOTO)', LINEA,
      '1. Pulsa + y luego Subir, cambia a la pestaña «Fotos» y elige las imágenes en orden. Añade un sonido tranquilo de la biblioteca de TikTok.',
      '2. Texto:', '', copiar(tt),
    ];
  }
  const pie = [
    '', LINEA, 'DESPUÉS DE PUBLICAR', LINEA,
    '- Responde a todos los comentarios durante la primera hora, con el tono de Krill: cercano y con humor.',
    '- Apunta las visualizaciones y los seguidores nuevos de cada red para ir ajustando.',
    ...(creditos.length ? ['', 'CRÉDITOS',
      `Las fotos y vídeos son de Wikimedia Commons con licencia libre. Hay que nombrar a su autor y la licencia en cada publicación (ya van en los textos): no los quites.${licSA ? ' Las licencias «SA» además piden compartir la pieza con la misma licencia.' : ''}`] : []),
  ];
  return [...cab, ...cuerpoTxt, ...pie].join('\n') + '\n';
}

fs.mkdirSync(DESTINO, { recursive: true });
let hechas = 0;
for (const pieza of [...PIEZAS].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
  if (solo && !solo.has(pieza.n)) continue;
  const destino = path.join(DESTINO, `${pieza.fecha}-${pieza.slug}`);
  if (fs.existsSync(destino) && !REHACER) continue;
  const origen = fs.readdirSync(ORIGEN).find((d) => d.startsWith(String(pieza.n).padStart(2, '0') + '-'));
  if (!origen) { console.log(`· ${pieza.n} ${pieza.titulo}: aún no generada`); continue; }
  const o = path.join(ORIGEN, origen);
  const texto = fs.readFileSync(path.join(o, 'texto.txt'), 'utf8');
  fs.mkdirSync(destino, { recursive: true });
  const archivos = [];
  let nLaminas = 0;
  if (pieza.formato === 'reel') {
    fs.copyFileSync(path.join(o, 'video.mp4'), path.join(destino, '1-video.mp4'));
    fs.copyFileSync(path.join(o, 'portada-reel.jpg'), path.join(destino, '2-portada-9x16.jpg'));
    fs.copyFileSync(path.join(o, 'portada-perfil.jpg'), path.join(destino, '3-portada-4x5.jpg'));
    archivos.push(['1-video.mp4', 'el reel (vertical 9:16, con voz y subtítulos incrustados)'], ['2-portada-9x16.jpg', 'portada del reel'], ['3-portada-4x5.jpg', 'cómo se ve la portada en la cuadrícula de Instagram']);
  } else {
    const laminas = fs.readdirSync(o).filter((f) => /^\d+\.jpg$/.test(f)).sort();
    nLaminas = laminas.length;
    laminas.forEach((f) => fs.copyFileSync(path.join(o, f), path.join(destino, f)));
    archivos.push([laminas.length > 1 ? `${laminas[0]} … ${laminas[laminas.length - 1]}` : laminas[0], `las ${laminas.length} imágenes del carrusel, en orden (la 01 es la portada)`]);
  }
  archivos.push(['INSTRUCCIONES.txt', 'este archivo']);
  fs.writeFileSync(path.join(destino, 'INSTRUCCIONES.txt'), instrucciones(pieza, partes(texto), archivos, nLaminas));
  console.log(`✓ ${pieza.fecha} ${pieza.titulo}`);
  hechas++;
}
console.log(`${hechas} publicaciones preparadas en ${DESTINO}`);
