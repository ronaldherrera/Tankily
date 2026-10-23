// Genera supabase/demo/datos_demo.sql con una comunidad de demostración:
// usuarios de 10 países y todos los niveles, tanques con
// habitantes, mediciones, diario y tareas, publicaciones, comentarios, me gusta, seguidores,
// hilos del foro con respuestas, votos y soluciones y mensajes. Sin mercado ni tiendas (decisión del 23/10/2026):
// las cuatro cuentas de tienda siguen en la lista para no mover los ids, pero no se crean (SIN_TIENDAS).
//
// Todo cuelga de usuarios con correo @demo.tankily.invalid y SIN contraseña (no se puede entrar
// con ellos). limpiar_demo.sql los borra y, en cascada, todo su contenido.
//
// Uso:  node supabase/demo/generar_demo.mjs
//       npx supabase db query --linked -f supabase/demo/datos_demo.sql
//       npx supabase db query --linked -f supabase/demo/limpiar_demo.sql   (para quitarlo)
import fs from 'fs';
import { especiesWiki } from '../../src/lib/especiesWiki.js';

const DOMINIO = 'demo.tankily.invalid';
const ID0 = 900000; // ids de demo: lejos de las secuencias reales
const ahora = Date.now();
const DIA = 86400000;
const hace = (dias, horas = 0) => new Date(ahora - dias * DIA - horas * 3600000).toISOString();
const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`);
const W = '/wiki-media/';
const img = (nombre) => {
  const e = especiesWiki.find((x) => x.nombre === nombre);
  if (!e) throw new Error('Sin imagen: ' + nombre);
  return encodeURI(e.imagen);
};
const foto = (ruta) => encodeURI(W + ruta);
const FOTOS = {
  reef: foto('Acuarios/Acuario marino — arrecife de coral (reef)/Acuario_marino_reef.webp'),
  fowlr: foto('Acuarios/Acuario marino — fowlr/Acuario_marino_fowlr.webp'),
  nano: foto('Acuarios/Nano acuario/Nano_acuario.webp'),
  comunidad: foto('Acuarios/Acuario dulce tropical de comunidad/Acuario_tropical_comunidad.webp'),
  plantado: foto('Acuarios/Acuario plantado/Acuario_plantado.webp'),
  gambas: foto('Acuarios/Acuario de gambas/Acuario_gambas.webp'),
  discos: foto('Acuarios/Acuario de discus/Acuario_discus.webp'),
  goldfish: foto('Acuarios/Acuario de agua fría  goldfish/Acuario_agua_fria_goldfish.webp'),
  koi: foto('Acuarios/Estanques koi/Estanque_koi.webp'),
  paludario: foto('Acuarios/Paludario/Paludario.webp'),
  aquascape: foto('Aquascaping/Principios/Principios.webp'),
  tecnicas: foto('Aquascaping/Tecnicas/Tecnicas.webp'),
  corales: foto('Biologia/Corales/Biologia_corales.webp'),
  co2: foto('Equipamiento/CO2/CO2.webp'),
  filtros: foto('Equipamiento/Filtros/Filtros.webp'),
  luz: foto('Equipamiento/Iluminacion/Iluminacion.webp'),
  tests: foto('Equipamiento/Tests/Tests.webp'),
  gambasBio: foto('Biologia/Gambas/Biologia_gambas.webp'),
  cuarentena: foto('Enfermedades/Cuarentena/Cuarentena.webp'),
  oodinium: foto('Enfermedades/Parasitarias/Oodinium.webp'),
};

// --- Usuarios -------------------------------------------------------------
const U = {};
const usuarios = [
  ['laura_reef', 'Laura Ferrer', 'ES', 'Valencia', 'avanzado', 'Reef mixto de 300 l desde 2019. SPS, LPS y mucho Triton. Si ves algo raro en mis corales, dímelo 😅', 'Acropora millepora', 'reef'],
  ['dani_plantados', 'Dani Ortega', 'ES', 'Madrid', 'profesional', 'Aquascaper. Nature style, CO₂ y mucha paciencia. Doy talleres de iniciación en Madrid.', 'Anubias nana', 'aquascape'],
  ['marta_empieza', 'Marta Ruiz', 'ES', 'Sevilla', 'principiante', 'Mi primer acuario tiene 3 meses. Aprendiendo a base de errores (y de este foro).', 'Paracheirodon innesi', 'comunidad'],
  ['javi_discos', 'Javier Molina', 'ES', 'Barcelona', 'avanzado', 'Discos salvajes y agua blanda. Osmosis, paciencia y cambios diarios.', 'Symphysodon discus', 'discos'],
  ['carmen_koi', 'Carmen Álvarez', 'ES', 'Asturias', 'avanzado', 'Estanque de 12 000 l en el jardín. Kohaku, showa y una tortuga que no invité.', 'Goldfish oranda', 'koi'],
  ['pablo_goldfish', 'Pablo Serrano', 'ES', 'Zaragoza', 'intermedio', 'Goldfish de velo. Defensor de los litros por pez: nada de peceras redondas.', 'Goldfish oranda', 'goldfish'],
  ['sofia_acuarios', 'Sofía Hernández', 'MX', 'Jalisco', 'intermedio', 'Guadalajara 🇲🇽 Comunitarios, gambas y un poco de todo. Me encantan los corydoras.', 'Corydoras aeneus', 'comunidad'],
  ['tomas_nano', 'Tomás Gallo', 'AR', 'Buenos Aires', 'avanzado', 'Nano reef de 60 l en un departamento de Palermo. Menos litros, más disciplina.', 'Amphiprion ocellaris', 'nano'],
  ['jake_reefs', 'Jake Miller', 'US', 'Florida', 'avanzado', 'Tampa, FL. Mixed reef and a FOWLR for the troublemakers. Frag swaps anytime.', 'Amphiprion percula', 'reef'],
  ['lukas_scapes', 'Lukas Weber', 'DE', 'Bayern', 'profesional', 'Aquascaping aus München. Iwagumi, Moos und viel zu viele Steine.', 'Anubias barteri', 'plantado'],
  ['ana_paludario', 'Ana Souza', 'BR', 'São Paulo', 'intermedio', 'Paludários, musgos e sapinhos imaginários. A parte terrestre também conta!', 'Anubias nana', 'paludario'],
  ['claire_crevettes', 'Claire Martin', 'FR', 'Bretagne', 'intermedio', 'Élevage de crevettes Neocaridina et Caridina. Couleurs, patience et eau stable.', 'Neocaridina davidi', 'gambas'],
  ['marco_discus', 'Marco Bianchi', 'IT', 'Lombardia', 'avanzado', 'Allevo discus da quindici anni. Acqua morbida e cambi frequenti.', 'Symphysodon aequifasciatus', 'discos'],
  ['sanne_nano', 'Sanne de Vries', 'NL', 'Utrecht', 'principiante', 'Mijn eerste nano-aquarium! Garnalen, mos en veel vragen.', 'Neocaridina davidi Blue', 'nano'],
  ['kasia_krewetki', 'Kasia Nowak', 'PL', 'Małopolskie', 'intermedio', 'Krewetki, mchy i krewetkarium 30 l. Kraków.', 'Caridina cantonensis CRS', 'gambas'],
  // Propietarios de tienda
  ['lumen_reef', 'Lumen Reef Studio', 'ES', 'Valencia', 'profesional', 'Tienda especializada en arrecife: corales de cultivo, iluminación y química marina.', 'Acropora spp', 'corales'],
  ['raiz_roca', 'Raíz & Roca', 'ES', 'Madrid', 'profesional', 'Plantas, rocas y maderas para aquascaping. Asesoramos tu layout.', 'Anubias barteri', 'tecnicas'],
  ['cantabrico_azul', 'Acuarios Cantábrico Azul', 'ES', 'Cantabria', 'profesional', 'Tienda de barrio en Santander desde hace 20 años. Agua dulce y fría.', 'Paracheirodon innesi', 'comunidad'],
  ['pecera_viva', 'Pecera Viva', 'MX', 'Ciudad de México', 'profesional', 'Peces de agua dulce, plantas y accesorios en la CDMX.', 'Corydoras aeneus', 'plantado'],
];
usuarios.forEach(([usuario], i) => { U[usuario] = `de300000-0000-4000-a000-${String(i + 1).padStart(12, '0')}`; });

// Cuentas de tienda: no se crean ni ellas ni nada suyo
const SIN_TIENDAS = new Set(['lumen_reef', 'raiz_roca', 'cantabrico_azul', 'pecera_viva']);
const sql = [];
const out = (s) => sql.push(s);
out('-- Generado por supabase/demo/generar_demo.mjs. Datos de DEMOSTRACIÓN: bórralos con limpiar_demo.sql antes del lanzamiento.');
out('begin;');

usuarios.forEach(([usuario, nombre, pais, provincia, nivel, bio, avatar, portada], i) => {
  if (SIN_TIENDAS.has(usuario)) return;
  const id = U[usuario];
  const alta = hace(120 - i * 4);
  out(`insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', ${q(id)}, 'authenticated', 'authenticated', ${q(`${usuario}@${DOMINIO}`)}, '', ${q(alta)}, '{"provider":"email","providers":["email"],"demo":true}', ${q(JSON.stringify({ usuario, nombre }))}, ${q(alta)}, ${q(alta)}, '', '', '', '');`);
  out(`update public.perfiles set nombre = ${q(nombre)}, bio = ${q(bio)}, pais = ${q(pais)}, provincia = ${q(provincia)}, nivel = ${q(nivel)}, avatar_url = ${q(img(avatar))}, portada_url = ${q(FOTOS[portada])}, creado_en = ${q(alta)}, muestra = true where id = ${q(id)};`);
});

