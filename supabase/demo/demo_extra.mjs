// Más actividad para la mitad de las cuentas de generar_demo2.mjs: un segundo tanque y dos publicaciones más.
// Plantillas por idioma que se rellenan con datos reales de cada cuenta: {tanque}, {especie}, {nitrato}, {pct}.

// Segundo tanque: [nombre, tipo, litros, descripción, habitantes, perfil de agua]
const T = {
  gambas: { tipo: 'gambas', litros: 30, agua: 'gambas', hab: [['Neocaridina davidi', 20, 'invertebrado'], ['Microsorum pteropus', 1, 'planta']] },
  cuarentena: { tipo: 'comunidad', litros: 40, agua: 'comunidad', hab: [] },
  betta: { tipo: 'plantado', litros: 20, agua: 'betta', hab: [['Betta splendens', 1, 'pez'], ['Anubias nana', 1, 'planta']] },
  fria: { tipo: 'agua_fria', litros: 120, agua: 'fria', hab: [['Goldfish oranda', 2, 'pez']] },
};
const TEXTOS_TANQUE = {
  es: { gambas: ['Nano de gambas', 'Colonia de cherry con musgo y poco más.'], cuarentena: ['Cuarentena', 'Tanque de cuarentena para peces nuevos. Nadie entra sin pasar por aquí.'], betta: ['Betta del despacho', 'Un betta y unas anubias junto al ordenador.'], fria: ['Goldfish del salón', 'Dos oranda sin calentador y con buena filtración.'] },
  en: { gambas: ['Shrimp nano', 'Cherry shrimp colony with moss and not much else.'], cuarentena: ['Quarantine', 'Quarantine tank for new fish. Nobody skips it.'], betta: ['Desk betta', 'A betta and some anubias next to my computer.'], fria: ['Living room goldies', 'Two orandas, no heater, good filtration.'] },
  de: { gambas: ['Garnelen-Nano', 'Red-Fire-Kolonie mit Moos und sonst wenig.'], cuarentena: ['Quarantäne', 'Quarantänebecken für neue Fische. Keiner kommt daran vorbei.'], betta: ['Schreibtisch-Betta', 'Ein Kampffisch und Anubias neben dem Rechner.'], fria: ['Goldfische im Wohnzimmer', 'Zwei Oranda ohne Heizung, mit guter Filterung.'] },
  fr: { gambas: ['Nano crevettes', 'Colonie de Red Cherry avec de la mousse, et c’est tout.'], cuarentena: ['Quarantaine', 'Bac de quarantaine pour les nouveaux poissons. Personne n’y échappe.'], betta: ['Betta du bureau', 'Un betta et quelques anubias à côté de l’ordinateur.'], fria: ['Poissons rouges du salon', 'Deux orandas, sans chauffage, bonne filtration.'] },
  it: { gambas: ['Nano gamberetti', 'Colonia di Red Cherry con muschio e poco altro.'], cuarentena: ['Quarantena', 'Vasca di quarantena per i pesci nuovi. Nessuno la salta.'], betta: ['Betta della scrivania', 'Un betta e qualche anubias accanto al computer.'], fria: ['Pesci rossi del salotto', 'Due oranda senza riscaldatore, con buona filtrazione.'] },
  pt: { gambas: ['Nano de camarões', 'Colônia de red cherry com musgo e pouco mais.'], cuarentena: ['Quarentena', 'Aquário de quarentena para peixes novos. Ninguém pula essa etapa.'], betta: ['Betta do escritório', 'Um betta e algumas anúbias ao lado do computador.'], fria: ['Kinguios da sala', 'Dois oranda sem aquecedor e com boa filtragem.'] },
  nl: { gambas: ['Garnalennano', 'Red cherry-kolonie met mos en verder weinig.'], cuarentena: ['Quarantaine', 'Quarantainebak voor nieuwe vissen. Niemand slaat hem over.'], betta: ['Bureau-kempvis', 'Een kempvis en wat anubias naast de computer.'], fria: ['Goudvissen in de woonkamer', 'Twee oranda’s zonder verwarming, met goede filtering.'] },
  pl: { gambas: ['Nano z krewetkami', 'Kolonia red cherry z mchem i niczym więcej.'], cuarentena: ['Kwarantanna', 'Zbiornik kwarantannowy dla nowych ryb. Nikt go nie pomija.'], betta: ['Bojownik na biurku', 'Bojownik i kilka anubiasów obok komputera.'], fria: ['Złote rybki w salonie', 'Dwie orandy bez grzałki, z dobrą filtracją.'] },
};

