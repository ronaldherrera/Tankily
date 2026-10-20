// Locución de Krill para cada reel, alineada escena a escena con piezas.mjs.
// Krill: chaval acuarista entusiasta y sabelotodo, un poco sarcástico, que sufre con los errores de principiante y
// siempre está del lado del acuarista. Voz: marca/redes/voz/krill.json.
//
// Por escena: vo (lo que dice), k (expresión: normal | sorpresa | harto | feliz | pensando) y, opcional, t (sustituye
// el texto en pantalla, por ejemplo para un meme). Las escenas sin visual muestran a Krill grande reaccionando.
// Se escribe como se pronuncia: «Kril», números en palabras cuando hay rangos o símbolos, «gupi», «plati»...
export const FIRMA = '¡Soy Kril! ¡Nos vemos en el agua!';

export const LOCUCION = {
  1: { gancho: { vo: '¡Ey, acuarista! ¿Y si tu acuario cupiera en el bolsillo?', k: 'feliz' }, escenas: [
    { vo: 'Tankily es el diario de tu acuario... y de la gente que lo entiende.', k: 'normal' },
    { vo: 'Apuntas tus parámetros y ves cómo evolucionan. Sin libretas perdidas.', k: 'normal' },
    { vo: 'Y te recuerda el cambio de agua. Sí, ese que siempre se te olvida.', k: 'harto' },
    { vo: 'Mil ochocientas cuarenta y siete especies, cada una con su ficha.', k: 'sorpresa' },
    { vo: 'Y una comunidad que sabe de peces de verdad. Gratis.', k: 'feliz' },
  ] },
  2: { gancho: { vo: '¿Un betta... en una pecera de un litro? ¡Nooo! ¡Por favor, no!', k: 'sorpresa' }, escenas: [
    { vo: 'A ver, escúchame bien... El betta vive entre veinticuatro y treinta grados. ¿Sin calentador? ¡Pobrecito! ¡Lo pasa fatal!', k: 'normal' },
    { vo: '¿Y sabes cuánto sitio necesita? ¡Cuarenta litros! ¡Como mínimo! Y si le das sesenta... ¡te adora para siempre!', k: 'sorpresa' },
    { vo: 'Ah, y un detalle importantísimo... Un solo macho por acuario. ¿Dos machos juntos? ¡Zas! ¡A tortas!', k: 'harto' },
    { vo: 'Te cuento un secreto... ¡Le encantan las plantas flotantes! Se echa unas siestas ahí debajo... ¡que ni te imaginas!', k: 'feliz' },
    { vo: '¡Vale, vale! Tienes su ficha completa en Tankily.', k: 'feliz' },
  ] },
  3: { gancho: { vo: 'Plot twist: tu acuario de sesenta litros no tiene sesenta litros.', k: 'sorpresa' }, escenas: [
    { vo: 'Sesenta por treinta por treinta y cinco: el cristal da sesenta y tres litros.', k: 'normal' },
    { vo: 'Pero quita cinco centímetros de sustrato y tres que dejas sin llenar...', k: 'pensando' },
    { vo: 'Y te quedan unos cuarenta y nueve litros de agua de verdad.', k: 'sorpresa' },
    { vo: 'Y las rocas te roban otro poquito. Ojo con la medicación.', k: 'harto' },
    { vo: 'Calcula el tuyo gratis en Tankily.', k: 'feliz' },
  ] },
  4: { gancho: { vo: 'Betta y gambas cherry. ¿Sí o no? Vamos allá.', k: 'pensando' }, escenas: [
    { vo: 'Respuesta corta: depende del betta.', k: 'normal' },
    { vo: 'Con muchas plantas y escondites, las gambas adultas suelen salir adelante.', k: 'normal' },
    { vo: 'Las crías... para el betta son un bufé libre.', k: 'sorpresa', t: 'Las crías: bufé libre' },
    { vo: 'Y si tu betta es muy cazador, mejor por separado. Hay bettas que no perdonan.', k: 'harto' },
    { vo: 'Comprueba cualquier pareja en Tankily antes de juntarlos.', k: 'normal' },
  ] },
  5: { gancho: { vo: 'Un corydoras solo... es un corydoras triste.', k: 'harto' }, escenas: [
    { vo: 'Viven en grupo: seis como mínimo. Son muy de pandilla.', k: 'feliz' },
    { vo: 'Buscan comida con sus barbillas, así que arena fina. Nada de grava que corte.', k: 'normal' },
    { vo: 'El corydoras bronce es el más resistente. De veintidós a veintiocho grados.', k: 'normal' },
    { vo: 'El moteado aguanta el agua más fresquita: de dieciocho a veinticuatro.', k: 'normal' },
    { vo: 'Ochenta litros como mínimo. Fichas completas en Tankily.', k: 'feliz' },
  ] },
  6: { gancho: { vo: 'Montaste el acuario hoy... y hoy metiste los peces. ¡Nooo!', k: 'sorpresa' }, escenas: [
    { vo: 'El agua nueva todavía no tiene las bacterias que se comen los desechos.', k: 'harto', t: 'Yo, viendo un acuario sin ciclar con peces dentro' },
    { vo: 'Las dos primeras semanas sube el amoniaco. Tóxico.', k: 'normal' },
    { vo: 'Después suben los nitritos. También tóxicos.', k: 'harto' },
    { vo: 'Entre cuatro y ocho semanas: amoniaco cero, nitritos cero. Ahora sí.', k: 'feliz' },
    { vo: 'Tienes la guía paso a paso en Tankily.', k: 'normal' },
  ] },
  8: { gancho: { vo: 'Pregunta seria: ¿cuándo cambiaste el agua por última vez?', k: 'pensando' }, escenas: [
    { vo: 'Ponle fecha al mantenimiento.', k: 'normal' },
    { vo: 'Cambios de agua, filtro, abonado... A mí también se me olvida, tranquilo.', k: 'harto', t: 'Yo: «el cambio de agua lo hago mañana». Yo, tres semanas después:' },
    { vo: 'Tankily te avisa cuando toca.', k: 'feliz' },
    { vo: 'Por notificación o por email. Y gratis.', k: 'feliz' },
  ] },
  9: { gancho: { vo: 'Mil ochocientas cuarenta y siete especies con ficha. Gratis. Sí, las conté.', k: 'sorpresa' }, escenas: [
    { vo: 'Peces, gambas, corales y plantas.', k: 'normal' },
    { vo: 'Filtra por tipo de agua y por dificultad.', k: 'normal' },
    { vo: 'Y cada una con tamaño, litros, temperatura y con quién puede vivir.', k: 'feliz' },
    { vo: '¿Qué especie quieres que explique en el próximo vídeo? Te leo en comentarios.', k: 'pensando' },
  ] },
  11: { gancho: { vo: 'Si tienes una tienda de acuariofilia, esto te interesa.', k: 'normal' }, escenas: [
    { vo: 'Tankily tiene un directorio de tiendas.', k: 'normal' },
    { vo: 'Darte de alta es gratis.', k: 'feliz' },
    { vo: 'Y un mercado para la comunidad: esquejes, peces, equipo...', k: 'normal' },
    { vo: 'Con el plan Pro destacas tus anuncios y tu ficha.', k: 'feliz' },
    { vo: 'Entra en Tankily punto com y busca Tiendas.', k: 'normal' },
  ] },
  12: { gancho: { vo: 'Si vas a empezar con gambas, esta es tu gamba.', k: 'feliz' }, escenas: [
    { vo: 'La cheri mide de dos a tres centímetros y es rojo intenso.', k: 'normal' },
    { vo: 'Aguanta de dieciséis a veintiséis grados. Muy apañada.', k: 'normal' },
    { vo: 'Se come los restos y la película de algas de plantas y cristal.', k: 'feliz' },
    { vo: 'Y cría sola si no hay peces que se coman a las crías.', k: 'sorpresa' },
    { vo: 'Eso sí: no la mezcles con otras variedades, que los cruces pierden el color.', k: 'harto' },
  ] },
  14: { gancho: { vo: 'Góldfish con peces tropicales: el error más común. Te lo explico.', k: 'harto' }, escenas: [
    { vo: 'El góldfish vive en agua fresca: de diez a veinte grados.', k: 'normal' },
    { vo: 'Un betta necesita de veinticuatro a treinta. Un gupi, de veintidós a veintiocho.', k: 'normal' },
    { vo: 'Así que uno pasa frío... o el otro pasa calor.', k: 'harto', t: 'El goldfish y el betta discutiendo por el termostato' },
    { vo: 'Y encima el góldfish crece hasta treinta centímetros: ciento veinte litros por pez.', k: 'sorpresa' },
    { vo: 'Mejor con otros góldfish. Compruébalo en Tankily.', k: 'normal' },
  ] },
  15: { gancho: { vo: 'El pez que se multiplica solo. Literal.', k: 'sorpresa' }, escenas: [
    { vo: 'El macho de gupi mide tres centímetros. La hembra, seis.', k: 'normal' },
    { vo: 'Vive de veintidós a veintiocho grados y le gusta el agua más bien dura.', k: 'normal' },
    { vo: 'Un macho por cada dos o tres hembras, para que no las agobie.', k: 'harto' },
    { vo: 'Y paren crías ya formadas cada pocas semanas.', k: 'sorpresa' },
    { vo: 'Así que ten un plan para las crías antes de comprarlos. Avisado quedas.', k: 'pensando' },
  ] },
  16: { gancho: { vo: 'Tu primer acuario, parte dos: por qué hay que esperar antes de meter peces.', k: 'pensando' }, escenas: [
    { vo: 'Semanas uno y dos: sube el amoniaco.', k: 'normal' },
    { vo: 'Semanas dos y tres: baja el amoniaco y suben los nitritos.', k: 'normal' },
    { vo: 'De la tres a la seis: bajan los nitritos y aparecen los nitratos.', k: 'normal' },
    { vo: 'Y en la seis u ocho: amoniaco cero y nitritos cero. ¡Listo!', k: 'feliz' },
    { vo: 'Luego, pocos peces al principio y ve añadiendo. Sin prisa.', k: 'normal', t: 'Yo: «solo un pez más». También yo, en la tienda:' },
    { vo: 'Tienes la guía completa en Tankily.', k: 'normal' },
  ] },
  17: { gancho: { vo: '¿Sabes cómo ha cambiado tu agua este mes? Yo tampoco lo sabía.', k: 'pensando' }, escenas: [
    { vo: 'Apunta cada medición de tu acuario.', k: 'normal' },
    { vo: 'Y mira cómo evoluciona con el tiempo.', k: 'normal' },
    { vo: 'Si algo se dispara, lo ves a tiempo. Antes de que lo noten tus peces.', k: 'sorpresa' },
    { vo: 'Gratis en Tankily punto com.', k: 'feliz' },
  ] },
  18: { gancho: { vo: 'Lavas el filtro bajo el grifo... y tu acuario vuelve a empezar de cero.', k: 'sorpresa' }, escenas: [
    { vo: 'El cloro del grifo mata a las bacterias buenas del filtro.', k: 'harto' },
    { vo: 'Lava la esponja en un cubo con agua del propio acuario.', k: 'normal' },
    { vo: 'Aprovecha el cambio de agua para hacerlo.', k: 'feliz' },
    { vo: 'Y no hace falta dejarla como nueva: con quitar la suciedad gorda basta.', k: 'pensando', t: 'La esponja del filtro: sucia pero feliz' },
    { vo: 'Y nunca cambies todo el material del filtro a la vez.', k: 'normal' },
  ] },
  20: { gancho: { vo: 'Si el agua de tu grifo es dura, este es tu pez.', k: 'feliz' }, escenas: [
    { vo: 'El plati mide de cinco a seis centímetros.', k: 'normal' },
    { vo: 'Vive de veinte a veintiocho grados, con pe hache de siete a ocho.', k: 'normal' },
    { vo: 'Es más resistente que el gupi y aguanta el agua dura sin despeinarse.', k: 'feliz' },
    { vo: 'Un macho por cada dos hembras.', k: 'normal' },
    { vo: 'Y hay decenas de colores. Ficha completa en Tankily.', k: 'sorpresa' },
  ] },
  21: { gancho: { vo: 'Escalares y neones: la combinación que acaba mal.', k: 'harto' }, escenas: [
    { vo: 'El escalar llega a quince centímetros de alto.', k: 'normal' },
    { vo: 'Y se come a los peces que le caben en la boca.', k: 'sorpresa', t: 'El escalar viendo a los neones: «qué buena pinta»' },
    { vo: 'Un neón mide cuatro centímetros. Haz cuentas.', k: 'harto' },
    { vo: 'Además necesita un acuario alto: ciento cincuenta litros y cincuenta centímetros de altura.', k: 'normal' },
    { vo: 'Está en su ficha de Tankily.', k: 'normal' },
  ] },
  23: { gancho: { vo: '¿Te han regalado un acuario? ¡Quieto! No metas los peces todavía.', k: 'sorpresa' }, escenas: [
    { vo: 'Móntalo, llénalo con agua tratada y enciende el filtro y el calentador.', k: 'normal' },
    { vo: 'Y espera a que madure: de cuatro a ocho semanas.', k: 'pensando' },
    { vo: '¿Que los peces ya venían con el regalo? Pocos, poca comida y cambios de agua pequeños y frecuentes.', k: 'harto' },
    { vo: 'Y mide el amoniaco y los nitritos cada pocos días.', k: 'normal' },
    { vo: 'Tienes toda la serie Tu primer acuario en el perfil. ¡Felices fiestas!', k: 'feliz' },
  ] },
  24: { gancho: { vo: 'El caracol que limpia... y no se multiplica.', k: 'feliz' }, escenas: [
    { vo: 'La nerita cebra mide unos dos centímetros, con rayas negras en zigzag.', k: 'normal' },
    { vo: 'Se come las algas del cristal, de las piedras y de las hojas.', k: 'feliz' },
    { vo: 'Y en agua dulce no se reproduce. Adiós, plagas.', k: 'feliz' },
    { vo: 'Bueno... puede dejar huevitos blancos que no llegan a nada. Feos, pero inofensivos.', k: 'harto' },
    { vo: 'Vive de veintidós a veintiocho grados. Ficha completa en Tankily.', k: 'normal' },
  ] },
};