// --- Tanques ------------------------------------------------------------------
// [dueño, nombre, tipo, litros, [l,a,h], equipo, descripción, días montado, cambio cada, visibilidad, foto, habitantes, perfil de agua]
const TQ = {};
const tanques = [
  ['laura_reef', 'Arrecife del salón', 'reef', 300, [120, 50, 55], { iluminacion: 'Radion XR30 G6', filtracion: 'Sump 80 l con refugio', skimmer: 'Bubble Magus Curve 7', calentador: '2 × 150 W' }, 'Reef mixto con roca viva de cultivo. Dosificación de balling y ICP cada tres meses.', 1500, 7, 'publico', null,
    [['Amphiprion ocellaris', 2, 'pez'], ['Acropora millepora', 3, 'coral'], ['Acropora spp', 2, 'coral'], ['Stylophora pistillata', 1, 'coral'], ['Alpheus sp', 1, 'invertebrado']], 'reef'],
  ['laura_reef', 'Cuarentena', 'marino_peces', 60, [60, 30, 35], { filtracion: 'Esponja madura', calentador: '75 W' }, 'Tanque de cuarentena para peces nuevos. Cuatro semanas mínimo.', 400, 3, 'privado', FOTOS.cuarentena, [], 'marino'],
  ['dani_plantados', 'Bosque de niebla', 'plantado', 120, [90, 45, 45], { iluminacion: 'Chihiros WRGB II 90', filtracion: 'Oase BioMaster 350', co2: 'Botella 2 kg con difusor en línea', sustrato: 'ADA Amazonia' }, 'Layout de bosque con raíces de manzanita y musgo. CO₂ a 30 mg/l.', 210, 7, 'publico', FOTOS.aquascape,
    [['Paracheirodon innesi', 25, 'pez'], ['Corydoras aeneus', 8, 'pez'], ['Neocaridina davidi', 30, 'invertebrado'], ['Anubias nana', 6, 'planta'], ['Hygrophila difformis', 5, 'planta']], 'plantado'],
  ['dani_plantados', 'Nano de gambas', 'gambas', 30, [36, 22, 26], { iluminacion: 'Twinstar 30', filtracion: 'Filtro de esponja' }, 'Colonia de cherry rojas. Sin peces, solo gambas y musgo.', 300, 10, 'publico', FOTOS.gambas,
    [['Neocaridina davidi', 60, 'invertebrado'], ['Anubias nana', 2, 'planta']], 'gambas'],
  ['marta_empieza', 'Mi primer acuario', 'comunidad', 60, [60, 30, 36], { filtracion: 'Filtro de mochila', calentador: '75 W' }, '¡Mi primer acuario! Montado en verano con ayuda del foro.', 95, 7, 'publico', null,
    [['Paracheirodon innesi', 4, 'pez'], ['Corydoras aeneus', 3, 'pez'], ['Goldfish oranda', 1, 'pez']], 'principiante'],
  ['javi_discos', 'Discos salvajes', 'discos', 400, [150, 60, 50], { filtracion: 'Eheim Professionel 5e 600', calentador: '2 × 300 W' }, 'Grupo de discos salvajes en agua de ósmosis. Cambio diario del 20 %.', 900, 3, 'publico', img('Symphysodon discus'),
    [['Symphysodon discus', 6, 'pez'], ['Corydoras sterbai', 10, 'pez'], ['Echinodorus bleheri', 4, 'planta']], 'discos'],
  ['carmen_koi', 'Estanque del jardín', 'estanque', 12000, null, { filtracion: 'Filtro de tambor + biológico de 3 cámaras' }, 'Estanque de 12 000 l con zona de plantas. Los koi entran en reposo en invierno.', 2400, 30, 'publico', null,
    [['Cyprinus rubrofuscus', 9, 'pez'], ['Nymphaea sp', 4, 'planta']], 'estanque'],
  ['pablo_goldfish', 'Goldfish de velo', 'agua_fria', 240, [120, 45, 45], { filtracion: 'Externo 1200 l/h' }, 'Tres oranda y un ryukin. Sin calentador y con mucho oxígeno.', 600, 7, 'publico', null,
    [['Goldfish oranda', 3, 'pez'], ['Goldfish ryukin', 1, 'pez']], 'fria'],
  ['sofia_acuarios', 'Comunitario Guadalajara', 'comunidad', 150, [100, 40, 40], { filtracion: 'Canister 1000 l/h', calentador: '150 W' }, 'Comunitario plantado con corydoras, neones y un montón de caracoles.', 500, 7, 'publico', null,
    [['Paracheirodon innesi', 15, 'pez'], ['Corydoras aeneus', 7, 'pez'], ['Hyphessobrycon herbertaxelrodi', 10, 'pez'], ['Anubias barteri', 3, 'planta']], 'comunidad'],
  ['tomas_nano', 'Nano reef Palermo', 'nano_marino', 60, [45, 40, 35], { iluminacion: 'AI Prime 16HD', filtracion: 'All-in-one trasero' }, 'Nano reef con blandos y LPS. Cambio del 10 % cada semana sin falta.', 700, 7, 'publico', FOTOS.nano,
    [['Amphiprion ocellaris', 2, 'pez'], ['Stylophora pistillata', 1, 'coral']], 'reef'],
  ['jake_reefs', 'Mixed reef 120 gal', 'reef', 450, [150, 60, 60], { iluminacion: 'Hybrid LED + T5', filtracion: 'Sump 40 gal', skimmer: 'Reef Octopus' }, 'Mixed reef with a clown pair and a frag rack in the sump.', 1100, 7, 'publico', FOTOS.reef,
    [['Amphiprion percula', 2, 'pez'], ['Centropyge loriculus', 1, 'pez'], ['Acropora millepora', 4, 'coral'], ['Acropora spp', 3, 'coral']], 'reef'],
  ['lukas_scapes', 'Iwagumi 60P', 'plantado', 64, [60, 30, 36], { iluminacion: 'ADA Solar RGB', co2: 'CO₂ 1 Blase/s', sustrato: 'ADA Amazonia' }, 'Klassisches Iwagumi mit Seiryu-Steinen und Glossostigma-Teppich.', 160, 7, 'publico', FOTOS.tecnicas,
    [['Danio margaritatus', 15, 'pez'], ['Glossostigma elatinoides', 10, 'planta'], ['Neocaridina davidi', 15, 'invertebrado']], 'plantado'],
  ['ana_paludario', 'Paludário da varanda', 'paludario', 180, [80, 45, 60], { iluminacion: 'LED 6500K', filtracion: 'Bomba com cascata' }, 'Paludário com cascata, musgos e uma parte aquática com tetras.', 420, 14, 'publico', null,
    [['Paracheirodon innesi', 10, 'pez'], ['Anubias nana', 5, 'planta'], ['Ficus pumila', 3, 'planta']], 'comunidad'],
  ['claire_crevettes', 'Crevettier 54 l', 'gambas', 54, [60, 30, 30], { filtracion: 'Filtre éponge double', calentador: '50 W' }, 'Bac dédié aux Caridina : eau osmosée reminéralisée, sol actif.', 380, 7, 'publico', FOTOS.gambasBio,
    [['Caridina cantonensis CRS', 40, 'invertebrado'], ['Anubias nana', 3, 'planta']], 'gambas'],
  ['marco_discus', 'Vasca discus', 'discos', 350, [130, 60, 50], { filtracion: 'Filtro esterno doppio', calentador: '300 W' }, 'Vasca dedicata ai discus, acqua d’osmosi e cambi del 30 % due volte a settimana.', 1800, 3, 'publico', FOTOS.discos,
    [['Symphysodon aequifasciatus', 7, 'pez'], ['Corydoras sterbai', 6, 'pez']], 'discos'],
  ['sanne_nano', 'Mijn eerste nano', 'gambas', 25, [30, 30, 28], { filtracion: 'Sponsfilter' }, 'Mijn eerste aquarium met garnalen en mos.', 60, 7, 'publico', null,
    [['Neocaridina davidi Blue', 12, 'invertebrado']], 'gambas'],
  ['kasia_krewetki', 'Krewetkarium 30 l', 'gambas', 30, [36, 30, 30], { filtracion: 'Gąbka', calentador: '25 W' }, 'Krewetkarium z CRS i mchem. Woda RO z remineralizatorem.', 260, 7, 'publico', img('Caridina cantonensis CBS'),
    [['Caridina cantonensis CRS', 25, 'invertebrado'], ['Caridina cantonensis CBS', 15, 'invertebrado']], 'gambas'],
];

