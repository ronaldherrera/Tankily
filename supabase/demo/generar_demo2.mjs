// Segundo lote de la comunidad de demostración (23/10/2026): 24 cuentas más de 12 países, con tanques, mediciones,
// publicaciones recientes, comentarios, me gusta, seguimientos y debates del foro (sin mercado ni tiendas) que se cruzan con las cuentas del
// primer lote (generar_demo.mjs). Todas son cuentas de muestra: correo @demo.tankily.invalid, sin contraseña
// (no se puede entrar con ellas) y perfiles.muestra = true, que el perfil enseña como "muestra ⓘ".
// Nunca interactúan con usuarios reales. limpiar_demo.sql las borra con todo su contenido, igual que el primer lote.
//
// Las fechas son relativas al momento de generar el SQL: lo más reciente queda de hace unas horas.
// Uso:  node supabase/demo/generar_demo2.mjs
//       npx supabase db query --linked -f supabase/demo/datos_demo2.sql
import fs from 'fs';
import { especiesWiki } from '../../src/lib/especiesWiki.js';
import { CUENTAS_IDIOMAS, HILOS_IDIOMAS } from './demo_idiomas.mjs';
import { actividadExtra, publicacionesExtra } from './demo_extra.mjs';

const DOMINIO = 'demo.tankily.invalid';
const B = 940000; // ids del segundo lote: por encima de todos los del primero (900000–931000)
const ahora = Date.now();
const DIA = 86400000;
const hace = (dias, horas = 0) => new Date(ahora - dias * DIA - horas * 3600000).toISOString();
const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `array[${a.map(q).join(',')}]::text[]` : `'{}'::text[]`);
const especie = (nombre) => {
  const e = especiesWiki.find((x) => x.nombre === nombre);
  if (!e) throw new Error('No está en WikiTank: ' + nombre);
  return e;
};
const img = (nombre) => encodeURI(especie(nombre).imagen);
const foto = (ruta) => encodeURI('/wiki-media/' + ruta);
const FOTOS = {
  reef: foto('Acuarios/Acuario marino — arrecife de coral (reef)/Acuario_marino_reef.webp'),
  fowlr: foto('Acuarios/Acuario marino — fowlr/Acuario_marino_fowlr.webp'),
  nano: foto('Acuarios/Nano acuario/Nano_acuario.webp'),
  comunidad: foto('Acuarios/Acuario dulce tropical de comunidad/Acuario_tropical_comunidad.webp'),
  plantado: foto('Acuarios/Acuario plantado/Acuario_plantado.webp'),
  gambas: foto('Acuarios/Acuario de gambas/Acuario_gambas.webp'),
  goldfish: foto('Acuarios/Acuario de agua fría  goldfish/Acuario_agua_fria_goldfish.webp'),
  aquascape: foto('Aquascaping/Principios/Principios.webp'),
  tecnicas: foto('Aquascaping/Tecnicas/Tecnicas.webp'),
  corales: foto('Biologia/Corales/Biologia_corales.webp'),
  co2: foto('Equipamiento/CO2/CO2.webp'),
  filtros: foto('Equipamiento/Filtros/Filtros.webp'),
  luz: foto('Equipamiento/Iluminacion/Iluminacion.webp'),
  tests: foto('Equipamiento/Tests/Tests.webp'),
  cuarentena: foto('Enfermedades/Cuarentena/Cuarentena.webp'),
};

// Cuentas del primer lote, en su orden (mismo cálculo de uuid que generar_demo.mjs)
const PRIMER_LOTE = ['laura_reef', 'dani_plantados', 'marta_empieza', 'javi_discos', 'carmen_koi', 'pablo_goldfish', 'sofia_acuarios', 'tomas_nano', 'jake_reefs', 'lukas_scapes', 'ana_paludario', 'claire_crevettes', 'marco_discus', 'sanne_nano', 'kasia_krewetki', 'lumen_reef', 'raiz_roca', 'cantabrico_azul', 'pecera_viva'];
const U = {};
PRIMER_LOTE.forEach((u, i) => { U[u] = `de300000-0000-4000-a000-${String(i + 1).padStart(12, '0')}`; });

// --- Usuarios -------------------------------------------------------------------------------
// [usuario, nombre, país, provincia, nivel, bio, avatar (especie), portada, idioma, días desde el alta]
const usuarios = [
  ['nacho_malawi', 'Nacho Prieto', 'ES', 'Málaga', 'intermedio', 'Cíclidos del lago Malawi en 240 l. Mucha roca, mucho color y alguna que otra pelea 🐟', 'Labidochromis caeruleus', 'comunidad', 'es', 44],
  ['elena_betta', 'Elena Castro', 'ES', 'Bizkaia', 'principiante', 'Mi betta se llama Pimiento y manda más que yo. Aprendiendo a plantar.', 'Betta splendens', 'plantado', 'es', 9],
  ['raul_fowlr', 'Raúl Iglesias', 'ES', 'Alicante', 'intermedio', 'FOWLR de 400 l con cirujanos. Del agua dulce al marino hace dos años y no vuelvo.', 'Zebrasoma flavescens', 'fowlr', 'es', 38],
  ['lucia_cherrys', 'Lucía Navarro', 'ES', 'Granada', 'intermedio', 'Neocaridinas de colores en 40 l. Selecciono rojas, amarillas y alguna azul rebelde.', 'Neocaridina davidi', 'gambas', 'es', 27],
  ['alberto_30anos', 'Alberto Sanz', 'ES', 'Valladolid', 'avanzado', 'Treinta años con acuarios. Sudamericanos, agua blanda y cero prisas. Pregúntame lo que quieras.', 'Mikrogeophagus ramirezi', 'comunidad', 'es', 60],
  ['irene_nano20', 'Irene Gil', 'ES', 'Murcia', 'principiante', 'Nano de 20 l en el escritorio del trabajo. Sí, me miran raro.', 'Boraras maculatus', 'nano', 'es', 6],
  ['sergio_lowtech', 'Sergio Vidal', 'ES', 'Girona', 'intermedio', 'Plantado low-tech: sin CO₂, poca luz y plantas que crecen despacio pero seguro.', 'Microsorum pteropus', 'plantado', 'es', 33],
  ['hector_killis', 'Héctor Lozano', 'ES', 'A Coruña', 'avanzado', 'Killis y biotopos. Crío Aphyosemion y Nothobranchius. Intercambio huevos con quien quiera.', 'Aphyosemion australe', 'plantado', 'es', 52],
  ['diego_cdmx', 'Diego Ramírez', 'MX', 'Ciudad de México', 'principiante', 'Primer acuario de 75 l. Guppys, plantas y muchas dudas. CDMX 🇲🇽', 'Poecilia reticulata', 'comunidad', 'es', 5],
  ['valeria_mty', 'Valeria Treviño', 'MX', 'Nuevo León', 'intermedio', 'Escalares en un plantado de 200 l en Monterrey. El calor del verano es mi enemigo.', 'Pterophyllum scalare', 'plantado', 'es', 30],
  ['martin_cba', 'Martín Paz', 'AR', 'Córdoba', 'intermedio', 'Cíclidos sudamericanos y un óscar que se cree perro. Córdoba, Argentina.', 'Astronotus ocellatus', 'comunidad', 'es', 41],
  ['camila_bogota', 'Camila Rojas', 'CO', 'Cundinamarca', 'intermedio', 'Biotopo amazónico con cardenales: hojas secas, agua tinta y mucha paz. Bogotá.', 'Paracheirodon axelrodi', 'plantado', 'es', 25],
  ['felipe_reefcl', 'Felipe Muñoz', 'CL', 'Región Metropolitana', 'avanzado', 'Reef de 200 l en Santiago. LPS, zoas y una gamba limpiadora que me cobra por servicio.', 'Euphyllia ancora', 'reef', 'es', 47],
  ['rosa_lima', 'Rosa Quispe', 'PE', 'Lima', 'principiante', 'Platys y un Ancistrus en 50 l. Empecé por mi hija y ahora la que está enganchada soy yo.', 'Xiphophorus maculatus', 'comunidad', 'es', 12],
  ['emily_shrimp', 'Emily Carter', 'US', 'Oregon', 'intermedio', 'Portland, OR. Caridina racks in the garage and too many TDS meters.', 'Caridina cantonensis CRS', 'gambas', 'en', 36],
  ['mike_mbuna', 'Mike Johnson', 'US', 'Texas', 'avanzado', 'Austin, TX. 125 gal mbuna tank, overfiltered and overstocked on purpose.', 'Pseudotropheus demasoni', 'comunidad', 'en', 55],
  ['olivia_scapes', 'Olivia Brown', 'GB', 'Greater Manchester', 'intermedio', 'Manchester. Nano planted tanks, Bucephalandra hoarder.', 'Bucephalandra sp.', 'aquascape', 'en', 22],
  ['jonas_meerwasser', 'Jonas Fischer', 'DE', 'Hamburg', 'intermedio', 'Meerwasser-Nano in Hamburg. Weichkorallen, Grundeln und viel Geduld.', 'Gobiodon citrinus', 'nano', 'de', 29],
  ['hugo_recifal', 'Hugo Lefèvre', 'FR', 'Occitanie', 'avanzado', 'Bac récifal de 350 l à Toulouse. SPS, ICP et café le matin devant le bac.', 'Acropora millepora', 'reef', 'fr', 50],
  ['giulia_betta', 'Giulia Romano', 'IT', 'Lazio', 'principiante', 'Il mio primo acquario: un betta e tante piante. Roma.', 'Betta splendens', 'plantado', 'it', 8],
  ['rafael_acaras', 'Rafael Lima', 'BR', 'Minas Gerais', 'intermedio', 'Acarás-bandeira e plantado em Belo Horizonte. Aquarismo é terapia.', 'Pterophyllum scalare', 'plantado', 'pt', 34],
  ['piotr_akwa', 'Piotr Kowalski', 'PL', 'Mazowieckie', 'intermedio', 'Akwarium roślinne 112 l w Warszawie. Rotala, CO₂ i dużo przycinania.', 'Rotala indica', 'aquascape', 'pl', 31],
  ['daan_hollands', 'Daan Bakker', 'NL', 'Noord-Holland', 'avanzado', 'Hollands aquarium: straten van stengelplanten, geen stenen. Haarlem.', 'Hydrocotyle leucocephala', 'plantado', 'nl', 58],
  ['ines_axolotes', 'Inés Romero', 'ES', 'Santa Cruz de Tenerife', 'intermedio', 'Agua fría en Canarias: goldfish ryukin y un estanque pequeño. Sí, aquí también se puede.', 'Goldfish ryukin', 'goldfish', 'es', 19],
];
// Más cuentas por idioma (demo_idiomas.mjs): cada idioma de la web queda con al menos 10
usuarios.push(...CUENTAS_IDIOMAS.map((c) => [c.u, c.nombre, c.pais, c.prov, c.nivel, c.bio, c.avatar, c.portada, c.lang, c.dias]));
usuarios.forEach(([usuario], i) => { U[usuario] = `de300000-0000-4000-a000-${String(101 + i).padStart(12, '0')}`; });
const NUEVOS = usuarios.map(([u]) => u);
const IDIOMA = Object.fromEntries(usuarios.map((x) => [x[0], x[8]]));
for (const u of PRIMER_LOTE) IDIOMA[u] = { jake_reefs: 'en', lukas_scapes: 'de', ana_paludario: 'pt', claire_crevettes: 'fr', marco_discus: 'it', sanne_nano: 'nl', kasia_krewetki: 'pl' }[u] || 'es';