// Publicaciones extra: plantillas por idioma (con o sin foto de la especie del tanque)
const POSTS = {
  es: ['Cambio de agua del {pct} % hecho en {tanque}. Todo estable, como debe ser. #mantenimiento', 'Nitratos en {nitrato} mg/l en {tanque} esta semana. Vamos bien 📉 #parametros', 'Un rato mirando {tanque} al final del día. No hay mejor forma de desconectar.', 'Los {especie} de {tanque} están más activos que nunca desde que bajé un poco la luz.', 'Limpieza de cristales y sifonado en {tanque}. Ahora toca no tocar nada en una semana 😅', '¿Qué os parece cómo va {tanque}? Se aceptan consejos.'],
  en: ['{pct} % water change done on {tanque}. All stable, as it should be. #maintenance', 'Nitrates at {nitrato} mg/l in {tanque} this week. Heading the right way 📉', 'Ten minutes watching {tanque} after work. Best way to switch off.', 'The {especie} in {tanque} are more active than ever since I dimmed the light a bit.', 'Glass cleaned and gravel vac done on {tanque}. Now hands off for a week 😅', 'How do you think {tanque} is coming along? Tips welcome.'],
  de: ['{pct} % Wasserwechsel in „{tanque}“ erledigt. Alles stabil, wie es sein soll. #pflege', 'Nitrat diese Woche bei {nitrato} mg/l in „{tanque}“. Geht in die richtige Richtung 📉', 'Zehn Minuten vor „{tanque}“ nach der Arbeit. Besser kann man nicht abschalten.', 'Die {especie} in „{tanque}“ sind viel aktiver, seit ich das Licht etwas gedimmt habe.', 'Scheiben geputzt und Boden abgesaugt in „{tanque}“. Jetzt eine Woche Finger weg 😅', 'Was sagt ihr zu „{tanque}“? Tipps sind willkommen.'],
  fr: ['Changement d’eau de {pct} % fait sur {tanque}. Tout est stable, comme il faut. #entretien', 'Nitrates à {nitrato} mg/l dans {tanque} cette semaine. Ça va dans le bon sens 📉', 'Dix minutes devant {tanque} après le travail. Rien de mieux pour décrocher.', 'Les {especie} de {tanque} sont bien plus actifs depuis que j’ai baissé un peu la lumière.', 'Vitres nettoyées et sol siphonné dans {tanque}. Maintenant, on ne touche plus à rien pendant une semaine 😅', 'Vous en pensez quoi de {tanque} ? Les conseils sont les bienvenus.'],
  it: ['Cambio d’acqua del {pct} % fatto in {tanque}. Tutto stabile, come deve essere. #manutenzione', 'Nitrati a {nitrato} mg/l in {tanque} questa settimana. Si va nella direzione giusta 📉', 'Dieci minuti davanti a {tanque} dopo il lavoro. Il modo migliore per staccare.', 'I {especie} di {tanque} sono molto più attivi da quando ho abbassato un po’ la luce.', 'Vetri puliti e fondo sifonato in {tanque}. Ora mani lontane per una settimana 😅', 'Che ne pensate di {tanque}? Consigli benvenuti.'],
  pt: ['Troca de {pct} % feita no {tanque}. Tudo estável, como deve ser. #manutencao', 'Nitrato em {nitrato} mg/l no {tanque} esta semana. Indo no caminho certo 📉', 'Dez minutos olhando o {tanque} depois do trabalho. Melhor forma de desligar.', 'Os {especie} do {tanque} estão muito mais ativos desde que baixei um pouco a luz.', 'Vidros limpos e sifonagem feita no {tanque}. Agora é não mexer em nada por uma semana 😅', 'O que vocês acham do {tanque}? Dicas são bem-vindas.'],
  nl: ['{pct} % water ververst in {tanque}. Alles stabiel, zoals het hoort. #onderhoud', 'Nitraat op {nitrato} mg/l in {tanque} deze week. Gaat de goede kant op 📉', 'Tien minuten naar {tanque} kijken na het werk. Beter kun je niet ontspannen.', 'De {especie} in {tanque} zijn veel actiever sinds ik het licht wat heb gedimd.', 'Ruiten gepoetst en bodem gezogen in {tanque}. Nu een week niets aanraken 😅', 'Wat vinden jullie van {tanque}? Tips zijn welkom.'],
  pl: ['Podmiana {pct} % wody w zbiorniku „{tanque}” zrobiona. Wszystko stabilne, tak jak trzeba. #pielegnacja', 'Azotany {nitrato} mg/l w zbiorniku „{tanque}” w tym tygodniu. Idzie w dobrą stronę 📉', 'Dziesięć minut przed zbiornikiem „{tanque}” po pracy. Nie ma lepszego sposobu na odpoczynek.', '{especie} w zbiorniku „{tanque}” są dużo bardziej aktywne, odkąd światło jest trochę słabsze.', 'Szyby umyte i dno odmulone w zbiorniku „{tanque}”. Teraz tydzień bez dotykania 😅', 'Co sądzicie o moim zbiorniku „{tanque}”? Chętnie przyjmę rady.'],
};
// Comentarios cortos para las publicaciones extra
const COMS = {
  es: ['¡Qué bien se ve!', 'Muy buen trabajo 👏', 'Así da gusto.', 'La constancia se nota.'],
  en: ['Looking great!', 'Nice work 👏', 'That’s how it’s done.', 'Consistency shows.'],
  de: ['Sieht super aus!', 'Gute Arbeit 👏', 'So macht das Spaß.', 'Die Geduld zahlt sich aus.'],
  fr: ['Superbe !', 'Beau travail 👏', 'C’est comme ça qu’on fait.', 'La régularité, ça paie.'],
  it: ['Bellissimo!', 'Ottimo lavoro 👏', 'Così si fa.', 'La costanza si vede.'],
  pt: ['Tá lindo!', 'Ótimo trabalho 👏', 'É assim que se faz.', 'A constância aparece.'],
  nl: ['Ziet er top uit!', 'Goed bezig 👏', 'Zo hoort het.', 'Geduld loont.'],
  pl: ['Wygląda świetnie!', 'Dobra robota 👏', 'Tak się to robi.', 'Cierpliwość popłaca.'],
};