// Perfiles de agua: [parámetro, valor base, variación]
const AGUA = {
  reef: [['temperatura', 25.4, 0.4], ['salinidad', 35, 0.5], ['kh', 8.2, 0.4], ['calcio', 430, 15], ['magnesio', 1330, 30], ['nitrato', 6, 3], ['fosfato', 0.05, 0.03], ['ph', 8.2, 0.08]],
  marino: [['temperatura', 25.5, 0.4], ['salinidad', 33, 0.5], ['nitrato', 15, 5], ['ph', 8.1, 0.1]],
  plantado: [['temperatura', 24.5, 0.5], ['ph', 6.6, 0.15], ['kh', 4, 0.5], ['gh', 7, 1], ['nitrato', 12, 4], ['co2', 28, 4]],
  gambas: [['temperatura', 22, 0.6], ['ph', 7.1, 0.2], ['gh', 7, 0.8], ['kh', 4, 0.5], ['tds', 240, 15], ['nitrato', 8, 3]],
  principiante: [['temperatura', 26, 0.8], ['ph', 7.8, 0.15], ['amonio', 0.05, 0.05], ['nitrito', 0.05, 0.05], ['nitrato', 30, 10]],
  discos: [['temperatura', 29.5, 0.4], ['ph', 6.3, 0.15], ['gh', 3, 0.5], ['kh', 2, 0.5], ['tds', 90, 15], ['nitrato', 5, 2]],
  estanque: [['temperatura', 17, 3], ['ph', 7.6, 0.2], ['kh', 6, 1], ['nitrato', 20, 6]],
  fria: [['temperatura', 19, 1], ['ph', 7.4, 0.15], ['gh', 12, 1], ['nitrato', 25, 8]],
  comunidad: [['temperatura', 25, 0.5], ['ph', 7, 0.2], ['gh', 8, 1], ['kh', 5, 0.7], ['nitrato', 15, 5]],
};
// Pseudoaleatorio determinista: el SQL sale igual en cada ejecución
let semilla = 7;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
const redondear = (v, p) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10 ** p) / 10 ** p);