const sql = [];
const out = (s) => sql.push(s);
out('-- Generado por supabase/demo/generar_demo2.mjs. Cuentas de MUESTRA (segundo lote): se borran con limpiar_demo.sql.');
out('begin;');

usuarios.forEach(([usuario, nombre, pais, provincia, nivel, bio, avatar, portada, , dias]) => {
  const id = U[usuario];
  const alta = hace(dias, 5);
  out(`insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', ${q(id)}, 'authenticated', 'authenticated', ${q(`${usuario}@${DOMINIO}`)}, '', ${q(alta)}, '{"provider":"email","providers":["email"],"demo":true}', ${q(JSON.stringify({ usuario, nombre }))}, ${q(alta)}, ${q(alta)}, '', '', '', '');`);
  out(`update public.perfiles set nombre = ${q(nombre)}, bio = ${q(bio)}, pais = ${q(pais)}, provincia = ${q(provincia)}, nivel = ${q(nivel)}, avatar_url = ${q(img(avatar))}, portada_url = ${q(FOTOS[portada])}, creado_en = ${q(alta)}, muestra = true where id = ${q(id)};`);
});
// El primer lote también es de muestra (por si la migración se aplicó antes de crearlo)
out(`update public.perfiles set muestra = true where id in (select id from auth.users where email like '%@${DOMINIO}');`);