// Devuelve el segundo tanque, dos publicaciones y sus comentarios para cada cuenta elegida.
// cuentas: [{ u, lang, alta, tanque, especies }] · companeros(lang, u): otra cuenta del mismo idioma · azar(): 0–1
export function actividadExtra(cuentas, companeros, azar) {
  const tanques = [];
  const posts = [];
  const comentarios = [];
  const TIPOS = Object.keys(T);
  cuentas.forEach((c, i) => {
    const clave = TIPOS[i % TIPOS.length];
    const [nombre, desc] = TEXTOS_TANQUE[c.lang][clave];
    tanques.push([c.u, nombre, T[clave].tipo, T[clave].litros, null, {}, desc, Math.min(c.alta + 60, 300), 7, null, T[clave].hab, T[clave].agua]);
    const plantillas = POSTS[c.lang];
    for (let k = 0; k < 2; k++) {
      let plantilla = plantillas[(i * 2 + k) % plantillas.length];
      if (plantilla.includes('{especie}') && !c.especies.length) plantilla = plantillas[2]; // sin peces ni gambas: otra frase
      const texto = plantilla
        .replaceAll('{tanque}', k === 0 ? c.tanque : nombre)
        .replaceAll('{especie}', c.especies[0])
        .replaceAll('{nitrato}', String(4 + Math.round(azar() * 20)))
        .replaceAll('{pct}', String([20, 25, 30, 40][Math.floor(azar() * 4)]));
      const dias = Math.min(c.alta - 0.3, 0.2 + azar() * 13);
      posts.push({ autor: c.u, tanque: k === 0 ? c.tanque : nombre, texto, especie: k === 0 ? c.especieFoto : T[clave].hab[0]?.[0], dias: Math.max(dias, 0.1) });
      if (azar() < 0.7) comentarios.push({ post: posts.length - 1, autor: companeros(c.lang, c.u, i + k), texto: COMS[c.lang][(i + k) % 4] });
    }
  });
  return { tanques, posts, comentarios };
}

// Cuentas con un solo tanque: 3 o 4 publicaciones más sobre ese tanque, sin repetir plantilla dentro de la cuenta
export function publicacionesExtra(cuentas, companeros, azar) {
  const posts = [];
  const comentarios = [];
  cuentas.forEach((c, i) => {
    const plantillas = POSTS[c.lang];
    const cuantas = 3 + (i % 2);
    const usadas = new Set();
    for (let k = 0; k < cuantas; k++) {
      let j = (i + k) % plantillas.length;
      if (plantillas[j].includes('{especie}') && !c.especies.length) j = (j + 1) % plantillas.length;
      while (usadas.has(j)) j = (j + 1) % plantillas.length;
      usadas.add(j);
      const texto = plantillas[j]
        .replaceAll('{tanque}', c.tanque)
        .replaceAll('{especie}', c.especies[0])
        .replaceAll('{nitrato}', String(4 + Math.round(azar() * 20)))
        .replaceAll('{pct}', String([20, 25, 30, 40][Math.floor(azar() * 4)]));
      // Repartidas entre el alta y hoy, la más reciente de hace unas horas
      const dias = Math.max(0.1, Math.min(c.alta - 0.3, (k + azar()) * Math.min(c.alta, 14) / cuantas));
      posts.push({ autor: c.u, tanque: c.tanque, texto, especie: azar() < 0.6 ? c.especieFoto : null, dias });
      if (azar() < 0.6) comentarios.push({ post: posts.length - 1, autor: companeros(c.lang, c.u, i + k), texto: COMS[c.lang][(i + k + 1) % 4] });
    }
  });
  return { posts, comentarios };
}