let idHab = ID0 + 1000;
let idMed = ID0 + 5000;
let idEv = ID0 + 20000;
let idTarea = ID0 + 30000;
tanques.forEach(([dueno, nombre, tipo, litros, dim, equipo, desc, dias, cambio, vis, fotoUrl, habitantes, agua], i) => {
  const id = ID0 + 200 + i;
  TQ[`${dueno}:${nombre}`] = id;
  const creado = hace(Math.min(dias, 110) - 1);
  out(`insert into public.tanques (id, usuario_id, nombre, tipo, litros, largo_cm, ancho_cm, alto_cm, descripcion, equipo, foto_url, montado_en, cambio_agua_cada_dias, visibilidad, creado_en)
overriding system value values (${id}, ${q(U[dueno])}, ${q(nombre)}, ${q(tipo)}, ${litros}, ${dim ? dim.join(', ') : 'null, null, null'}, ${q(desc)}, ${q(JSON.stringify(equipo))}::jsonb, ${q(fotoUrl)}, ${q(hace(dias).slice(0, 10))}, ${cambio}, ${q(vis)}, ${q(creado)});`);
  for (const [especie, cantidad, categoria] of habitantes) {
    const e = especiesWiki.find((x) => x.nombre === especie);
    out(`insert into public.habitantes (id, tanque_id, categoria, nombre, nombre_cientifico, cantidad, wiki_ruta, anadido_en, creado_en) overriding system value values (${idHab++}, ${id}, ${q(categoria)}, ${q(e?.comun && e.comun !== especie ? e.comun : especie)}, ${q(especie)}, ${cantidad}, ${q(e?.ruta || null)}, ${q(hace(Math.min(dias, 100) - 5).slice(0, 10))}, ${q(creado)});`);
  }
  // Mediciones semanales de las últimas 8 semanas
  for (let s = 8; s >= 0; s--) {
    for (const [param, base, vari] of AGUA[agua]) {
      if (azar() < 0.25 && s > 0) continue; // no todo se mide cada semana
      const valor = redondear(base + (azar() * 2 - 1) * vari, param === 'fosfato' ? 3 : 2);
      out(`insert into public.mediciones (id, tanque_id, parametro, valor, medido_en, creado_en) overriding system value values (${idMed++}, ${id}, ${q(param)}, ${Math.max(valor, 0)}, ${q(hace(s * 7 + 1, 3))}, ${q(hace(s * 7 + 1, 3))});`);
    }
  }
  // Diario: cambios de agua según su frecuencia y algún mantenimiento
  for (let d = cambio + Math.floor(azar() * 3); d < 70; d += cambio) {
    out(`insert into public.tanque_eventos (id, tanque_id, tipo, nota, fecha, creado_en) overriding system value values (${idEv++}, ${id}, 'cambio_agua', ${q(azar() < 0.3 ? `${Math.round(litros * 0.2)} l` : null)}, ${q(hace(d, 2))}, ${q(hace(d, 2))});`);
  }
  out(`insert into public.tanque_eventos (id, tanque_id, tipo, nota, fecha, creado_en) overriding system value values (${idEv++}, ${id}, 'filtro', null, ${q(hace(18))}, ${q(hace(18))});`);
  // Tareas de mantenimiento (privadas del dueño): unas al día y otras pendientes
  const tareas = [['test', 7, 8], ['filtro', 30, 18], ['limpieza', 14, 6]];
  if (['plantado'].includes(tipo)) tareas.push(['abono', 7, 7]);
  for (const [tt, cada, hechaHace] of tareas) {
    out(`insert into public.tareas (id, tanque_id, tipo, cada_dias, ultima_vez, creado_en) overriding system value values (${idTarea++}, ${id}, ${q(tt)}, ${cada}, ${q(hace(hechaHace))}, ${q(creado)});`);
  }
});

// --- Seguidores -----------------------------------------------------------------
const aficionados = usuarios.slice(0, 15).map(([u]) => u);
const seguir = new Set();
const sigue = (a, b) => { if (a !== b) seguir.add(`${a}>${b}`); };
aficionados.forEach((a, i) => {
  // Todos siguen a algunos referentes y a gente de su mismo tipo de acuario
  ['laura_reef', 'dani_plantados', 'lukas_scapes'].forEach((b) => sigue(a, b));
  for (let k = 1; k <= 4; k++) sigue(a, aficionados[(i + k * 3) % aficionados.length]);
});
['marta_empieza', 'sofia_acuarios', 'sanne_nano'].forEach((a) => ['raiz_roca', 'cantabrico_azul', 'pecera_viva'].forEach((b) => sigue(a, b)));
['laura_reef', 'tomas_nano', 'jake_reefs'].forEach((a) => sigue(a, 'lumen_reef'));
let n = 0;
for (const par of seguir) {
  const [a, b] = par.split('>');
  if (SIN_TIENDAS.has(a) || SIN_TIENDAS.has(b)) continue;
  out(`insert into public.seguidores (seguidor_id, seguido_id, creado_en) values (${q(U[a])}, ${q(U[b])}, ${q(hace(90 - (n++ % 80)))});`);
}

// Seguidores de tanques
const segTanque = [
  ['marta_empieza', 'dani_plantados:Bosque de niebla'], ['sofia_acuarios', 'dani_plantados:Bosque de niebla'], ['lukas_scapes', 'dani_plantados:Bosque de niebla'],
  ['tomas_nano', 'laura_reef:Arrecife del salón'], ['jake_reefs', 'laura_reef:Arrecife del salón'], ['lumen_reef', 'laura_reef:Arrecife del salón'],
  ['marco_discus', 'javi_discos:Discos salvajes'], ['javi_discos', 'marco_discus:Vasca discus'], ['claire_crevettes', 'kasia_krewetki:Krewetkarium 30 l'],
  ['kasia_krewetki', 'claire_crevettes:Crevettier 54 l'], ['sanne_nano', 'dani_plantados:Nano de gambas'], ['pablo_goldfish', 'carmen_koi:Estanque del jardín'],
  ['laura_reef', 'jake_reefs:Mixed reef 120 gal'], ['dani_plantados', 'lukas_scapes:Iwagumi 60P'], ['ana_paludario', 'lukas_scapes:Iwagumi 60P'],
];
segTanque.filter(([u]) => !SIN_TIENDAS.has(u)).forEach(([u, t], i) => out(`insert into public.tanque_seguidores (usuario_id, tanque_id, creado_en) values (${q(U[u])}, ${TQ[t]}, ${q(hace(60 - i * 3))});`));