// Guiones para ElevenLabs v3: mismas frases con etiquetas de interpretación ([gasps], [whispers], [sighs], [laughs],
// [excited]...). Las etiquetas guían la actuación y no aparecen en los subtítulos.
export const LOCUCION_V3 = {
  2: { gancho: '[gasps] ¿Un betta... en una pecera de un litro? [dramatic] ¡Nooo! ¡Por favor, no!', escenas: [
    '[serious] A ver, escúchame bien. El betta vive entre veinticuatro y treinta grados. ¿Sin calentador? [sighs] Pobrecito... lo pasa fatal.',
    '[curious] ¿Y sabes cuánto sitio necesita? [excited] ¡Cuarenta litros, como mínimo! Y si le das sesenta... [laughs] te adora para siempre.',
    '[whispers] Y un detalle importantísimo... un solo macho por acuario. [dramatic] ¿Dos machos juntos? ¡Zas! ¡A tortas!',
    '[whispers] Te cuento un secreto... [excited] ¡Le encantan las plantas flotantes! Se echa unas siestas ahí debajo que ni te imaginas.',
    '[cheerful] ¡Vale, vale! Tienes su ficha completa en Tankily.',
  ], firma: '[cheerful] ¡Soy Kril! ¡Nos vemos en el agua!' },
};