// --- Tanques ----------------------------------------------------------------------------------
// [dueño, nombre, tipo, litros, [l,a,h], equipo, descripción, días montado, cambio cada, foto, habitantes, perfil de agua]
const TQ = {};
const tanques = [
  ['nacho_malawi', 'Malawi rocoso', 'ciclidos', 240, [120, 40, 50], { filtracion: 'Externo 1500 l/h + esponja', calentador: '200 W' }, 'Mbunas con mucha roca para cortar territorios. Agua dura y cambios del 30 % semanales.', 420, 7, null,
    [['Labidochromis caeruleus', 6, 'pez'], ['Pseudotropheus demasoni', 8, 'pez'], ['Aulonocara baenschi', 3, 'pez']], 'malawi'],
  ['elena_betta', 'El reino de Pimiento', 'plantado', 30, [40, 25, 30], { iluminacion: 'LED del kit', filtracion: 'Esponja con aireador', calentador: '50 W' }, 'Un betta, plantas fáciles y un par de neritinas para el cristal.', 40, 7, img('Betta splendens'),
    [['Betta splendens', 1, 'pez'], ['Neritina natalensis', 2, 'invertebrado'], ['Microsorum pteropus', 2, 'planta'], ['Anubias nana', 1, 'planta']], 'betta'],
  ['raul_fowlr', 'FOWLR 400', 'marino_peces', 400, [150, 55, 55], { filtracion: 'Sump 100 l', skimmer: 'Reef Octopus Classic 150', calentador: '2 × 200 W' }, 'Peces marinos con roca viva. Cirujanos, payasos y una limpiadora.', 700, 14, FOTOS.fowlr,
    [['Zebrasoma flavescens', 1, 'pez'], ['Paracanthurus hepatus', 1, 'pez'], ['Amphiprion ocellaris', 2, 'pez'], ['Lysmata amboinensis', 1, 'invertebrado']], 'marino'],
  ['lucia_cherrys', 'Gambario de colores', 'gambas', 40, [50, 30, 30], { filtracion: 'Esponja doble', iluminacion: 'LED 6500K' }, 'Tres líneas de Neocaridina separadas por temporadas. Musgo, hojas de almendro y paciencia.', 260, 10, FOTOS.gambas,
    [['Neocaridina davidi', 45, 'invertebrado'], ['Neocaridina davidi Blue', 10, 'invertebrado'], ['Bucephalandra sp.', 3, 'planta']], 'gambas'],
  ['alberto_30anos', 'Sudamericano de agua blanda', 'comunidad', 300, [120, 50, 50], { filtracion: 'Dos externos Eheim', calentador: '300 W' }, 'Ramirezis, cardenales y corydoras sobre arena fina. Ósmosis al 70 %.', 1300, 7, null,
    [['Mikrogeophagus ramirezi', 6, 'pez'], ['Paracheirodon axelrodi', 30, 'pez'], ['Corydoras sterbai', 8, 'pez'], ['Echinodorus bleheri', 3, 'planta']], 'blanda'],
  ['irene_nano20', 'Nano de oficina', 'plantado', 20, [30, 25, 28], { iluminacion: 'Clip LED', filtracion: 'Mochila mini' }, 'Rasboras enanas y plantas lentas en el escritorio. Cambio cada sábado al llegar.', 30, 7, FOTOS.nano,
    [['Boraras maculatus', 8, 'pez'], ['Cryptocoryne affinis', 3, 'planta']], 'comunidad'],
  ['sergio_lowtech', 'Low-tech 90', 'plantado', 90, [80, 35, 35], { iluminacion: 'LED 20 W', sustrato: 'Tierra de jardín capada con grava' }, 'Método Walstad adaptado: sin CO₂, sin abonos y con cambios de agua muy espaciados.', 500, 21, FOTOS.plantado,
    [['Trigonostigma heteromorpha', 12, 'pez'], ['Otocinclus affinis', 4, 'pez'], ['Cryptocoryne affinis', 6, 'planta'], ['Microsorum pteropus', 3, 'planta']], 'comunidad'],
  ['hector_killis', 'Killis de Gabón', 'biotopo', 54, [60, 30, 30], { filtracion: 'Esponja', iluminacion: 'Tenue' }, 'Biotopo de arroyo africano para Aphyosemion: turba, raíces y musgo flotante.', 380, 7, null,
    [['Aphyosemion australe', 6, 'pez'], ['Microsorum pteropus', 2, 'planta']], 'blanda'],
  ['diego_cdmx', 'Mi primer acuario', 'comunidad', 75, [60, 35, 36], { filtracion: 'Filtro de cascada', calentador: '100 W' }, 'Primer acuario. Guppys, un par de platys y plantas que todavía no sé si sobreviven.', 22, 7, null,
    [['Poecilia reticulata', 8, 'pez'], ['Xiphophorus maculatus', 2, 'pez'], ['Anubias barteri', 1, 'planta']], 'principiante'],
  ['valeria_mty', 'Escalares y amazonas', 'plantado', 200, [100, 45, 60], { filtracion: 'Canister 1200 l/h', co2: 'Botella 5 kg', iluminacion: 'Chihiros WRGB' }, 'Plantado alto para escalares con espadas amazónicas. CO₂ y abono semanal.', 400, 7, FOTOS.plantado,
    [['Pterophyllum scalare', 5, 'pez'], ['Hyphessobrycon amandae', 20, 'pez'], ['Echinodorus bleheri', 5, 'planta']], 'plantado'],
  ['martin_cba', 'Óscar y compañía', 'ciclidos', 450, [150, 60, 55], { filtracion: 'Sump 120 l', calentador: '2 × 250 W' }, 'Un óscar, dos Geophagus y un Ancistrus que se esconde todo el día.', 900, 7, img('Astronotus ocellatus'),
    [['Astronotus ocellatus', 1, 'pez'], ['Geophagus brasiliensis', 2, 'pez'], ['Ancistrus cirrhosus', 1, 'pez']], 'comunidad'],
  ['camila_bogota', 'Igarapé de cardenales', 'biotopo', 120, [100, 40, 35], { filtracion: 'Externo', calentador: '150 W' }, 'Biotopo de igarapé: hojas de catappa, raíces y agua tinta. Solo especies del Río Negro.', 330, 7, img('Paracheirodon axelrodi'),
    [['Paracheirodon axelrodi', 25, 'pez'], ['Hemigrammus bleheri', 10, 'pez'], ['Otocinclus affinis', 5, 'pez']], 'blanda'],
  ['felipe_reefcl', 'Reef Santiago', 'reef', 200, [90, 50, 50], { iluminacion: 'AI Hydra 32', filtracion: 'Sump 50 l', skimmer: 'Bubble Magus Curve 5' }, 'LPS y blandos. Martillos, zoas y una pareja de payasos.', 800, 7, FOTOS.reef,
    [['Euphyllia ancora', 3, 'coral'], ['Zoanthus gigantus', 4, 'coral'], ['Discosoma spp', 5, 'coral'], ['Amphiprion ocellaris', 2, 'pez'], ['Lysmata amboinensis', 1, 'invertebrado']], 'reef'],
  ['rosa_lima', 'El acuario de Valentina', 'comunidad', 50, [60, 30, 30], { filtracion: 'Mochila', calentador: '75 W' }, 'El acuario de mi hija (y mío). Platys y un Ancistrus que se come todo el alga.', 75, 7, null,
    [['Xiphophorus maculatus', 5, 'pez'], ['Ancistrus cirrhosus', 1, 'pez']], 'principiante'],
  ['emily_shrimp', 'Caridina rack A', 'gambas', 38, [50, 30, 25], { filtracion: 'Sponge filter', iluminacion: 'Nicrew LED' }, 'Crystal reds on active soil. RO/DI remineralized to TDS 150.', 340, 7, img('Caridina cantonensis CRS'),
    [['Caridina cantonensis CRS', 60, 'invertebrado'], ['Bucephalandra sp.', 4, 'planta']], 'caridina'],
  ['mike_mbuna', 'Mbuna 125', 'ciclidos', 475, [180, 45, 55], { filtracion: '2 × Fluval FX6', calentador: '2 × 300 W' }, 'Overstocked mbuna tank to spread aggression. 50 % water change every week.', 1500, 7, img('Pseudotropheus demasoni'),
    [['Pseudotropheus demasoni', 12, 'pez'], ['Labidochromis caeruleus', 10, 'pez'], ['Cyrtocara moorii', 3, 'pez']], 'malawi'],
  ['olivia_scapes', 'Buce nano', 'plantado', 30, [45, 27, 30], { iluminacion: 'Twinstar 450E', co2: 'Paintball CO₂' }, 'Bucephalandra on lava rock, chili rasboras and a lot of patience.', 190, 7, FOTOS.aquascape,
    [['Boraras brigittae', 12, 'pez'], ['Bucephalandra sp.', 8, 'planta'], ['Microsorum pteropus', 2, 'planta']], 'plantado'],
  ['jonas_meerwasser', 'Nano-Riff 60', 'nano_marino', 60, [45, 45, 30], { iluminacion: 'Kessil A80', filtracion: 'AIO Technik hinten' }, 'Weichkorallen und zwei Zitronengrundeln. Wasserwechsel 10 % jede Woche.', 280, 7, FOTOS.nano,
    [['Gobiodon citrinus', 2, 'pez'], ['Zoanthus gigantus', 3, 'coral'], ['Discosoma spp', 3, 'coral']], 'reef'],
  ['hugo_recifal', 'Récifal 350', 'reef', 350, [130, 55, 50], { iluminacion: 'Radion XR30 + T5', filtracion: 'Décantation 80 l', skimmer: 'Deltec 600i' }, 'Bac SPS dominant, méthode Triton, ICP tous les deux mois.', 1100, 7, FOTOS.corales,
    [['Acropora millepora', 5, 'coral'], ['Acropora spp', 4, 'coral'], ['Zebrasoma flavescens', 1, 'pez'], ['Synchiropus ocellatus', 1, 'pez']], 'reef'],
  ['giulia_betta', 'Il mio primo acquario', 'plantado', 25, [40, 25, 25], { filtracion: 'Filtro a spugna', calentador: '25 W' }, 'Un betta, piante facili e due lumache. Tutto nuovo per me.', 30, 7, null,
    [['Betta splendens', 1, 'pez'], ['Neritina natalensis', 2, 'invertebrado'], ['Anubias nana', 2, 'planta']], 'betta'],
  ['rafael_acaras', 'Plantado dos acarás', 'plantado', 180, [100, 40, 45], { filtracion: 'Canister', co2: 'Cilindro 2 kg', iluminacion: 'LED 60 W' }, 'Acarás-bandeira com tetras e muitas plantas de caule.', 520, 7, img('Pterophyllum scalare'),
    [['Pterophyllum scalare', 4, 'pez'], ['Paracheirodon axelrodi', 18, 'pez'], ['Rotala indica', 10, 'planta']], 'plantado'],
  ['piotr_akwa', 'Roślinne 112', 'plantado', 112, [80, 35, 40], { filtracion: 'Filtr kubełkowy', co2: 'Butla 2 kg', iluminacion: 'Chihiros' }, 'Rotala, hydrocotyle i stado brzanek. Przycinanie co tydzień.', 360, 7, FOTOS.tecnicas,
    [['Pethia conchonius', 8, 'pez'], ['Rotala indica', 12, 'planta'], ['Hydrocotyle leucocephala', 4, 'planta']], 'plantado'],
  ['daan_hollands', 'Hollands 240', 'plantado', 240, [120, 50, 40], { filtracion: 'Externe filter 1500 l/u', co2: 'CO₂ met pH-controller' }, 'Klassiek Hollands aquarium: straten van stengelplanten, geen hardscape.', 1600, 7, FOTOS.plantado,
    [['Hemigrammus bleheri', 20, 'pez'], ['Otocinclus affinis', 6, 'pez'], ['Rotala indica', 20, 'planta'], ['Hydrocotyle leucocephala', 8, 'planta'], ['Pogostemon erectus', 10, 'planta']], 'plantado'],
  ['ines_axolotes', 'Ryukins de Tenerife', 'agua_fria', 200, [100, 40, 50], { filtracion: 'Externo 1200 l/h' }, 'Tres ryukin sin calentador. En verano el ventilador es obligatorio en Canarias.', 340, 7, FOTOS.goldfish,
    [['Goldfish ryukin', 3, 'pez']], 'fria'],
];