// --- Publicaciones ------------------------------------------------------------------
// [autor, tanque o null, contenido, imágenes, días atrás]
const posts = [
  ['laura_reef', 'Arrecife del salón', 'Por fin la millepora está cogiendo color en las puntas 💜 Tres meses estable con KH en 8,2 y nada de picos. La paciencia en reef es literal. #reef #sps', [img('Acropora millepora')], 1],
  ['dani_plantados', 'Bosque de niebla', 'Poda de mantenimiento hecha. Dejo la hygrophila más baja para que entre luz al primer plano. ¿Qué os parece la nueva línea del musgo? #aquascaping #plantado', [FOTOS.aquascape], 2],
  ['marta_empieza', 'Mi primer acuario', 'Tres meses con mi primer acuario 🎉 Gracias a todos los que me ayudasteis con el ciclado. Lo siguiente: aprender a no comprar todos los peces que me gustan 😂 #principiantes', [FOTOS.comunidad], 3],
  ['javi_discos', 'Discos salvajes', 'Cambio diario hecho. Agua a 29,5 °C, conductividad en 90 µS. Los discos ya comen de la mano. #discos', [img('Symphysodon discus')], 1],
  ['carmen_koi', 'Estanque del jardín', 'Empieza a bajar la temperatura del estanque: 15 °C esta mañana. Toca reducir la comida y pasar al pienso de germen de trigo. #koi #estanques', [FOTOS.koi], 4],
  ['pablo_goldfish', 'Goldfish de velo', 'Recordatorio para quien empieza: un oranda adulto mide 25-30 cm. Nada de peceras redondas, por favor 🙏 #goldfish #aguafria', [img('Goldfish oranda')], 5],
  ['sofia_acuarios', 'Comunitario Guadalajara', 'Mis corydoras pusieron huevos en el cristal 😍 ¿Los separo o los dejo a su suerte? #corydoras', [img('Corydoras aeneus')], 2],
  ['tomas_nano', 'Nano reef Palermo', 'Seis meses de nano reef. El secreto no es el equipo, es la constancia: cambio del 10 % todos los domingos, sin excusas. #nanoreef', [FOTOS.nano], 6],
  ['jake_reefs', 'Mixed reef 120 gal', 'New frag rack in the sump is filling up fast. Anyone in Florida up for a frag swap this month? #reef #frags', [FOTOS.corales], 3],
  ['lukas_scapes', 'Iwagumi 60P', 'Der Glossostigma-Teppich schließt sich endlich. Woche 6, CO₂ und Licht gut abgestimmt. #iwagumi #aquascaping', [FOTOS.tecnicas], 2],
  ['ana_paludario', 'Paludário da varanda', 'A cascata finalmente funciona sem respingar na parede 😅 Agora é esperar o musgo cobrir tudo. #paludario', [FOTOS.paludario], 7],
  ['claire_crevettes', 'Crevettier 54 l', 'Première portée de Crystal Red ! Une vingtaine de crevettes minuscules sur la mousse. #crevettes #caridina', [img('Caridina cantonensis CRS')], 1],
  ['marco_discus', 'Vasca discus', 'Due discus hanno iniziato a pulire il vaso: forse una coppia in arrivo 🤞 #discus', [img('Symphysodon aequifasciatus')], 4],
  ['sanne_nano', 'Mijn eerste nano', 'Mijn eerste garnalen zijn binnen! Twaalf blauwe Neocaridina. Tips zijn welkom 💙 #garnalen', [img('Neocaridina davidi Blue')], 2],
  ['kasia_krewetki', 'Krewetkarium 30 l', 'Nowe CBS w krewetkarium. Parametry stabilne od tygodnia, TDS 240. #krewetki', [img('Caridina cantonensis CBS')], 3],
  ['laura_reef', null, 'Consejo rápido: antes de culpar a la luz, mide fosfatos y nitratos. El 80 % de los problemas de color en SPS que veo son de nutrientes. @tomas_nano tú lo sabes bien 😉 #reef', [FOTOS.tests], 8],
  ['dani_plantados', null, 'Taller gratuito de aquascaping este sábado en Madrid. Traed vuestras dudas sobre CO₂ y abonado. #quedada #aquascaping', [FOTOS.co2], 9],
  ['lumen_reef', null, 'Nuevos frags de Acropora de cultivo propio en tienda, aclimatados a LED. Todos con ficha de parámetros. #reef #corales', [img('Acropora spp')], 2],
  ['raiz_roca', null, 'Llegaron rocas Seiryu y maderas de manzanita. Ideal para iwagumi como el de @lukas_scapes. #aquascaping', [FOTOS.tecnicas], 5],
  ['marta_empieza', null, 'Pregunta tonta: ¿cada cuánto limpiáis el filtro? El mío tiene la esponja marrón y me da miedo tocarlo. #principiantes', [], 6],
  ['sofia_acuarios', null, 'Probando la calculadora de cambio de agua de Tankily: con un 30 % bajo los nitratos de 40 a 29. Muy útil 🙌 #nitratos', [], 4],
  ['jake_reefs', null, 'Quarantine every fish. Every single one. Learned it the hard way with marine ich. #reef #quarantine', [FOTOS.oodinium], 10],
  ['pablo_goldfish', null, 'Los goldfish de cuerpo alargado y los de velo NO deberían ir juntos: los rápidos les quitan la comida a los lentos. #goldfish', [], 11],
  ['javi_discos', null, 'Osmosis + remineralizador: mis números para discos salvajes. GH 3, KH 2, 90 µS. ¿Cómo lo tenéis vosotros? #discos', [FOTOS.filtros], 12],
  ['tomas_nano', 'Nano reef Palermo', 'Los ocellaris ya duermen en la Stylophora. No es una anémona, pero a ellos les vale 😄 #nanoreef #payasos', [img('Amphiprion ocellaris')], 1],
  ['lukas_scapes', null, 'Tipp: Licht nicht gleich auf 100 %. Zwei Wochen mit 60 % starten spart euch viel Algenärger. #aquascaping', [FOTOS.luz], 13],
];
const P = [];
posts.forEach(([autor, tanque, contenido, imagenes, dias], i) => {
  const id = ID0 + 400 + i;
  P.push({ id, autor });
  if (SIN_TIENDAS.has(autor)) return;
  out(`insert into public.publicaciones (id, usuario_id, tanque_id, contenido, imagenes, creado_en) overriding system value values (${id}, ${q(U[autor])}, ${tanque ? TQ[`${autor}:${tanque}`] : 'null'}, ${q(contenido)}, ${arr(imagenes)}, ${q(hace(dias, i % 9))});`);
});
// Un eco (compartir)
out(`insert into public.publicaciones (id, usuario_id, contenido, tipo, eco_de, creado_en) overriding system value values (${ID0 + 499}, ${q(U.sofia_acuarios)}, 'Imprescindible para quien empieza con goldfish 👇', 'eco', ${ID0 + 405}, ${q(hace(4))});`);

// Me gusta
let likes = 0;
P.forEach(({ id, autor }, i) => {
  if (SIN_TIENDAS.has(autor)) return;
  const cuantos = 3 + Math.floor(azar() * 9);
  for (let k = 0; k < cuantos; k++) {
    const u = aficionados[(i * 5 + k * 7) % aficionados.length];
    if (u === autor) continue;
    out(`insert into public.me_gusta (usuario_id, publicacion_id, creado_en) values (${q(U[u])}, ${id}, ${q(hace(Math.max(posts[i][4] - 0.2, 0.05)))}) on conflict do nothing;`);
    likes++;
  }
});