// Presentación (reel del 20/10/2026)
LOCUCION[26] = { gancho: { vo: '¡Ey, acuarista! ¿Tienes acuario? Pues esto te va a encantar. Esto es Tankily.', k: 'feliz' }, escenas: [
  { vo: 'Un diario para tu acuario: apuntas la temperatura, el pH, los nitratos... y ves cómo evoluciona todo.', k: 'normal' },
  { vo: 'Y te avisa cuando toca cambiar el agua... sí, esa que siempre se nos olvida.', k: 'harto' },
  { vo: '¡Mil ochocientas cuarenta y siete especies! Cada una con su ficha: tamaño, litros, agua...', k: 'sorpresa' },
  { vo: '¿Pueden vivir juntos tu betta y tu góldfish? Spoiler: no. Tankily te lo dice antes de comprar.', k: 'pensando' },
  { vo: 'Y una comunidad que sabe de peces: enseña tu acuario, pregunta en el foro, encuentra tiendas.', k: 'feliz' },
] };
LOCUCION_V3[26] = { gancho: '[excited] ¡Ey, acuarista! [curious] ¿Tienes acuario? Pues esto te va a encantar... Esto es Tankily.', escenas: [
  'Un diario para tu acuario: apuntas la temperatura, el pH, los nitratos... [impressed] y ves cómo evoluciona todo.',
  '[whispers] Y te avisa cuando toca cambiar el agua... [laughs] sí, esa que siempre se nos olvida.',
  '[excited] ¡Mil ochocientas cuarenta y siete especies! Cada una con su ficha: tamaño, litros, agua...',
  '[curious] ¿Pueden vivir juntos tu betta y tu goldfish? [dramatic] Spoiler: no. Tankily te lo dice antes de comprar.',
  'Y una comunidad que sabe de peces: enseña tu acuario, pregunta en el foro, encuentra tiendas.',
], firma: '¡Es gratis! Soy Kril... ¡nos vemos en el agua!' };

