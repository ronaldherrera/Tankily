// Preguntas frecuentes y especies compatibles de una ficha, generadas a partir de sus datos técnicos (campo
// `ficha` del catálogo) en el idioma de la ficha. Dan a cada página texto propio y enlaces a otras fichas,
// que es lo que Google echaba en falta (Search Console: "Rastreada: actualmente sin indexar").
// Funciones puras: no tocan la base de datos ni la interfaz.
import { catalogoEspecies } from './catalogoEspecies';
import { fichaTraducida } from './especiesTraduccion';

const LOCALE = { es: 'es-ES', en: 'en-US', de: 'de-DE', pt: 'pt-BR', fr: 'fr-FR', it: 'it-IT', nl: 'nl-NL', pl: 'pl-PL' };

// Lista "A, B y C" en cada idioma
const Y = { es: 'y', en: 'and', de: 'und', pt: 'e', fr: 'et', it: 'e', nl: 'en', pl: 'i' };
const lista = (xs, lang) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${Y[lang]} ${xs[xs.length - 1]}`);

// Textos por idioma. Cada función recibe los datos ya formateados ({ n: nombre, l, g, t0, t1, ... })
const TEXTOS = {
  es: {
    titulo: (d) => `Preguntas frecuentes sobre ${d.n}`,
    compatiblesTitulo: 'Especies compatibles',
    agua: { dulce: 'dulce', marina: 'marina', salobre: 'salobre' },
    litrosP: (d) => `¿Qué tamaño de acuario necesita ${d.n}?`,
    litros: (d) => d.lpp ? `Unos ${d.l} litros por ejemplar${d.g ? `: para un grupo de ${d.g}, al menos ${d.lg} litros` : ''}.`
      : `Un mínimo de ${d.l} litros${d.g ? `, contando ya con un grupo de al menos ${d.g} ejemplares` : ''}.`,
    aguaP: () => '¿Qué temperatura y qué agua necesita?',
    aguaR: (d) => `Agua ${d.agua}${d.t ? ` entre ${d.t0} y ${d.t1} °C` : ''}${d.ph ? `, con un pH de ${d.p0} a ${d.p1}` : ''}${d.gh ? ` y una dureza general (GH) de ${d.g0} a ${d.g1} °dGH` : ''}${d.sal ? ` y una densidad de ${d.s0} a ${d.s1}` : ''}.`,
    tamanoP: { pez: '¿Cuánto mide de adulto?', invertebrado: '¿Cuánto mide de adulto?', planta: '¿Hasta qué altura crece?', coral: '¿Cuánto crece?' },
    tamano: { pez: (d) => `Alcanza unos ${d.cm} cm.`, invertebrado: (d) => `Alcanza unos ${d.cm} cm.`, planta: (d) => `Puede llegar a unos ${d.cm} cm.`, coral: (d) => `La colonia puede llegar a unos ${d.cm} cm.` },
    difP: () => '¿Es fácil de mantener?',
    dif: ['', 'Sí: es de las especies más fáciles, ideal para empezar.', 'Sí, es una especie fácil y apta para principiantes que cuiden la calidad del agua.',
      'Tiene una dificultad media: mejor con algo de experiencia y un acuario ya maduro.', 'Es exigente: necesita parámetros muy estables y experiencia previa.',
      'Es muy difícil; solo se recomienda a acuaristas avanzados.'],
    compP: () => '¿Es pacífico?',
    comp: { pacifico: 'Sí, es pacífico y convive bien con especies tranquilas de tamaño parecido.',
      semiagresivo: 'Es semiagresivo: puede defender su territorio o molestar a especies lentas o más pequeñas.',
      agresivo: 'No, es agresivo: elige con cuidado los compañeros o mantenlo solo.' },
    grupo: (d) => ` Es gregario: mantenlo en grupos de al menos ${d.g} ejemplares.`,
    reefP: () => '¿Se puede tener en un acuario de arrecife?',
    reef: { si: 'Sí, es apto para arrecife (reef safe).', precaucion: 'Con precaución: puede picotear corales o invertebrados, así que conviene vigilarlo.',
      no: 'No es apto para arrecife: puede comerse corales o invertebrados.' },
    compatP: { pez: '¿Con qué especies puede convivir?', invertebrado: '¿Con qué especies puede convivir?', planta: '¿Qué otras plantas comparten sus condiciones?', coral: '¿Qué otros corales comparten sus condiciones?' },
    compat: (d) => `${d.animal ? 'Por tipo de agua, temperatura, pH, tamaño y carácter, encajan por ejemplo ' : 'Por tipo de agua, temperatura y pH, encajan por ejemplo '}${d.lista}. Compruébalo con tu acuario en el compatibilizador de Tankily.`,
  },
  en: {
    titulo: (d) => `Frequently asked questions about ${d.n}`,
    compatiblesTitulo: 'Compatible species',
    agua: { dulce: 'Freshwater', marina: 'Saltwater', salobre: 'Brackish water' },
    litrosP: (d) => `What size tank does ${d.n} need?`,
    litros: (d) => d.lpp ? `About ${d.l} litres per specimen${d.g ? `; for a group of ${d.g}, at least ${d.lg} litres` : ''}.`
      : `At least ${d.l} litres${d.g ? `, already allowing for a group of at least ${d.g}` : ''}.`,
    aguaP: () => 'What temperature and water does it need?',
    aguaR: (d) => `${d.agua}${d.t ? ` between ${d.t0} and ${d.t1} °C` : ''}${d.ph ? `, with a pH of ${d.p0} to ${d.p1}` : ''}${d.gh ? ` and a general hardness (GH) of ${d.g0} to ${d.g1} °dGH` : ''}${d.sal ? ` and a specific gravity of ${d.s0} to ${d.s1}` : ''}.`,
    tamanoP: { pez: 'How big does it get?', invertebrado: 'How big does it get?', planta: 'How tall does it grow?', coral: 'How big does it grow?' },
    tamano: { pez: (d) => `It reaches about ${d.cm} cm.`, invertebrado: (d) => `It reaches about ${d.cm} cm.`, planta: (d) => `It can reach about ${d.cm} cm.`, coral: (d) => `The colony can reach about ${d.cm} cm.` },
    difP: () => 'Is it easy to keep?',
    dif: ['', 'Yes: it is one of the easiest species, ideal for beginners.', 'Yes, it is an easy species, suitable for beginners who look after water quality.',
      'It is of medium difficulty: best with some experience and a mature tank.', 'It is demanding: it needs very stable parameters and previous experience.',
      'It is very difficult; only recommended for advanced aquarists.'],
    compP: () => 'Is it peaceful?',
    comp: { pacifico: 'Yes, it is peaceful and lives well with calm species of a similar size.',
      semiagresivo: 'It is semi-aggressive: it may defend its territory or bother slow or smaller species.',
      agresivo: 'No, it is aggressive: choose tankmates carefully or keep it alone.' },
    grupo: (d) => ` It is a shoaling species: keep it in groups of at least ${d.g}.`,
    reefP: () => 'Can it be kept in a reef tank?',
    reef: { si: 'Yes, it is reef safe.', precaucion: 'With caution: it may nip corals or invertebrates, so keep an eye on it.',
      no: 'It is not reef safe: it may eat corals or invertebrates.' },
    compatP: { pez: 'Which species can it live with?', invertebrado: 'Which species can it live with?', planta: 'Which other plants share its conditions?', coral: 'Which other corals share its conditions?' },
    compat: (d) => `${d.animal ? 'Based on water type, temperature, pH, size and temperament, good matches include ' : 'Based on water type, temperature and pH, good matches include '}${d.lista}. Check it against your own tank with the Tankily compatibility checker.`,
  },
  de: {
    titulo: (d) => `Häufige Fragen zu ${d.n}`,
    compatiblesTitulo: 'Passende Arten',
    agua: { dulce: 'Süßwasser', marina: 'Meerwasser', salobre: 'Brackwasser' },
    litrosP: (d) => `Wie groß muss das Aquarium für ${d.n} sein?`,
    litros: (d) => d.lpp ? `Etwa ${d.l} Liter pro Tier${d.g ? `; für eine Gruppe von ${d.g} Tieren mindestens ${d.lg} Liter` : ''}.`
      : `Mindestens ${d.l} Liter${d.g ? `, bereits gerechnet für eine Gruppe von mindestens ${d.g} Tieren` : ''}.`,
    aguaP: () => 'Welche Temperatur und welches Wasser braucht die Art?',
    aguaR: (d) => `${d.agua}${d.t ? ` zwischen ${d.t0} und ${d.t1} °C` : ''}${d.ph ? `, mit einem pH-Wert von ${d.p0} bis ${d.p1}` : ''}${d.gh ? ` und einer Gesamthärte (GH) von ${d.g0} bis ${d.g1} °dGH` : ''}${d.sal ? ` und einer Dichte von ${d.s0} bis ${d.s1}` : ''}.`,
    tamanoP: { pez: 'Wie groß wird die Art?', invertebrado: 'Wie groß wird die Art?', planta: 'Wie hoch wächst die Pflanze?', coral: 'Wie groß wird die Koralle?' },
    tamano: { pez: (d) => `Sie wird etwa ${d.cm} cm groß.`, invertebrado: (d) => `Sie wird etwa ${d.cm} cm groß.`, planta: (d) => `Sie kann etwa ${d.cm} cm erreichen.`, coral: (d) => `Die Kolonie kann etwa ${d.cm} cm erreichen.` },
    difP: () => 'Ist die Haltung einfach?',
    dif: ['', 'Ja: Sie gehört zu den einfachsten Arten und ist ideal für den Einstieg.', 'Ja, eine einfache Art, geeignet für Einsteiger, die auf gute Wasserqualität achten.',
      'Mittlere Schwierigkeit: am besten mit etwas Erfahrung und einem eingefahrenen Aquarium.', 'Anspruchsvoll: braucht sehr stabile Wasserwerte und Erfahrung.',
      'Sehr schwierig; nur für fortgeschrittene Aquarianer empfohlen.'],
    compP: () => 'Ist die Art friedlich?',
    comp: { pacifico: 'Ja, sie ist friedlich und verträgt sich gut mit ruhigen Arten ähnlicher Größe.',
      semiagresivo: 'Sie ist bedingt aggressiv: Sie kann ihr Revier verteidigen oder langsame bzw. kleinere Arten stören.',
      agresivo: 'Nein, sie ist aggressiv: Mitbewohner sorgfältig auswählen oder einzeln halten.' },
    grupo: (d) => ` Sie lebt gesellig: in Gruppen von mindestens ${d.g} Tieren halten.`,
    reefP: () => 'Ist sie für ein Riffaquarium geeignet?',
    reef: { si: 'Ja, sie ist riffgeeignet (reef safe).', precaucion: 'Mit Vorsicht: Sie kann an Korallen oder Wirbellosen zupfen, daher im Auge behalten.',
      no: 'Nicht riffgeeignet: Sie kann Korallen oder Wirbellose fressen.' },
    compatP: { pez: 'Mit welchen Arten kann sie zusammenleben?', invertebrado: 'Mit welchen Arten kann sie zusammenleben?', planta: 'Welche anderen Pflanzen haben ähnliche Ansprüche?', coral: 'Welche anderen Korallen haben ähnliche Ansprüche?' },
    compat: (d) => `${d.animal ? 'Nach Wasserart, Temperatur, pH-Wert, Größe und Verhalten passen zum Beispiel ' : 'Nach Wasserart, Temperatur und pH-Wert passen zum Beispiel '}${d.lista}. Prüfe es für dein Aquarium mit dem Verträglichkeits-Check von Tankily.`,
  },
  pt: {
    titulo: (d) => `Perguntas frequentes sobre ${d.n}`,
    compatiblesTitulo: 'Espécies compatíveis',
    agua: { dulce: 'doce', marina: 'salgada', salobre: 'salobra' },
    litrosP: (d) => `De que tamanho de aquário ${d.n} precisa?`,
    litros: (d) => d.lpp ? `Cerca de ${d.l} litros por exemplar${d.g ? `; para um grupo de ${d.g}, pelo menos ${d.lg} litros` : ''}.`
      : `No mínimo ${d.l} litros${d.g ? `, já contando com um grupo de pelo menos ${d.g} exemplares` : ''}.`,
    aguaP: () => 'De que temperatura e de que água precisa?',
    aguaR: (d) => `Água ${d.agua}${d.t ? ` entre ${d.t0} e ${d.t1} °C` : ''}${d.ph ? `, com pH de ${d.p0} a ${d.p1}` : ''}${d.gh ? ` e dureza geral (GH) de ${d.g0} a ${d.g1} °dGH` : ''}${d.sal ? ` e densidade de ${d.s0} a ${d.s1}` : ''}.`,
    tamanoP: { pez: 'Quanto mede quando adulto?', invertebrado: 'Quanto mede quando adulto?', planta: 'Até que altura cresce?', coral: 'Quanto cresce?' },
    tamano: { pez: (d) => `Chega a cerca de ${d.cm} cm.`, invertebrado: (d) => `Chega a cerca de ${d.cm} cm.`, planta: (d) => `Pode chegar a cerca de ${d.cm} cm.`, coral: (d) => `A colônia pode chegar a cerca de ${d.cm} cm.` },
    difP: () => 'É fácil de manter?',
    dif: ['', 'Sim: é uma das espécies mais fáceis, ideal para começar.', 'Sim, é uma espécie fácil e indicada para iniciantes que cuidem da qualidade da água.',
      'Tem dificuldade média: melhor com alguma experiência e um aquário já maduro.', 'É exigente: precisa de parâmetros muito estáveis e de experiência prévia.',
      'É muito difícil; recomendada apenas para aquaristas avançados.'],
    compP: () => 'É pacífico?',
    comp: { pacifico: 'Sim, é pacífico e convive bem com espécies tranquilas de tamanho parecido.',
      semiagresivo: 'É semiagressivo: pode defender seu território ou incomodar espécies lentas ou menores.',
      agresivo: 'Não, é agressivo: escolha os companheiros com cuidado ou mantenha-o sozinho.' },
    grupo: (d) => ` Vive em cardume: mantenha-o em grupos de pelo menos ${d.g} exemplares.`,
    reefP: () => 'Pode ser mantido em aquário de recife?',
    reef: { si: 'Sim, é apto para recife (reef safe).', precaucion: 'Com cuidado: pode beliscar corais ou invertebrados, então vale a pena observá-lo.',
      no: 'Não é apto para recife: pode comer corais ou invertebrados.' },
    compatP: { pez: 'Com que espécies pode conviver?', invertebrado: 'Com que espécies pode conviver?', planta: 'Que outras plantas compartilham suas condições?', coral: 'Que outros corais compartilham suas condições?' },
    compat: (d) => `${d.animal ? 'Pelo tipo de água, temperatura, pH, tamanho e comportamento, combinam por exemplo ' : 'Pelo tipo de água, temperatura e pH, combinam por exemplo '}${d.lista}. Confira com o seu aquário no verificador de compatibilidade do Tankily.`,
  },
  fr: {
    titulo: (d) => `Questions fréquentes sur ${d.n}`,
    compatiblesTitulo: 'Espèces compatibles',
    agua: { dulce: 'Eau douce', marina: 'Eau de mer', salobre: 'Eau saumâtre' },
    litrosP: (d) => `Quelle taille d’aquarium faut-il pour ${d.n} ?`,
    litros: (d) => d.lpp ? `Environ ${d.l} litres par individu${d.g ? ` ; pour un groupe de ${d.g}, au moins ${d.lg} litres` : ''}.`
      : `Au moins ${d.l} litres${d.g ? `, en comptant déjà un groupe d’au moins ${d.g} individus` : ''}.`,
    aguaP: () => 'Quelle température et quelle eau lui faut-il ?',
    aguaR: (d) => `${d.agua}${d.t ? ` entre ${d.t0} et ${d.t1} °C` : ''}${d.ph ? `, avec un pH de ${d.p0} à ${d.p1}` : ''}${d.gh ? ` et une dureté générale (GH) de ${d.g0} à ${d.g1} °dGH` : ''}${d.sal ? ` et une densité de ${d.s0} à ${d.s1}` : ''}.`,
    tamanoP: { pez: 'Quelle taille atteint-il adulte ?', invertebrado: 'Quelle taille atteint-il adulte ?', planta: 'Jusqu’à quelle hauteur pousse-t-elle ?', coral: 'Jusqu’où grandit-il ?' },
    tamano: { pez: (d) => `Il atteint environ ${d.cm} cm.`, invertebrado: (d) => `Il atteint environ ${d.cm} cm.`, planta: (d) => `Elle peut atteindre environ ${d.cm} cm.`, coral: (d) => `La colonie peut atteindre environ ${d.cm} cm.` },
    difP: () => 'Est-il facile à maintenir ?',
    dif: ['', 'Oui : c’est l’une des espèces les plus faciles, idéale pour débuter.', 'Oui, c’est une espèce facile, adaptée aux débutants qui soignent la qualité de l’eau.',
      'Difficulté moyenne : mieux vaut un peu d’expérience et un aquarium déjà mature.', 'Exigeant : il faut des paramètres très stables et de l’expérience.',
      'Très difficile ; réservé aux aquariophiles confirmés.'],
    compP: () => 'Est-il pacifique ?',
    comp: { pacifico: 'Oui, il est pacifique et cohabite bien avec des espèces calmes de taille semblable.',
      semiagresivo: 'Il est semi-agressif : il peut défendre son territoire ou importuner des espèces lentes ou plus petites.',
      agresivo: 'Non, il est agressif : choisissez ses compagnons avec soin ou maintenez-le seul.' },
    grupo: (d) => ` C’est une espèce grégaire : maintenez-la en groupes d’au moins ${d.g} individus.`,
    reefP: () => 'Peut-on le maintenir en aquarium récifal ?',
    reef: { si: 'Oui, il est compatible récif (reef safe).', precaucion: 'Avec prudence : il peut picorer les coraux ou les invertébrés, mieux vaut le surveiller.',
      no: 'Il n’est pas compatible récif : il peut manger des coraux ou des invertébrés.' },
    compatP: { pez: 'Avec quelles espèces peut-il cohabiter ?', invertebrado: 'Avec quelles espèces peut-il cohabiter ?', planta: 'Quelles autres plantes partagent ses conditions ?', coral: 'Quels autres coraux partagent ses conditions ?' },
    compat: (d) => `${d.animal ? 'Selon le type d’eau, la température, le pH, la taille et le comportement, conviennent par exemple ' : 'Selon le type d’eau, la température et le pH, conviennent par exemple '}${d.lista}. Vérifiez-le pour votre aquarium avec l’outil de compatibilité de Tankily.`,
  },
  it: {
    titulo: (d) => `Domande frequenti su ${d.n}`,
    compatiblesTitulo: 'Specie compatibili',
    agua: { dulce: 'dolce', marina: 'marina', salobre: 'salmastra' },
    litrosP: (d) => `Che dimensioni di acquario servono per ${d.n}?`,
    litros: (d) => d.lpp ? `Circa ${d.l} litri per esemplare${d.g ? `; per un gruppo di ${d.g}, almeno ${d.lg} litri` : ''}.`
      : `Almeno ${d.l} litri${d.g ? `, già calcolati per un gruppo di almeno ${d.g} esemplari` : ''}.`,
    aguaP: () => 'Che temperatura e che acqua richiede?',
    aguaR: (d) => `Acqua ${d.agua}${d.t ? ` tra ${d.t0} e ${d.t1} °C` : ''}${d.ph ? `, con pH da ${d.p0} a ${d.p1}` : ''}${d.gh ? ` e durezza totale (GH) da ${d.g0} a ${d.g1} °dGH` : ''}${d.sal ? ` e densità da ${d.s0} a ${d.s1}` : ''}.`,
    tamanoP: { pez: 'Quanto misura da adulto?', invertebrado: 'Quanto misura da adulto?', planta: 'Fino a che altezza cresce?', coral: 'Quanto cresce?' },
    tamano: { pez: (d) => `Raggiunge circa ${d.cm} cm.`, invertebrado: (d) => `Raggiunge circa ${d.cm} cm.`, planta: (d) => `Può arrivare a circa ${d.cm} cm.`, coral: (d) => `La colonia può arrivare a circa ${d.cm} cm.` },
    difP: () => 'È facile da allevare?',
    dif: ['', 'Sì: è una delle specie più facili, ideale per iniziare.', 'Sì, è una specie facile e adatta ai principianti che curano la qualità dell’acqua.',
      'Ha una difficoltà media: meglio con un po’ di esperienza e un acquario già maturo.', 'È esigente: richiede parametri molto stabili ed esperienza.',
      'È molto difficile; consigliata solo ad acquariofili esperti.'],
    compP: () => 'È pacifico?',
    comp: { pacifico: 'Sì, è pacifico e convive bene con specie tranquille di taglia simile.',
      semiagresivo: 'È semiaggressivo: può difendere il territorio o disturbare specie lente o più piccole.',
      agresivo: 'No, è aggressivo: scegli con cura i compagni o allevalo da solo.' },
    grupo: (d) => ` È una specie da gruppo: allevalo in gruppi di almeno ${d.g} esemplari.`,
    reefP: () => 'Si può tenere in un acquario di barriera?',
    reef: { si: 'Sì, è adatto alla barriera (reef safe).', precaucion: 'Con cautela: può beccare coralli o invertebrati, quindi conviene tenerlo d’occhio.',
      no: 'Non è adatto alla barriera: può mangiare coralli o invertebrati.' },
    compatP: { pez: 'Con quali specie può convivere?', invertebrado: 'Con quali specie può convivere?', planta: 'Quali altre piante condividono le sue condizioni?', coral: 'Quali altri coralli condividono le sue condizioni?' },
    compat: (d) => `${d.animal ? 'Per tipo d’acqua, temperatura, pH, taglia e carattere, sono adatte per esempio ' : 'Per tipo d’acqua, temperatura e pH, sono adatte per esempio '}${d.lista}. Verificalo con il tuo acquario nel controllo di compatibilità di Tankily.`,
  },
  nl: {
    titulo: (d) => `Veelgestelde vragen over ${d.n}`,
    compatiblesTitulo: 'Passende soorten',
    agua: { dulce: 'Zoet water', marina: 'Zeewater', salobre: 'Brak water' },
    litrosP: (d) => `Hoe groot moet het aquarium voor ${d.n} zijn?`,
    litros: (d) => d.lpp ? `Ongeveer ${d.l} liter per exemplaar${d.g ? `; voor een groep van ${d.g} minstens ${d.lg} liter` : ''}.`
      : `Minstens ${d.l} liter${d.g ? `, al gerekend op een groep van minstens ${d.g} exemplaren` : ''}.`,
    aguaP: () => 'Welke temperatuur en welk water heeft de soort nodig?',
    aguaR: (d) => `${d.agua}${d.t ? ` tussen ${d.t0} en ${d.t1} °C` : ''}${d.ph ? `, met een pH van ${d.p0} tot ${d.p1}` : ''}${d.gh ? ` en een algemene hardheid (GH) van ${d.g0} tot ${d.g1} °dGH` : ''}${d.sal ? ` en een dichtheid van ${d.s0} tot ${d.s1}` : ''}.`,
    tamanoP: { pez: 'Hoe groot wordt de soort?', invertebrado: 'Hoe groot wordt de soort?', planta: 'Hoe hoog groeit de plant?', coral: 'Hoe groot wordt het koraal?' },
    tamano: { pez: (d) => `Ze wordt ongeveer ${d.cm} cm.`, invertebrado: (d) => `Ze wordt ongeveer ${d.cm} cm.`, planta: (d) => `Ze kan ongeveer ${d.cm} cm worden.`, coral: (d) => `De kolonie kan ongeveer ${d.cm} cm worden.` },
    difP: () => 'Is de soort makkelijk te houden?',
    dif: ['', 'Ja: een van de makkelijkste soorten, ideaal om mee te beginnen.', 'Ja, een makkelijke soort, geschikt voor beginners die op de waterkwaliteit letten.',
      'Gemiddeld moeilijk: liefst met wat ervaring en een ingelopen aquarium.', 'Veeleisend: heeft zeer stabiele waarden en ervaring nodig.',
      'Zeer moeilijk; alleen aan te raden voor gevorderde aquarianen.'],
    compP: () => 'Is de soort vreedzaam?',
    comp: { pacifico: 'Ja, ze is vreedzaam en kan goed samenleven met rustige soorten van vergelijkbare grootte.',
      semiagresivo: 'Ze is half-agressief: ze kan haar territorium verdedigen of trage of kleinere soorten lastigvallen.',
      agresivo: 'Nee, ze is agressief: kies de medebewoners zorgvuldig of houd haar alleen.' },
    grupo: (d) => ` Het is een scholenvis: houd ze in groepen van minstens ${d.g} exemplaren.`,
    reefP: () => 'Is de soort geschikt voor een rifaquarium?',
    reef: { si: 'Ja, ze is rifveilig (reef safe).', precaucion: 'Met voorzichtigheid: ze kan aan koralen of ongewervelden pikken, dus houd haar in de gaten.',
      no: 'Niet rifveilig: ze kan koralen of ongewervelden opeten.' },
    compatP: { pez: 'Met welke soorten kan ze samenleven?', invertebrado: 'Met welke soorten kan ze samenleven?', planta: 'Welke andere planten hebben dezelfde eisen?', coral: 'Welke andere koralen hebben dezelfde eisen?' },
    compat: (d) => `${d.animal ? 'Op basis van watertype, temperatuur, pH, grootte en karakter passen bijvoorbeeld ' : 'Op basis van watertype, temperatuur en pH passen bijvoorbeeld '}${d.lista}. Controleer het voor je eigen aquarium met de compatibiliteitscheck van Tankily.`,
  },
  pl: {
    titulo: (d) => `Najczęstsze pytania: ${d.n}`,
    compatiblesTitulo: 'Gatunki zgodne',
    agua: { dulce: 'Woda słodka', marina: 'Woda morska', salobre: 'Woda słonawa' },
    litrosP: () => 'Jakiego akwarium potrzebuje ten gatunek?',
    litros: (d) => d.lpp ? `Około ${d.l} litrów na osobnika${d.g ? `; dla grupy ${d.g} sztuk co najmniej ${d.lg} litrów` : ''}.`
      : `Co najmniej ${d.l} litrów${d.g ? `, licząc już grupę co najmniej ${d.g} sztuk` : ''}.`,
    aguaP: () => 'Jakiej temperatury i jakiej wody potrzebuje?',
    aguaR: (d) => `${d.agua}${d.t ? ` o temperaturze od ${d.t0} do ${d.t1} °C` : ''}${d.ph ? `, z pH od ${d.p0} do ${d.p1}` : ''}${d.gh ? ` i twardością ogólną (GH) od ${d.g0} do ${d.g1} °dGH` : ''}${d.sal ? ` i gęstością od ${d.s0} do ${d.s1}` : ''}.`,
    tamanoP: { pez: 'Jak duży dorasta?', invertebrado: 'Jak duży dorasta?', planta: 'Do jakiej wysokości rośnie?', coral: 'Jak duży rośnie?' },
    tamano: { pez: (d) => `Osiąga około ${d.cm} cm.`, invertebrado: (d) => `Osiąga około ${d.cm} cm.`, planta: (d) => `Może osiągnąć około ${d.cm} cm.`, coral: (d) => `Kolonia może osiągnąć około ${d.cm} cm.` },
    difP: () => 'Czy łatwo go utrzymać?',
    dif: ['', 'Tak: to jeden z najłatwiejszych gatunków, idealny na początek.', 'Tak, to łatwy gatunek, odpowiedni dla początkujących, którzy dbają o jakość wody.',
      'Średnio trudny: najlepiej z pewnym doświadczeniem i w dojrzałym akwarium.', 'Wymagający: potrzebuje bardzo stabilnych parametrów i doświadczenia.',
      'Bardzo trudny; polecany tylko zaawansowanym akwarystom.'],
    compP: () => 'Czy jest spokojny?',
    comp: { pacifico: 'Tak, jest spokojny i dobrze żyje ze spokojnymi gatunkami podobnej wielkości.',
      semiagresivo: 'Jest umiarkowanie agresywny: może bronić terytorium lub niepokoić wolniejsze albo mniejsze gatunki.',
      agresivo: 'Nie, jest agresywny: starannie dobieraj współlokatorów lub trzymaj go samego.' },
    grupo: (d) => ` To gatunek stadny: trzymaj go w grupach co najmniej ${d.g} sztuk.`,
    reefP: () => 'Czy nadaje się do akwarium rafowego?',
    reef: { si: 'Tak, jest bezpieczny dla rafy (reef safe).', precaucion: 'Z ostrożnością: może skubać koralowce lub bezkręgowce, więc warto go obserwować.',
      no: 'Nie nadaje się do rafy: może zjadać koralowce lub bezkręgowce.' },
    compatP: { pez: 'Z jakimi gatunkami może żyć?', invertebrado: 'Z jakimi gatunkami może żyć?', planta: 'Jakie inne rośliny mają podobne wymagania?', coral: 'Jakie inne koralowce mają podobne wymagania?' },
    compat: (d) => `${d.animal ? 'Pod względem rodzaju wody, temperatury, pH, wielkości i charakteru pasują na przykład ' : 'Pod względem rodzaju wody, temperatury i pH pasują na przykład '}${d.lista}. Sprawdź to dla swojego akwarium w narzędziu zgodności Tankily.`,
  },
};

// Solapamiento de dos rangos [a, b]; 0 si no se tocan
const solape = (a, b) => (a && b ? Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) : null);
// Orden estable pero variado entre fichas, para que no salgan siempre las mismas especies
const mezcla = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Especies que pueden compartir acuario con `e`: misma categoría y tipo de agua, temperatura y pH que se
// solapan, tamaño parecido (para que ninguno sea comida del otro) y carácter compatible
export function especiesCompatibles(e, max = 6) {
  const f = e.ficha;
  // Una especie agresiva no tiene "compañeros" fiables por datos: mejor no sugerir ninguno
  if (!f?.agua || !f.t || f.comp === 'agresivo') return [];
  const genero = (x) => (x.cientifico || '').split(' ')[0].toLowerCase();
  const vistas = new Set([e.comun || e.cientifico]);
  return catalogoEspecies()
    .filter((x) => {
      const g = x.ficha;
      if (x.slug === e.slug || x.categoria !== e.categoria || !g?.t || g.agua !== f.agua) return false;
      if (solape(f.t, g.t) < 1 || (f.ph && g.ph && solape(f.ph, g.ph) < 0.3) || (f.gh && g.gh && solape(f.gh, g.gh) < 2)) return false;
      if (g.comp === 'agresivo') return false;
      // En agua salada, dos especies del mismo género (payasos, cirujanos, pseudocromis…) suelen pelearse
      if (f.agua === 'marina' && genero(x) && genero(x) === genero(e)) return false;
      if (f.agua === 'marina' && f.reef === 'si' && g.reef === 'no') return false;
      if (e.categoria === 'pez' || e.categoria === 'invertebrado') {
        if (f.cm && g.cm && (g.cm < f.cm / 2 || g.cm > f.cm * 2)) return false;
        const orden = { pacifico: 0, semiagresivo: 1, agresivo: 2 };
        if (f.comp && g.comp && Math.abs(orden[f.comp] - orden[g.comp]) > (f.comp === 'semiagresivo' ? 1 : 0)) return false;
      }
      return true;
    })
    .map((x) => ({ x, puntos: solape(f.t, x.ficha.t) + (x.imagen ? 3 : 0) + (mezcla(e.slug + x.slug) % 5) }))
    .sort((a, b) => b.puntos - a.puntos)
    .map(({ x }) => x)
    .filter((x) => { const k = x.comun || x.cientifico; if (vistas.has(k)) return false; vistas.add(k); return true; })
    .slice(0, max);
}

// Nombre de una especie en el idioma de la ficha (el común traducido si existe)
export const nombreEn = (x, lang) => (lang !== 'es' && fichaTraducida(x, lang)?.comun) || x.comun || x.cientifico;

/**
 * @param e     especie del catálogo (con ficha, categoria y slug)
 * @param lang  idioma del texto (el de la ficha)
 * @param nombre nombre que se muestra en la página
 * @returns { titulo, compatiblesTitulo, preguntas: [{ p, r }], compatibles: [especie] }
 */
export function guiaEspecie(e, lang, nombre) {
  const T = TEXTOS[lang] || TEXTOS.es;
  const f = e.ficha || {};
  const n = (v) => Number(v).toLocaleString(LOCALE[lang] || 'es-ES', { maximumFractionDigits: 3 });
  const cat = TEXTOS.es.tamanoP[e.categoria] ? e.categoria : 'pez';
  const d = {
    n: nombre, l: f.l, g: f.grupo, lpp: f.lpp, lg: f.l && f.grupo ? f.l * f.grupo : null, cm: f.cm && n(f.cm),
    agua: T.agua[f.agua] || T.agua.dulce, t: f.t, ph: f.ph, gh: f.agua !== 'marina' && f.gh, sal: f.sal,
    t0: f.t && n(f.t[0]), t1: f.t && n(f.t[1]), p0: f.ph && n(f.ph[0]), p1: f.ph && n(f.ph[1]),
    g0: f.gh && n(f.gh[0]), g1: f.gh && n(f.gh[1]), s0: f.sal && n(f.sal[0]), s1: f.sal && n(f.sal[1]),
  };
  const preguntas = [];
  if (f.l) preguntas.push({ p: T.litrosP(d), r: T.litros(d) });
  if (f.t || f.ph) preguntas.push({ p: T.aguaP(d), r: T.aguaR(d) });
  if (f.cm) preguntas.push({ p: T.tamanoP[cat], r: T.tamano[cat](d) });
  if (f.dif) preguntas.push({ p: T.difP(d), r: T.dif[f.dif] });
  if (f.comp && T.comp[f.comp]) preguntas.push({ p: T.compP(d), r: T.comp[f.comp] + (f.grupo ? T.grupo(d) : '') });
  if (f.agua === 'marina' && f.reef && T.reef[f.reef]) preguntas.push({ p: T.reefP(d), r: T.reef[f.reef] });
  const compatibles = especiesCompatibles(e);
  if (compatibles.length >= 3) {
    preguntas.push({ p: T.compatP[cat], r: T.compat({ animal: cat === 'pez' || cat === 'invertebrado', lista: lista(compatibles.map((x) => nombreEn(x, lang)), lang) }) });
  }
  return { titulo: T.titulo(d), compatiblesTitulo: T.compatiblesTitulo, preguntas, compatibles };
}