// Comentarios
const comentarios = [
  [0, 'tomas_nano', '¡Qué color! ¿Qué espectro usas en la Radion?'], [0, 'laura_reef', '@tomas_nano el AB+ de Ecotech, con los azules al 90 %.'], [0, 'jake_reefs', 'Beautiful colors on that millepora 🔥'],
  [1, 'lukas_scapes', 'Sehr schön! Die Moos-Linie gibt viel Tiefe.'], [1, 'marta_empieza', 'Algún día tendré un acuario así 😍'], [1, 'dani_plantados', '@marta_empieza ¡seguro que sí! Empieza con plantas fáciles y paciencia.'],
  [2, 'dani_plantados', '¡Enhorabuena, Marta! Tres meses es cuando empieza lo bueno.'], [2, 'sofia_acuarios', 'Felicidades 🎉 Ojo con el goldfish con los neones: necesitan temperaturas distintas.'], [2, 'pablo_goldfish', 'Totalmente de acuerdo con Sofía: el oranda estaría mejor en agua fría.'], [2, 'marta_empieza', 'Gracias! Lo vi en la compatibilidad del tanque, estoy buscándole un hogar mejor 🙈'],
  [3, 'marco_discus', 'Ottimi parametri! Anche io tengo i miei a 29-30 °C.'], [3, 'javi_discos', '@marco_discus ¡grazie! Los salvajes agradecen el agua muy blanda.'],
  [4, 'pablo_goldfish', 'En Zaragoza ya estamos igual. ¿Dejas de alimentar por debajo de 10 °C?'], [4, 'carmen_koi', 'Sí, por debajo de 8-10 °C nada de comida. Su digestión se para.'],
  [6, 'claire_crevettes', 'Si tu veux des alevins, sépare les œufs dans une petite boîte avec du bleu de méthylène.'], [6, 'marta_empieza', 'Yo los dejaría, a ver si alguno sale adelante 🤞'], [6, 'sofia_acuarios', 'Los dejé y hoy vi dos alevines escondidos en el musgo 😍'],
  [7, 'laura_reef', 'Gran verdad. La constancia gana a cualquier gadget.'], [8, 'laura_reef', 'If you ever come to Valencia, frag swap guaranteed 😄'],
  [9, 'dani_plantados', 'Qué limpio queda ese iwagumi, Lukas.'], [11, 'kasia_krewetki', 'Gratulacje! Pierwsze młode to najlepsze uczucie.'], [11, 'sanne_nano', 'Zo mooi! Ik hoop dat mijn garnalen ook babies krijgen.'],
  [13, 'claire_crevettes', 'Bienvenue ! Garde l’eau stable et ne surnourris pas.'], [13, 'kasia_krewetki', 'Stabilne parametry to podstawa. Powodzenia!'],
  [15, 'tomas_nano', 'Culpable 🙋‍♂️ Medí fosfatos y estaban por las nubes.'], [16, 'marta_empieza', '¡Me apunto! ¿Hay que llevar algo?'], [16, 'raiz_roca', '@marta_empieza solo ganas de aprender. Ponemos nosotros el material.'],
  [19, 'dani_plantados', 'Nunca bajo el grifo: enjuágala en agua del propio acuario y solo cuando baje el caudal.'], [19, 'cantabrico_azul', 'Esa capa marrón son tus bacterias buenas. Enjuague suave con agua del acuario y listo.'], [19, 'marta_empieza', '¡Gracias! Pensé que estaba sucia de verdad 😅'],
  [21, 'laura_reef', 'Amén. Cuarentena siempre.'], [24, 'laura_reef', 'Si no tiene anémona, la Stylophora es la sustituta oficial 😂'], [25, 'dani_plantados', 'Muy importante. La mitad de mis algas del primer año fueron por eso.'],
];
comentarios.forEach(([i, autor, texto], k) => {
  if (SIN_TIENDAS.has(autor) || SIN_TIENDAS.has(P[i].autor)) return;
  out(`insert into public.comentarios (id, publicacion_id, usuario_id, contenido, creado_en) overriding system value values (${ID0 + 600 + k}, ${P[i].id}, ${q(U[autor])}, ${q(texto)}, ${q(hace(Math.max(posts[i][4] - 0.1 - k * 0.002, 0.02)))});`);
});