tanques.push(...CUENTAS_IDIOMAS.map((c) => [c.u, c.tq[0], c.tq[1], c.tq[2], null, {}, c.tq[3], c.dias + 150, 7, null, c.tq[4], c.tq[5]]));

let semilla = 11;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

// La mitad de las cuentas nuevas (una de cada dos) tiene un segundo tanque y dos publicaciones más (demo_extra.mjs)
const animales = (hab) => hab.filter(([, , cat]) => cat === 'pez' || cat === 'invertebrado').map(([n]) => especie(n).comun || n);
const datosCuenta = (u) => {
  const tq = tanques.find((x) => x[0] === u);
  return { u, lang: IDIOMA[u], alta: usuarios.find((x) => x[0] === u)[9], tanque: tq[1], especies: animales(tq[10]), especieFoto: tq[10][0]?.[0] };
};
const elegidas = NUEVOS.filter((_, i) => i % 2 === 0).map(datosCuenta);
const companero = (lang, u, k) => { const l = NUEVOS.filter((x) => IDIOMA[x] === lang && x !== u); return l[k % l.length]; };
const EXTRA = actividadExtra(elegidas, companero, () => azar());
tanques.push(...EXTRA.tanques);
// La otra mitad (un solo tanque): 3 o 4 publicaciones más sobre ese tanque
const MAS = publicacionesExtra(NUEVOS.filter((_, i) => i % 2 === 1).map(datosCuenta), companero, () => azar());
EXTRA.posts.push(...MAS.posts);
MAS.comentarios.forEach((x) => EXTRA.comentarios.push({ ...x, post: x.post + EXTRA.posts.length - MAS.posts.length }));

const AGUA = {
  reef: [['temperatura', 25.4, 0.4], ['salinidad', 35, 0.5], ['kh', 8.1, 0.4], ['calcio', 425, 15], ['magnesio', 1320, 30], ['nitrato', 5, 3], ['fosfato', 0.05, 0.03], ['ph', 8.2, 0.08]],
  marino: [['temperatura', 25.5, 0.4], ['salinidad', 33.5, 0.5], ['nitrato', 18, 6], ['ph', 8.1, 0.1]],
  plantado: [['temperatura', 25, 0.5], ['ph', 6.6, 0.15], ['kh', 4, 0.5], ['gh', 7, 1], ['nitrato', 12, 4], ['co2', 26, 4]],
  gambas: [['temperatura', 22.5, 0.6], ['ph', 7.2, 0.2], ['gh', 8, 0.8], ['kh', 4, 0.5], ['tds', 260, 15], ['nitrato', 8, 3]],
  caridina: [['temperatura', 22, 0.5], ['ph', 6.2, 0.15], ['gh', 5, 0.5], ['kh', 0.5, 0.3], ['tds', 150, 10]],
  principiante: [['temperatura', 26, 0.8], ['ph', 7.6, 0.2], ['amonio', 0.1, 0.1], ['nitrito', 0.1, 0.1], ['nitrato', 25, 10]],
  betta: [['temperatura', 26.5, 0.5], ['ph', 7, 0.2], ['nitrato', 15, 5]],
  blanda: [['temperatura', 26.5, 0.5], ['ph', 6.2, 0.2], ['gh', 3, 0.6], ['kh', 1.5, 0.5], ['tds', 80, 15], ['nitrato', 6, 2]],
  malawi: [['temperatura', 26, 0.5], ['ph', 8, 0.15], ['gh', 14, 1.5], ['kh', 11, 1], ['nitrato', 25, 8]],
  fria: [['temperatura', 21, 1.2], ['ph', 7.5, 0.15], ['gh', 12, 1], ['nitrato', 22, 8]],
  comunidad: [['temperatura', 25.5, 0.5], ['ph', 7, 0.2], ['gh', 8, 1], ['kh', 5, 0.7], ['nitrato', 15, 5]],
};
const redondear = (v, p) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10 ** p) / 10 ** p);

let idHab = B + 1000;
let idMed = B + 3000;
let idEv = B + 9000;
let idTarea = B + 12000;
tanques.forEach(([dueno, nombre, tipo, litros, dim, equipo, desc, dias, cambio, fotoUrl, habitantes, agua], i) => {
  const id = B + i;
  TQ[`${dueno}:${nombre}`] = id;
  const alta = usuarios.find((x) => x[0] === dueno)[9];
  const creado = hace(alta - 0.5);
  const semanas = Math.min(8, Math.floor(alta / 7));
  out(`insert into public.tanques (id, usuario_id, nombre, tipo, litros, largo_cm, ancho_cm, alto_cm, descripcion, equipo, foto_url, montado_en, cambio_agua_cada_dias, visibilidad, creado_en)
overriding system value values (${id}, ${q(U[dueno])}, ${q(nombre)}, ${q(tipo)}, ${litros}, ${dim ? dim.join(', ') : 'null, null, null'}, ${q(desc)}, ${q(JSON.stringify(equipo))}::jsonb, ${q(fotoUrl)}, ${q(hace(dias).slice(0, 10))}, ${cambio}, 'publico', ${q(creado)});`);
  for (const [nombreEsp, cantidad, categoria] of habitantes) {
    const e = especie(nombreEsp);
    out(`insert into public.habitantes (id, tanque_id, categoria, nombre, nombre_cientifico, cantidad, wiki_ruta, anadido_en, creado_en) overriding system value values (${idHab++}, ${id}, ${q(categoria)}, ${q(e.comun && e.comun !== nombreEsp ? e.comun : nombreEsp)}, ${q(nombreEsp)}, ${cantidad}, ${q(e.ruta || null)}, ${q(creado.slice(0, 10))}, ${q(creado)});`);
  }
  for (let s = semanas; s >= 0; s--) {
    for (const [param, base, vari] of AGUA[agua]) {
      if (azar() < 0.3 && s > 0) continue;
      const valor = redondear(base + (azar() * 2 - 1) * vari, param === 'fosfato' ? 3 : 2);
      const cuando = hace(s * 7 + azar() * 2, 2 + Math.floor(azar() * 8));
      out(`insert into public.mediciones (id, tanque_id, parametro, valor, medido_en, creado_en) overriding system value values (${idMed++}, ${id}, ${q(param)}, ${Math.max(valor, 0)}, ${q(cuando)}, ${q(cuando)});`);
    }
  }
  for (let d = 1 + Math.floor(azar() * cambio); d < Math.min(alta, 60); d += cambio) {
    out(`insert into public.tanque_eventos (id, tanque_id, tipo, nota, fecha, creado_en) overriding system value values (${idEv++}, ${id}, 'cambio_agua', ${q(azar() < 0.4 ? `${Math.round(litros * 0.25)} l` : null)}, ${q(hace(d, 3))}, ${q(hace(d, 3))});`);
  }
  for (const [tt, cada, hechaHace] of [['test', 7, 3], ['filtro', 30, 12], ['limpieza', 14, 5]]) {
    out(`insert into public.tareas (id, tanque_id, tipo, cada_dias, ultima_vez, creado_en) overriding system value values (${idTarea++}, ${id}, ${q(tt)}, ${cada}, ${q(hace(Math.min(hechaHace, alta - 1)))}, ${q(creado)});`);
  }
});