// Diciembre (20/10/2026)
LOCUCION[27] = { gancho: { vo: 'El pez más vendido... y el que más se compra mal.', k: 'harto' }, escenas: [
  { vo: 'El neón mide unos cuatro centímetros y vive en grupo: seis como mínimo, y mejor diez.', k: 'normal' },
  { vo: 'Le gusta el agua blanda, de veinte a veintiséis grados.', k: 'normal' },
  { vo: 'Y necesita al menos sesenta litros. Sí, para un pez tan pequeño.', k: 'sorpresa' },
  { vo: 'Y nunca en un acuario recién montado: es de los primeros en sufrirlo.', k: 'harto' },
  { vo: 'Tienes su ficha completa en Tankily.', k: 'feliz' },
] };
LOCUCION[29] = { gancho: { vo: 'Gupis y platis en el mismo acuario. ¿Sí o no?', k: 'pensando' }, escenas: [
  { vo: 'Los dos son pacíficos y les gusta el agua más bien dura.', k: 'normal' },
  { vo: 'Y están a gusto de veintidós a veintiocho grados. Hasta aquí, todo bien.', k: 'feliz' },
  { vo: 'Eso sí: el plati pide sesenta litros como mínimo.', k: 'normal' },
  { vo: 'Y ojo, que los dos tienen crías. Muchas. Muchísimas.', k: 'sorpresa' },
  { vo: 'Compruébalo en Tankily antes de juntarlos.', k: 'normal' },
] };
LOCUCION[31] = { gancho: { vo: '¿Un pez payaso para empezar? Espera un momento.', k: 'sorpresa' }, escenas: [
  { vo: 'Vive en agua de mar, y la sal hay que medirla bien.', k: 'normal' },
  { vo: 'Necesita al menos ciento veinte litros.', k: 'sorpresa' },
  { vo: 'Y una temperatura estable, de veinticuatro a veintiséis grados.', k: 'normal' },
  { vo: 'Un acuario marino pide más equipo y más control que uno de agua dulce.', k: 'pensando' },
  { vo: 'Se puede, ¿eh? Pero infórmate bien en Tankily antes de dar el salto.', k: 'feliz' },
] };

// Resto de reels para ElevenLabs: el mismo texto con una etiqueta suave según la expresión. Pocas etiquetas, como en
// el 26 (aprobado): con muchas la locución suena forzada
const TONO = { sorpresa: '[excited] ', harto: '[sighs] ', pensando: '[curious] ' };
for (const [n, l] of Object.entries(LOCUCION)) {
  if (!LOCUCION_V3[n]) LOCUCION_V3[n] = { gancho: (TONO[l.gancho.k] || '') + l.gancho.vo, escenas: l.escenas.map((e) => (TONO[e.k] || '') + e.vo), firma: FIRMA };
}