// --- Foro ---------------------------------------------------------------------------
// [categoría, autor, tanque, título, contenido, días, respuestas [autor, texto, votantes], índice de la solución]
const hilos = [
  ['principiantes', 'marta_empieza', 'Mi primer acuario', '¿Es normal que el agua se ponga blanca tras montar el acuario?', 'Monté el acuario hace cinco días y el agua se ha puesto lechosa. No tengo peces todavía. ¿Hago un cambio de agua?', 80,
    [['dani_plantados', 'Es un pico bacteriano, normal en un acuario recién montado. No cambies agua: se aclara solo en unos días mientras se asienta el filtro.', 6], ['cantabrico_azul', 'Confirmo. Paciencia y no alimentes nada todavía. Ve midiendo amonio y nitritos para seguir el ciclado.', 3], ['marta_empieza', '¡Gracias! Al cuarto día se aclaró del todo.', 0]], 0],
  ['reef', 'tomas_nano', 'Nano reef Palermo', 'Puntas blancas en la Stylophora: ¿luz o nutrientes?', 'Desde hace una semana veo las puntas de la Stylophora más claras. Nitratos en 2 y fosfatos en 0,01. Luz al 70 %.', 30,
    [['laura_reef', 'Con nitratos en 2 y fosfatos en 0,01 vas muy justo de nutrientes. Sube un poco la alimentación antes de tocar la luz.', 9], ['jake_reefs', 'Agree with Laura. Ultra low nutrients bleach SPS faster than too much light.', 5], ['lumen_reef', 'Si quieres, trae una muestra y te hacemos un análisis ICP para descartar otros elementos.', 2]], 0],
  ['plantado', 'sofia_acuarios', 'Comunitario Guadalajara', 'Algas en pincel en las hojas de anubias', 'Me están saliendo algas negras tipo pincel en los bordes de las anubias. Tengo luz 8 horas y sin CO₂.', 25,
    [['dani_plantados', 'Suele ser CO₂ inestable o exceso de materia orgánica. Baja la luz a 6 h, limpia el filtro y quita las hojas más afectadas.', 7], ['lukas_scapes', 'Dazu: Gegen Pinselalgen hilft lokal etwas flüssiger Kohlenstoff, aber vorsichtig dosieren.', 3]], 0],
  ['gambas', 'sanne_nano', 'Mijn eerste nano', 'Gambas que mueren durante la muda', 'Llevo dos semanas y ya se me han muerto tres gambas justo al mudar. GH 4, KH 2.', 12,
    [['claire_crevettes', 'GH 4 c’est un peu bas pour des Neocaridina. Monte doucement vers 6-8 avec un reminéralisant GH+.', 6], ['kasia_krewetki', 'Zgadzam się. Problemy z linieniem to prawie zawsze za niskie GH.', 4], ['dani_plantados', 'Sube el GH poco a poco, como mucho 1 °dH por día, para no provocar más mudas fallidas.', 5]], 0],
  ['agua-fria', 'pablo_goldfish', 'Goldfish de velo', '¿Cuántos litros por goldfish de velo?', 'Para abrir debate: veo muchos acuarios de 60 l con tres goldfish. ¿Qué mínimo recomendáis vosotros?', 40,
    [['carmen_koi', 'Para velo, 80 l para el primero y 40 l más por cada adicional. Y filtración sobredimensionada.', 8], ['cantabrico_azul', 'En tienda recomendamos lo mismo. Producen muchos desechos.', 4], ['marta_empieza', 'Vaya, entonces mi oranda necesita otro sitio 😬', 1]], 0],
  ['enfermedades', 'jake_reefs', null, 'Ich on a new tang after 2 weeks', 'Added a tang without quarantine (I know…). White spots appeared after two weeks. Options in a reef with inverts?', 18,
    [['laura_reef', 'Saca el pez a un tanque hospital y trátalo allí. El display, sin peces 76 días para romper el ciclo.', 7], ['tomas_nano', 'Lo de los 76 días es clave. Duele, pero funciona.', 3]], 0],
  ['ciclidos', 'marco_discus', 'Vasca discus', 'Discus: cambi d’acqua quotidiani o due volte a settimana?', 'Per discus d’allevamento, secondo voi servono davvero i cambi quotidiani?', 22,
    [['javi_discos', 'Para salvajes o crías, diarios. Para adultos de criadero bien adaptados, dos cambios grandes por semana van bien.', 6], ['marco_discus', 'Grazie Javi, coincide con la mia esperienza.', 0]], 0],
  ['equipamiento', 'lukas_scapes', null, 'Externer Filter oder Rucksackfilter für 60 l?', 'Für ein 60-l-Scape: lohnt sich ein Außenfilter oder reicht ein Rucksackfilter?', 15,
    [['dani_plantados', 'Externo pequeño, siempre. Puedes ocultar tuberías y meter más material biológico.', 4], ['raiz_roca', 'Coincidimos. Y con tubos de cristal queda mucho más limpio el layout.', 2]], 0],
  ['bricolaje', 'ana_paludario', 'Paludário da varanda', 'Fundo 3D com espuma expansiva: vale a pena?', 'Quero fazer um fundo 3D no paludário. Alguém já usou espuma expansiva com fibra de coco?', 35,
    [['dani_plantados', 'Sí, pero usa espuma sin fungicidas y deja curar 48 h antes de llenar. Luego silicona y fibra de coco.', 5]], -1],
  ['presentaciones', 'kasia_krewetki', 'Krewetkarium 30 l', 'Cześć! Krewetkarium z Krakowa', 'Cześć wszystkim! Mam krewetkarium 30 l z CRS i CBS. Miło was poznać!', 50,
    [['claire_crevettes', 'Bienvenue Kasia ! Superbe bac.', 2], ['sanne_nano', 'Welkom! Mooie garnalen.', 1]], -1],
  ['quedadas', 'dani_plantados', null, 'Quedada de aquascaping en Madrid (sábado)', 'Organizo un taller gratuito: montaje de un layout de 60 l en directo y preguntas sobre CO₂.', 9,
    [['marta_empieza', '¡Allí estaré!', 1], ['javi_discos', 'Si me pilla en Madrid, me paso.', 0]], -1],
  ['nano-marino', 'tomas_nano', 'Nano reef Palermo', '¿Skimmer en un nano de 60 l?', '¿Merece la pena un skimmer en un all-in-one de 60 l o con cambios semanales basta?', 6,
    [['laura_reef', 'Con cambios semanales del 10 % y poca carga, no es imprescindible. Si añades peces, sí.', 4]], -1],
  ['comunidad', 'sofia_acuarios', 'Comunitario Guadalajara', '¿Cuántos neones mínimo?', 'Tengo cuatro neones y se esconden mucho. ¿Debería tener más?', 3,
    [['dani_plantados', 'Mínimo 6, idealmente 10 o más. Se sienten seguros en grupo y verás mucho mejor color.', 3]], -1],
  // Más hilos en las categorías con más movimiento (así se ven los "hilos relacionados")
  ['reef', 'laura_reef', 'Arrecife del salón', 'Dosificación de balling: ¿manual o con bomba dosificadora?', 'Llevo dos años dosificando a mano calcio, KH y magnesio. ¿Merece la pena una dosificadora de 3 canales o es un capricho?', 14,
    [['jake_reefs', 'Worth every cent. Stability is what SPS love, and a doser gives you that even on holidays.', 6], ['lumen_reef', 'Para un 300 l con SPS, sí. Empieza con dosis pequeñas repartidas en 24 tomas y ajusta midiendo KH cada dos días.', 5], ['tomas_nano', 'En mi nano lo hago a mano, pero con 60 l es fácil. Con 300 l no me lo plantearía.', 1]], 1],
  ['reef', 'tomas_nano', 'Nano reef Palermo', '¿Qué corales para empezar en un nano?', 'Quiero añadir mis primeros corales al nano de 60 l. ¿Blandos, LPS…? Busco algo que perdone errores.', 45,
    [['laura_reef', 'Zoanthus, Discosoma y Euphyllia. Aguantan bien pequeñas oscilaciones y crecen rápido.', 7], ['lumen_reef', 'Coincido. Evita los SPS hasta que el tanque tenga al menos 6 meses estables.', 4]], 0],
  ['plantado', 'marta_empieza', 'Mi primer acuario', 'Plantas fáciles sin CO₂ para un comunitario', '¿Qué plantas me recomendáis que no necesiten CO₂ ni luz fuerte? Tengo 60 l con luz del kit.', 20,
    [['dani_plantados', 'Anubias, microsorum, criptocorynes y musgo de Java. Atadas a roca o madera, casi indestructibles.', 8], ['raiz_roca', 'Y si quieres algo de crecimiento rápido para quitar nitratos, Hygrophila polysperma.', 3]], 0],
  ['plantado', 'lukas_scapes', 'Iwagumi 60P', 'Glossostigma se despega del sustrato', 'Mein Glossostigma-Teppich löst sich an einigen Stellen vom Boden. CO₂ ist stabil bei 30 mg/l.', 8,
    [['dani_plantados', 'Suele pasar al podar demasiado bajo. Replanta en mechones pequeños con pinzas y no podes hasta que enraíce.', 4]], 0],
  ['principiantes', 'sanne_nano', 'Mijn eerste nano', '¿Cuánto tiempo hay que ciclar antes de meter gambas?', 'Mi acuario de 25 l lleva tres semanas. ¿Ya puedo meter más gambas?', 16,
    [['claire_crevettes', 'Attends que l’ammoniaque et les nitrites soient à zéro pendant une semaine complète.', 5], ['kasia_krewetki', 'Dokładnie. Z krewetkami lepiej poczekać 5–6 tygodni.', 2]], 0],
  ['gambas', 'kasia_krewetki', 'Krewetkarium 30 l', 'Gambas CRS pierden color', 'Moje CRS bledną od tygodnia. TDS 240, GH 5, temperatura 22 °C.', 5,
    [['claire_crevettes', 'Souvent c’est le stress après un changement d’eau trop important. Fais des changements plus petits et plus réguliers.', 3], ['dani_plantados', 'Revisa también la temperatura: por encima de 24 °C las Caridina sufren. A 22 °C vas bien.', 2]], 0],
];
let idResp = ID0 + 1000 * 3;
hilos.forEach(([cat, autor, tanque, titulo, contenido, dias, respuestas, solucion], i) => {
  const id = ID0 + 700 + i;
  out(`insert into public.foro_hilos (id, categoria, usuario_id, tanque_id, titulo, contenido, fijado, creado_en, ultima_actividad) overriding system value values (${id}, ${q(cat)}, ${q(U[autor])}, ${tanque ? TQ[`${autor}:${tanque}`] : 'null'}, ${q(titulo)}, ${q(contenido)}, ${cat === 'quedadas'}, ${q(hace(dias))}, ${q(hace(dias))});`);
  const ids = [];
  respuestas.forEach(([ra, texto, votos], k) => {
    const rid = idResp++;
    if (SIN_TIENDAS.has(ra)) { ids.push(null); return; }
    ids.push(rid);
    out(`insert into public.foro_respuestas (id, hilo_id, usuario_id, contenido, creado_en) overriding system value values (${rid}, ${id}, ${q(U[ra])}, ${q(texto)}, ${q(hace(dias - 0.3 - k * 0.4))});`);
    for (let v = 0; v < votos; v++) {
      const votante = aficionados[(i + v * 4 + k) % aficionados.length];
      if (votante !== ra) out(`insert into public.foro_votos (usuario_id, respuesta_id) values (${q(U[votante])}, ${rid}) on conflict do nothing;`);
    }
  });
  out(`update public.foro_hilos set ultima_actividad = ${q(hace(dias - 0.3 - (respuestas.length - 1) * 0.4))} where id = ${id};`);
  if (solucion >= 0 && ids[solucion]) out(`update public.foro_hilos set solucion_id = ${ids[solucion]} where id = ${id};`);
});