// --- Seguidores ---------------------------------------------------------------------------------
const seguir = new Set();
const sigue = (a, b) => { if (a !== b) seguir.add(`${a}>${b}`); };
const aficionados1 = PRIMER_LOTE.slice(0, 15);
NUEVOS.forEach((a, i) => {
  ['laura_reef', 'dani_plantados', 'alberto_30anos'].forEach((b) => sigue(a, b));
  for (let k = 1; k <= 3; k++) sigue(a, NUEVOS[(i + k * 5) % NUEVOS.length]);
  for (let k = 0; k < 3; k++) sigue(a, aficionados1[(i * 2 + k * 4) % aficionados1.length]);
});
aficionados1.forEach((a, i) => { for (let k = 0; k < 3; k++) sigue(a, NUEVOS[(i * 3 + k * 7) % NUEVOS.length]); });
// Afinidades: misma afición
[['nacho_malawi', 'mike_mbuna'], ['mike_mbuna', 'nacho_malawi'], ['elena_betta', 'giulia_betta'], ['giulia_betta', 'elena_betta'], ['felipe_reefcl', 'hugo_recifal'], ['hugo_recifal', 'laura_reef'], ['lucia_cherrys', 'emily_shrimp'], ['emily_shrimp', 'claire_crevettes'], ['camila_bogota', 'alberto_30anos'], ['hector_killis', 'camila_bogota'], ['valeria_mty', 'rafael_acaras'], ['rafael_acaras', 'valeria_mty'], ['diego_cdmx', 'sofia_acuarios'], ['rosa_lima', 'diego_cdmx'], ['jonas_meerwasser', 'tomas_nano'], ['daan_hollands', 'lukas_scapes'], ['piotr_akwa', 'kasia_krewetki'], ['ines_axolotes', 'pablo_goldfish'], ['irene_nano20', 'olivia_scapes'], ['sergio_lowtech', 'dani_plantados']]
  .forEach(([a, b]) => sigue(a, b));
let n = 0;
for (const par of seguir) {
  const [a, b] = par.split('>');
  out(`insert into public.seguidores (seguidor_id, seguido_id, creado_en) values (${q(U[a])}, ${q(U[b])}, ${q(hace(1 + (n++ % 20), n % 12))}) on conflict do nothing;`);
}

// --- Publicaciones (últimas dos semanas, más densas en los últimos días) -----------------------------
// [autor, tanque o null, contenido, imágenes, días atrás (decimales = horas)]
const posts = [
  ['elena_betta', 'El reino de Pimiento', 'Pimiento ha hecho su primer nido de burbujas 🫧 Leí que es señal de que está a gusto. ¿Es así o me estoy haciendo ilusiones? #betta', [img('Betta splendens')], 0.12],
  ['nacho_malawi', 'Malawi rocoso', 'Cambio del 30 % hecho y los demasoni ya están otra vez peleando por la misma piedra de siempre. Tienen 40 piedras, pero quieren ESA 😂 #malawi #ciclidos', [img('Pseudotropheus demasoni')], 0.2],
  ['felipe_reefcl', 'Reef Santiago', 'El martillo se abrió como nunca después de bajar el flujo de la bomba. A veces menos es más. #reef #lps', [img('Euphyllia ancora')], 0.35],
  ['diego_cdmx', 'Mi primer acuario', 'Día 22 con mi primer acuario. Ya nacieron guppys 😱 Nadie me avisó de que pasaba tan rápido. ¿Los separo? #principiantes #guppy', [img('Poecilia reticulata')], 0.5],
  ['hugo_recifal', 'Récifal 350', 'ICP reçu : tout est dans les clous sauf l’iode, un peu bas. On corrige doucement. #recifal #sps', [FOTOS.tests], 0.7],
  ['camila_bogota', 'Igarapé de cardenales', 'Hojas de catappa nuevas y el agua otra vez color té. Los cardenales salen mucho más cuando el agua está tinta 🍂 #biotopo', [img('Paracheirodon axelrodi')], 0.9],
  ['mike_mbuna', 'Mbuna 125', 'Weekly 50 % change done. Nitrates from 40 down to 20. Two FX6s are noisy but worth it. #mbuna #cichlids', [img('Pseudotropheus demasoni')], 1.1],
  ['lucia_cherrys', 'Gambario de colores', 'Selección de este mes: me quedo solo con las rojas más intensas para la próxima generación. Las demás van a otro tanque, nadie se queda sin casa 🦐 #gambas #neocaridina', [img('Neocaridina davidi')], 1.3],
  ['alberto_30anos', null, 'Consejo de alguien que lleva 30 años en esto: la mayoría de los problemas no se arreglan con productos, se arreglan con paciencia y cambios de agua. Lo demás es marketing. #consejos', [], 1.5],
  ['jonas_meerwasser', 'Nano-Riff 60', 'Die Zitronengrundeln haben sich endlich zwischen den Zoanthus eingelebt. Kleines Becken, große Freude. #nanoriff', [img('Gobiodon citrinus')], 1.7],
  ['valeria_mty', 'Escalares y amazonas', 'Con estos 38 °C afuera, el ventilador sobre el acuario es lo único que mantiene los 27 °C. ¿Qué usan ustedes en verano? #monterrey #plantado', [img('Pterophyllum scalare')], 1.9],
  ['irene_nano20', 'Nano de oficina', 'Mis compañeros ya vienen a ver a las rasboras a la hora del café. El nano de oficina es lo mejor que he hecho este año 😄 #nano', [img('Boraras maculatus')], 2.1],
  ['giulia_betta', 'Il mio primo acquario', 'Primo cambio d’acqua fatto da sola! Il betta mi ha guardato tutto il tempo come per controllarmi 😅 #betta', [img('Betta splendens')], 2.3],
  ['rafael_acaras', 'Plantado dos acarás', 'Poda da rotala feita. Agora os acarás têm espaço pra nadar de novo. #plantado #acarabandeira', [img('Rotala indica')], 2.6],
  ['sergio_lowtech', 'Low-tech 90', 'Un año sin CO₂ ni abonos y el low-tech sigue creciendo solo. Las criptos han cubierto todo el fondo. Menos esfuerzo, más mirar 🌿 #lowtech #walstad', [FOTOS.plantado], 2.9],
  ['martin_cba', 'Óscar y compañía', 'El óscar ya reconoce mi cara: cuando entro a la sala se pone a "bailar" contra el vidrio. No me digan que no tienen personalidad. #oscar #ciclidos', [img('Astronotus ocellatus')], 3.2],
  ['olivia_scapes', 'Buce nano', 'New Bucephalandra leaf! It only took six weeks 🐌 Buce growth is a lesson in patience. #bucephalandra #planted', [img('Bucephalandra sp.')], 3.5],
  ['rosa_lima', 'El acuario de Valentina', 'Mi hija le puso nombre a los cinco platys y yo no distingo ni a dos 😂 El Ancistrus se llama "Aspiradora". #platy', [img('Xiphophorus maculatus')], 3.8],
  ['raul_fowlr', 'FOWLR 400', 'El cirujano azul ya come de la pinza. Tres semanas de cuarentena valieron la pena: ni un punto blanco. #marino #cuarentena', [img('Paracanthurus hepatus')], 4.1],
  ['daan_hollands', 'Hollands 240', 'Wekelijkse snoei klaar. Een Hollands aquarium is tuinieren onder water: elke straat op de juiste hoogte. #hollandsaquarium', [FOTOS.plantado], 4.4],
  ['emily_shrimp', 'Caridina rack A', 'First berried CRS of the season 🎉 TDS steady at 150 for two months. Stability is everything with Caridina. #shrimp #caridina', [img('Caridina cantonensis CRS')], 4.8],
  ['piotr_akwa', 'Roślinne 112', 'Rotala wreszcie czerwienieje na górze. Więcej światła i trochę mniej azotanów zrobiło robotę. #akwarystyka #rotala', [img('Rotala indica')], 5.2],
  ['ines_axolotes', 'Ryukins de Tenerife', 'Para quien diga que en Canarias no se puede tener agua fría: 23 °C en pleno octubre con ventilador y mucha aireación. Los ryukin, felices. #goldfish #aguafria', [img('Goldfish ryukin')], 5.7],
  ['hector_killis', 'Killis de Gabón', 'Huevos de Aphyosemion recogidos de la mopa. Si alguien quiere probar con killis, aviso en el foro cuando eclosionen. #killis', [img('Aphyosemion australe')], 6.1],
  ['nacho_malawi', null, '¿Mbunas o Aulonocaras? Yo los tengo juntos y funciona porque hay mucha roca, pero entiendo a los puristas. ¿Vosotros qué hacéis? #malawi', [img('Aulonocara baenschi')], 6.6],
  ['felipe_reefcl', null, 'Recordatorio: antes de comprar un coral, mira qué luz y qué flujo necesita. El 90 % de los corales que se mueren en un reef nuevo es por ponerlos en el sitio equivocado. #reef', [FOTOS.corales], 7.2],
  ['camila_bogota', null, 'Pregunta para los de biotopo: ¿usan solo hojas de catappa o también de roble? Me dijeron que las de roble también sirven. #biotopo', [], 7.9],
  ['alberto_30anos', 'Sudamericano de agua blanda', 'Pareja de ramirezi limpiando una piedra plana. Si todo va bien, la semana que viene habrá puesta. #ramirezi', [img('Mikrogeophagus ramirezi')], 8.4],
  ['elena_betta', null, '¿Cuántas veces al día dais de comer al betta? Pimiento me mira con cara de hambre todo el rato y no sé si me está manipulando 🙄 #betta', [], 8.8],
  ['hugo_recifal', null, 'Petit rappel : un bac récifal stable vaut mieux qu’un bac parfait. Changer trois paramètres à la fois, c’est ne jamais savoir lequel a marché. #recifal', [], 9.5],
  ['mike_mbuna', null, 'Hot take: overstocking mbuna works only if you overfilter AND do big weekly water changes. Skip either one and it falls apart. #mbuna', [], 10.2],
  ['valeria_mty', null, 'Usé la calculadora de compatibilidad de Tankily antes de meter los tetras ember con los escalares. Me avisó que los escalares adultos pueden comérselos si son muy chicos. Buena alerta 👌 #compatibilidad', [], 11],
  ['diego_cdmx', null, 'Pregunta de novato: ¿el agua del grifo con anticloro sirve para los cambios o tengo que comprar agua especial? #principiantes', [], 12.1],
  ['lucia_cherrys', null, 'Las gambas no necesitan comida todos los días. Yo les doy tres veces por semana y el resto comen biofilm. Menos comida, menos problemas. #gambas', [], 13],
];
const BASE_IDIOMAS = posts.length;
posts.push(...CUENTAS_IDIOMAS.map((c) => [c.u, c.tq[0], c.post[0], [FOTOS[c.post[1]] || img(c.post[1])], c.post[2]]));
const BASE_EXTRA = posts.length;
posts.push(...EXTRA.posts.map((x) => [x.autor, x.tanque, x.texto, x.especie ? [img(x.especie)] : [], x.dias]));
const P = [];
posts.forEach(([autor, tanque, contenido, imagenes, dias], i) => {
  const id = B + 14000 + i;
  P.push({ id, autor, dias });
  out(`insert into public.publicaciones (id, usuario_id, tanque_id, contenido, imagenes, idioma, creado_en) overriding system value values (${id}, ${q(U[autor])}, ${tanque ? TQ[`${autor}:${tanque}`] : 'null'}, ${q(contenido)}, ${arr(imagenes)}, ${q(IDIOMA[autor])}, ${q(hace(dias))});`);
});