// --- Mensajes -------------------------------------------------------------------------------
const mensajes = [
  ['pablo_goldfish', 'marta_empieza', 3, 'Hola Marta, he visto tu publicación del oranda. Tengo un acuario de agua fría de 240 l y estaría encantado de adoptarlo.', true, 0.9],
  ['marta_empieza', 'pablo_goldfish', 3, '¡Qué bien! ¿Te viene bien recogerlo el sábado en Sevilla? Si no, buscamos otra forma.', true, 0.8],
  ['pablo_goldfish', 'marta_empieza', 3, 'Estoy en Zaragoza, pero mi hermano vive en Sevilla y puede pasar a por él. Te escribo el viernes.', false, 0.6],
  ['tomas_nano', 'lumen_reef', null, 'Hola, ¿hacéis análisis ICP con envío desde Argentina?', true, 12],
  ['lumen_reef', 'tomas_nano', null, 'Hola Tomás, sí: te mandamos el kit y nos devuelves la muestra. Te paso el procedimiento por aquí.', true, 11.8],
  ['marta_empieza', 'dani_plantados', 2, 'Hola Dani, ¿las cherry siguen disponibles? Me gustaría para mi acuario.', true, 4],
  ['dani_plantados', 'marta_empieza', 2, 'Están reservadas, pero en dos semanas tendré otra tanda. Ojo: con el oranda se las comería 😅', false, 3.9],
];
mensajes.forEach(([de, para, , texto, leido, dias], i) => {
  if (SIN_TIENDAS.has(de) || SIN_TIENDAS.has(para)) return;
  out(`insert into public.mensajes (id, emisor_id, receptor_id, contenido, leido, creado_en) overriding system value values (${ID0 + 900 + i}, ${q(U[de])}, ${q(U[para])}, ${q(texto)}, ${leido}, ${q(hace(dias))});`);
});

// Idioma de cada texto (detectado con el detector de idioma de Chrome): todo en español salvo estas excepciones
const IDIOMAS_DEMO = 'publ900410pt publ900412it publ900414pl publ900408en publ900409de publ900411fr publ900413nl publ900421en publ900425de come900602en come900603de come900610it come900614fr come900618en come900620pl come900621nl come900622fr come900623pl foro900705en foro900706it foro900707de foro900708pt foro900709pl foro903004en foro903007de foro903008fr foro903009pl foro903017it foro903021en foro903022nl foro900716de foro900718pl foro903027en foro903035fr foro903036pl foro903037fr';
for (const t of ['publicaciones', 'comentarios', 'foro_hilos', 'foro_respuestas']) out(`update public.${t} set idioma = 'es' where id >= ${ID0} and idioma is null;`);
for (const x of IDIOMAS_DEMO.split(' ')) {
  const p = x.slice(0, 4); const id = Number(x.slice(4, 10)); const l = x.slice(10);
  const tabla = p === 'publ' ? 'publicaciones' : p === 'come' ? 'comentarios' : id < ID0 + 1000 ? 'foro_hilos' : 'foro_respuestas';
  out(`update public.${tabla} set idioma = '${l}' where id = ${id};`);
}

// Las notificaciones creadas por los disparadores en el pasado lejano se marcan como leídas
out(`update public.notificaciones set leida = true where creado_en < now() - interval '3 days' and usuario_id in (select id from auth.users where email like '%@${DOMINIO}');`);
out('commit;');

fs.writeFileSync(new URL('./datos_demo.sql', import.meta.url), sql.join('\n') + '\n');
fs.writeFileSync(new URL('./limpiar_demo.sql', import.meta.url), `-- Borra la comunidad de demostración. Al eliminar los usuarios de demo se borran en cascada\n-- sus perfiles, tanques, publicaciones, tiendas, anuncios, mensajes, campañas y demás.\ndelete from auth.users where email like '%@${DOMINIO}';\n`);
console.log(`${usuarios.length - SIN_TIENDAS.size} usuarios, ${tanques.length} tanques, ${posts.filter((x) => !SIN_TIENDAS.has(x[0])).length + 1} publicaciones, ~${likes} me gusta, ${hilos.length} hilos`);
console.log(`${sql.length} sentencias → supabase/demo/datos_demo.sql`);