// Me gusta: de cuentas de ambos lotes, más en las publicaciones recientes
const todos = [...aficionados1, ...NUEVOS];
let likes = 0;
P.forEach(({ id, autor, dias }, i) => {
  const cuantos = 4 + Math.floor(azar() * (dias < 2 ? 10 : 14));
  for (let k = 0; k < cuantos; k++) {
    const u = todos[(i * 7 + k * 5 + 3) % todos.length];
    if (u === autor) continue;
    out(`insert into public.me_gusta (usuario_id, publicacion_id, creado_en) values (${q(U[u])}, ${id}, ${q(hace(Math.max(dias - 0.02 - k * 0.01, 0.01)))}) on conflict do nothing;`);
    likes++;
  }
});
// Me gusta de las cuentas nuevas en publicaciones del primer lote (ids 900400–900425)
// Sin 900417 ni 900418: eran de las cuentas de tienda, borradas con quitar_mercado_demo.sql
const PUBLICACIONES_LOTE1 = Array.from({ length: 26 }, (_, i) => 900400 + i).filter((id) => id !== 900417 && id !== 900418);
for (let k = 0; k < 60; k++) {
  const u = NUEVOS[k % NUEVOS.length];
  out(`insert into public.me_gusta (usuario_id, publicacion_id, creado_en) values (${q(U[u])}, ${PUBLICACIONES_LOTE1[(k * 7) % PUBLICACIONES_LOTE1.length]}, ${q(hace(1 + (k % 9), k % 10))}) on conflict do nothing;`);
  likes++;
}

// Comentarios: [publicación, autor, texto]
const comentarios = [
  [0, 'giulia_betta', 'Sì! Anche il mio lo fa quando è tranquillo. È un buon segno 😊'],
  [0, 'alberto_30anos', 'Es buena señal, sí. Un betta estresado no se pone a construir. Tienes a Pimiento contento.'],
  [0, 'elena_betta', '@alberto_30anos qué alegría leer esto, ¡gracias!'],
  [1, 'mike_mbuna', 'Classic demasoni. Rearrange the rocks every few months and they reset the territories.'],
  [1, 'nacho_malawi', '@mike_mbuna buena idea, lo probaré en el próximo cambio grande.'],
  [2, 'laura_reef', 'Pasa mucho con las Euphyllia: les gusta el flujo suave e indirecto. ¡Qué bonito!'],
  [2, 'jonas_meerwasser', 'Wunderschön! Weniger Strömung hat bei meinen Weichkorallen auch geholfen.'],
  [3, 'sofia_acuarios', '¡Bienvenido al mundo guppy, Diego! Si quieres que sobrevivan, pon musgo o plantas flotantes para que se escondan.'],
  [3, 'rosa_lima', 'A mí me pasó lo mismo con los platys 😂 Yo puse una paridera unos días.'],
  [3, 'diego_cdmx', 'Gracias a las dos, voy a poner plantas flotantes. Ya veo que va a haber guppys para toda la CDMX 😅'],
  [4, 'felipe_reefcl', 'El yodo bajo es muy común, nos pasa a todos. Bien por corregir despacio.'],
  [4, 'hugo_recifal', '@felipe_reefcl merci ! Toujours doucement en récifal.'],
  [5, 'hector_killis', 'Qué buen biotopo, Camila. Las catappa también ayudan a que los peces estén menos estresados.'],
  [5, 'alberto_30anos', 'Los cardenales en agua tinta son otro pez. Muy bien montado.'],
  [6, 'nacho_malawi', 'Same here, big water changes are the secret with Malawi.'],
  [7, 'emily_shrimp', 'Love seeing selective breeding done right! Culling to another tank is the way.'],
  [7, 'kasia_krewetki', 'Piękne czerwone! Selekcja to podstawa.'],
  [8, 'marta_empieza', 'Me lo apunto en grande. Yo al principio compraba un producto para cada cosa 🙈'],
  [8, 'dani_plantados', 'Cuánta razón. Los cambios de agua arreglan más que cualquier botella.'],
  [8, 'diego_cdmx', 'Justo lo que necesitaba leer esta semana.'],
  [9, 'tomas_nano', 'Qué lindos los gobios limón entre los zoas.'],
  [10, 'martin_cba', 'En Córdoba también sufrimos el verano. Ventilador y bajar la luz un par de horas.'],
  [10, 'rafael_acaras', 'Aqui em BH uso ventoinha também. E tampa aberta à noite.'],
  [11, 'olivia_scapes', 'Office nano club! Mine is on my desk too 😄'],
  [11, 'irene_nano20', '@olivia_scapes ¡somos un club! 😂'],
  [12, 'elena_betta', 'Brava Giulia! Il mio fa lo stesso, controlla tutto 😂'],
  [13, 'valeria_mty', 'Se ve precioso. Yo también tengo que podar la rotala, se me sale del agua.'],
  [14, 'dani_plantados', 'Grande el low-tech. La gente subestima lo bien que funciona con plantas lentas.'],
  [14, 'sergio_lowtech', '@dani_plantados ¡y gasto cero en CO₂!'],
  [15, 'mike_mbuna', 'Oscars are wet pets. Totally agree.'],
  [15, 'alberto_30anos', 'Los óscar son los perros del acuario, sin duda.'],
  [16, 'lukas_scapes', 'Bucephalandra lehrt Geduld. Sehr schön!'],
  [17, 'diego_cdmx', 'Aspiradora es el mejor nombre 😂'],
  [18, 'jake_reefs', 'Quarantine wins again. Great job!'],
  [18, 'laura_reef', 'Así se hace. Cuarentena siempre, aunque cueste.'],
  [19, 'lukas_scapes', 'Ein echtes Hollands Aquarium, toll gepflegt.'],
  [20, 'claire_crevettes', 'Félicitations ! La stabilité, toujours la stabilité.'],
  [20, 'lucia_cherrys', 'Qué maravilla, Emily. Las CRS son mi próximo reto.'],
  [21, 'daan_hollands', 'Mooi rood! Meer licht helpt altijd bij rotala.'],
  [22, 'pablo_goldfish', 'Muy bien, Inés. Lo importante es la oxigenación, más que el número exacto.'],
  [22, 'carmen_koi', 'Me encanta ver agua fría en Canarias 😄'],
  [23, 'camila_bogota', '¡Yo me apunto! Siempre quise probar con killis.'],
  [24, 'mike_mbuna', 'Mixing works if you have enough rock and the right females ratio. Purists will hate us anyway 😂'],
  [24, 'alberto_30anos', 'Si funciona en tu tanque, funciona. Pero vigila la alimentación: los mbunas son herbívoros y los aulonocaras no.'],
  [25, 'raul_fowlr', 'Gran consejo. Yo puse una Euphyllia en pleno chorro de la bomba y casi la pierdo.'],
  [26, 'hector_killis', 'Yo uso catappa y también roble y haya bien secas. Funcionan.'],
  [27, 'hector_killis', 'Que haya suerte con la puesta 🤞'],
  [28, 'alberto_30anos', 'Una vez al día, una cantidad que se coma en un minuto, y un día de ayuno a la semana. Te está manipulando 😂'],
  [28, 'giulia_betta', 'Anche il mio! Sono dei piccoli attori 😂'],
  [28, 'elena_betta', 'Ayuno los domingos entonces. Pimiento no me lo va a perdonar.'],
  [29, 'felipe_reefcl', 'Totalmente cierto. Un parámetro a la vez.'],
  [31, 'rafael_acaras', 'Boa dica! Também vou testar antes de comprar tetras.'],
  [32, 'alberto_30anos', 'El del grifo con anticloro vale perfectamente para guppys. Solo intenta que esté a temperatura parecida.'],
  [32, 'sofia_acuarios', 'Exacto, el del grifo con anticloro. Yo lo hago así desde siempre.'],
  [32, 'diego_cdmx', 'Uff, qué alivio, ¡gracias!'],
  [33, 'emily_shrimp', 'Same here. Overfeeding kills more shrimp than anything else.'],
  // Cuentas nuevas comentando publicaciones del primer lote
  [-400, 'hugo_recifal', 'Superbe millepora ! La couleur sur les pointes, c’est le meilleur signe.'],
  [-402, 'diego_cdmx', '¡Felicidades por los tres meses! Yo voy por el día 22 😅'],
  [-406, 'rosa_lima', 'Yo los dejaría con muchas plantas, a ver si alguno sale.'],
  [-419, 'elena_betta', 'Yo también tenía miedo de tocar el filtro. Gracias por preguntarlo 🙈'],
  [-421, 'raul_fowlr', 'Doy fe. La cuarentena me ha ahorrado más de un disgusto.'],
];
CUENTAS_IDIOMAS.forEach((c, j) => c.coms.forEach(([autor, texto]) => comentarios.push([BASE_IDIOMAS + j, autor, texto])));
EXTRA.comentarios.forEach((x) => comentarios.push([BASE_EXTRA + x.post, x.autor, x.texto]));
comentarios.forEach(([i, autor, texto], k) => {
  const id = B + 15000 + k;
  const pub = i < 0 ? 900000 - i : P[i].id; // negativo: publicación del primer lote (900400–900425)
  const base = i < 0 ? 2 + (k % 6) : P[i].dias;
  out(`insert into public.comentarios (id, publicacion_id, usuario_id, contenido, idioma, creado_en) overriding system value values (${id}, ${pub}, ${q(U[autor])}, ${q(texto)}, ${q(IDIOMA[autor])}, ${q(hace(Math.max(base - 0.03 - (k % 5) * 0.02, 0.01)))});`);
});

// --- Foro ----------------------------------------------------------------------------------------
// [categoría, autor, tanque, título, contenido, días, respuestas [autor, texto, votos], índice de la solución]
const hilos = [
  ['principiantes', 'diego_cdmx', 'Mi primer acuario', 'Nitritos altos a las tres semanas: ¿es normal?', 'Mi acuario de 75 l lleva tres semanas. Ayer medí nitritos en 0,5 y amonio en 0,25. Ya tengo guppys. ¿Hago cambios de agua?', 1.2,
    [['alberto_30anos', 'Sí: estás en mitad del ciclado con peces dentro. Cambios del 25-30 % cada dos días hasta que nitritos y amonio estén a cero, y come poco.', 6], ['sofia_acuarios', 'Y no limpies el filtro estos días, que ahí están las bacterias que te van a sacar de esta.', 4], ['diego_cdmx', 'Hecho el primer cambio. Mañana vuelvo a medir y os cuento.', 0]], 0],
  ['ciclidos', 'nacho_malawi', 'Malawi rocoso', '¿Mezclar mbunas y Aulonocaras? Debate', 'Lo dejo abierto porque cada uno dice una cosa. ¿Habéis tenido mbunas con Aulonocaras sin problemas? ¿Con qué litros?', 3.4,
    [['mike_mbuna', 'I kept them together in 125 gal for years. Works with lots of rock and feeding a spirulina-based food for everyone.', 5], ['alberto_30anos', 'Se puede, pero los Aulonocara sufren con la agresividad de los mbunas. En menos de 300 l yo no lo haría.', 7], ['martin_cba', 'Yo los tuve juntos en 200 l y terminé separándolos. Los Aulonocara no comían tranquilos.', 3]], -1],
  ['reef', 'felipe_reefcl', 'Reef Santiago', 'Zoanthus que no abren tras mover la roca', 'Moví una roca con una colonia de zoas y llevan cuatro días cerrados. Parámetros estables. ¿Les doy tiempo?', 2.2,
    [['laura_reef', 'Dales una semana. Los zoas se cierran con cualquier cambio de luz o flujo. Revisa que no tengan arañas de zoa.', 6], ['jonas_meerwasser', 'Bei mir war es genau so. Nach fünf Tagen waren sie wieder offen.', 2], ['felipe_reefcl', 'Al sexto día abrieron. ¡Gracias!', 0]], 0],
  ['gambas', 'lucia_cherrys', 'Gambario de colores', '¿Se mezclan los colores de Neocaridina si las junto?', 'Tengo rojas y azules en tanques separados. Si las junto, ¿las crías saldrán de color "salvaje"?', 4.5,
    [['emily_shrimp', 'Yes, within a few generations most go back to wild brown. Keep the lines separate if you care about color.', 5], ['claire_crevettes', 'Exactement. Les mélanges donnent des crevettes brunes en deux ou trois générations.', 3], ['dani_plantados', 'Confirmo. Para tenerlas juntas sin que importe el color, vale; para seleccionar, separadas.', 2]], 0],
  ['plantado', 'sergio_lowtech', 'Low-tech 90', 'Low-tech: ¿cada cuánto cambiáis agua?', 'En mi low-tech hago cambios del 20 % cada tres semanas y va bien. ¿Hay quien no haga cambios nunca?', 5.3,
    [['daan_hollands', 'In een low-tech met weinig vissen kan het, maar ik zou toch elke 2-3 weken verversen.', 3], ['dani_plantados', 'Sin cambios nunca, no lo recomiendo: se acumulan sales y la dureza sube. Cada 2-4 semanas está muy bien.', 5]], 1],
  ['comunidad', 'rosa_lima', 'El acuario de Valentina', '¿Cuántos platys caben en 50 litros?', 'Tengo cinco platys y un Ancistrus en 50 l. Mi hija quiere más. ¿Estoy al límite?', 1.8,
    [['sofia_acuarios', 'Con cinco vas bien. Ojo, que los platys se reproducen solos: en dos meses vas a tener el doble 😅', 4], ['alberto_30anos', 'Estás en el límite razonable. Antes que más peces, más plantas.', 3]], 0],
  ['marino-peces', 'raul_fowlr', 'FOWLR 400', 'Cirujano amarillo y cirujano azul juntos en 400 l', 'Los tengo juntos desde hace un mes. Al principio hubo persecuciones, ahora parece que se toleran. ¿Algún consejo?', 6.4,
    [['jake_reefs', 'Add them at the same time if you can. 400 l is OK for those two, but watch for fin damage.', 4], ['hugo_recifal', 'Beaucoup de cachettes et nourriture à plusieurs endroits du bac en même temps.', 3]], -1],
  ['nano-marino', 'jonas_meerwasser', 'Nano-Riff 60', 'Welche Korallen für einen Anfänger-Nano?', 'Ich habe Zoanthus und Discosoma. Was kann als Nächstes kommen, ohne gleich SPS zu wagen?', 7.1,
    [['tomas_nano', 'Euphyllia o Duncan. Perdonan mucho y quedan preciosas en un nano.', 4], ['felipe_reefcl', 'Coincido con Tomás: martillo o torch, con flujo suave.', 2]], 0],
  ['agua-fria', 'ines_axolotes', 'Ryukins de Tenerife', 'Agua fría en clima cálido: ¿cómo lo hacéis?', 'En Tenerife la temperatura del salón no baja de 24 °C en verano. ¿Ventilador, enfriador…? ¿Qué os funciona?', 8.2,
    [['pablo_goldfish', 'Ventilador sobre la superficie y tapa abierta. Bajas 2-3 °C fácil. Y mucha aireación: el agua caliente lleva menos oxígeno.', 5], ['carmen_koi', 'Si te pasas de 27 °C, un enfriador pequeño. Pero con ventilador suele bastar.', 2]], 0],
  ['presentaciones', 'olivia_scapes', 'Buce nano', 'Hello from Manchester!', 'Hi all! I keep a couple of nano planted tanks, mostly Bucephalandra. Happy to be here.', 9.4,
    [['lukas_scapes', 'Willkommen Olivia! Schöne Buce.', 1], ['irene_nano20', '¡Bienvenida! Otra fan de los nanos 😄', 1]], -1],
  ['presentaciones', 'camila_bogota', 'Igarapé de cardenales', 'Hola desde Bogotá 🇨🇴', 'Hola a todos. Tengo un biotopo de igarapé con cardenales. Me encantan los biotopos y las aguas negras.', 11.3,
    [['hector_killis', '¡Bienvenida, Camila! Por fin otra de biotopos.', 1], ['alberto_30anos', 'Bienvenida. Ese tanque de cardenales tiene muy buena pinta.', 1]], -1],
  ['equipamiento', 'valeria_mty', 'Escalares y amazonas', '¿Vale la pena un controlador de pH para el CO₂?', 'Uso CO₂ con electroválvula y temporizador. ¿Merece la pena un controlador de pH o es un lujo?', 9.9,
    [['daan_hollands', 'Met een pH-controller is het veel stabieler. Voor 200 l zou ik het doen.', 3], ['dani_plantados', 'Con temporizador y drop checker bien ajustado vas sobrada. El controlador ayuda, pero no es imprescindible.', 4]], -1],
  ['enfermedades', 'giulia_betta', 'Il mio primo acquario', 'Pinne sfilacciate sul betta', 'Il mio betta ha le pinne un po’ sfilacciate da qualche giorno. Acqua a 26 °C. Cosa può essere?', 0.6,
    [['marco_discus', 'Spesso è la qualità dell’acqua o il betta che si morde le pinne. Fai un cambio e misura i nitrati.', 3], ['elena_betta', 'A Pimiento le pasó y era una planta de plástico con bordes duros. ¿Tienes alguna?', 2]], -1],
  ['quedadas', 'alberto_30anos', null, 'Intercambio de esquejes y peces en Valladolid', 'Propongo una quedada en Valladolid para intercambiar esquejes, gambas y peces criados en casa. ¿Quién se apunta?', 2.7,
    [['marta_empieza', 'Me pilla lejos desde Sevilla, pero ¡qué buena idea!', 0], ['hector_killis', 'Si cuadra, llevo huevos de killi.', 1]], -1],
];
hilos.push(...HILOS_IDIOMAS.map(([cat, autor, titulo, contenido, dias, respuestas, sol]) => [cat, autor, null, titulo, contenido, dias, respuestas, sol]));
let idResp = B + 17000;
hilos.forEach(([cat, autor, tanque, titulo, contenido, dias, respuestas, solucion], i) => {
  const id = B + 16000 + i;
  out(`insert into public.foro_hilos (id, categoria, usuario_id, tanque_id, titulo, contenido, idioma, creado_en, ultima_actividad) overriding system value values (${id}, ${q(cat)}, ${q(U[autor])}, ${tanque ? TQ[`${autor}:${tanque}`] : 'null'}, ${q(titulo)}, ${q(contenido)}, ${q(IDIOMA[autor])}, ${q(hace(dias))}, ${q(hace(dias))});`);
  const ids = [];
  respuestas.forEach(([ra, texto, votos], k) => {
    const rid = idResp++;
    ids.push(rid);
    out(`insert into public.foro_respuestas (id, hilo_id, usuario_id, contenido, idioma, creado_en) overriding system value values (${rid}, ${id}, ${q(U[ra])}, ${q(texto)}, ${q(IDIOMA[ra])}, ${q(hace(Math.max(dias - 0.08 - k * 0.12, 0.01)))});`);
    for (let v = 0; v < votos; v++) {
      const votante = todos[(i * 3 + v * 5 + k) % todos.length];
      if (votante !== ra) out(`insert into public.foro_votos (usuario_id, respuesta_id) values (${q(U[votante])}, ${rid}) on conflict do nothing;`);
    }
  });
  out(`update public.foro_hilos set ultima_actividad = ${q(hace(Math.max(dias - 0.08 - (respuestas.length - 1) * 0.12, 0.01)))} where id = ${id};`);
  if (solucion >= 0) out(`update public.foro_hilos set solucion_id = ${ids[solucion]} where id = ${id};`);
});

// Respuestas nuevas en hilos del primer lote (900700–900718): reaviva los debates antiguos
const reavivar = [
  [700, 'irene_nano20', 'A mí me pasó lo mismo con el nano de 20 l. Al tercer día ya estaba transparente.', 2.4],
  [704, 'ines_axolotes', 'Yo sigo la regla de 80 l para el primero y 40 más por cada uno. Mis ryukin lo agradecen.', 3.6],
  [706, 'rafael_acaras', 'Para acarás-bandeira faço duas trocas grandes por semana e vai muito bem.', 5.1],
  [712, 'camila_bogota', 'Totalmente: con 10 o más cambian por completo. Los míos con 25 son otro pez.', 1.6],
  [713, 'hugo_recifal', 'Une pompe doseuse a changé ma vie. Stabilité du KH = SPS heureux.', 4.2],
  [715, 'sergio_lowtech', 'Sumo el Helecho de Java y las criptos. En mi low-tech son las que mejor van.', 2.9],
];
reavivar.forEach(([hilo, autor, texto, dias]) => {
  out(`insert into public.foro_respuestas (id, hilo_id, usuario_id, contenido, idioma, creado_en) overriding system value values (${idResp++}, ${900000 + hilo}, ${q(U[autor])}, ${q(texto)}, ${q(IDIOMA[autor])}, ${q(hace(dias))});`);
  out(`update public.foro_hilos set ultima_actividad = greatest(ultima_actividad, ${q(hace(dias))}) where id = ${900000 + hilo};`);
});

out(`update public.notificaciones set leida = true where creado_en < now() - interval '3 days' and usuario_id in (select id from auth.users where email like '%@${DOMINIO}');`);
out('commit;');

fs.writeFileSync(new URL('./datos_demo2.sql', import.meta.url), sql.join('\n') + '\n');
console.log(`${usuarios.length} cuentas, ${tanques.length} tanques, ${posts.length} publicaciones, ${comentarios.length} comentarios, ~${likes} me gusta, ${seguir.size} seguimientos, ${hilos.length} hilos + ${reavivar.length} respuestas en hilos antiguos`);
console.log(`${sql.length} sentencias → supabase/demo/datos_demo2.sql`);
