// Piezas de redes del 20 de octubre al 30 de diciembre de 2026 (calendario adelantado el 20/10) (plan: marca/plan-divulgacion-2026.html,
// guiones: marca/contenido-2026.html). generar.mjs convierte cada una en vídeo (reel) o láminas (carrusel).
//
// Visuales de cada escena o lámina:
//   pag(ruta, { desde, alto, ancla, esperar, ejemplo, rellenar })  captura de tankily.com en móvil; `desde` y `alto`
//        en px CSS (desde el texto `ancla` si se da); `esperar`: texto que tiene que haber cargado; `ejemplo` marca
//        datos de demostración; `rellenar`: valores para los campos de una calculadora, en orden
//   foto('Nombre científico')                          foto de marca/redes/fotos (con crédito)
//   cifra('40 L', 'mínimo')                            número grande
export const pag = (ruta, o = {}) => ({ tipo: 'pagina', ruta, desde: 0, alto: 560, ...o });
export const foto = (especie) => ({ tipo: 'foto', especie });
export const cifra = (valor, pie = '') => ({ tipo: 'cifra', valor, pie });
//   video('clave')                                     vídeo de marca/redes/videos (creditos.json), a pantalla completa
export const video = (clave) => ({ tipo: 'foto', video: clave });

const compat = (...especies) => `/es/herramientas/compatibilidad/?${especies.map((e) => 'con=' + encodeURIComponent(e)).join('&')}&litros=60`;

export const PIEZAS = [
  { n: 26, fecha: '2026-10-20', slug: 'esto-es-tankily-reel', formato: 'reel', titulo: 'Esto es Tankily (reel)',
    gancho: 'Esto es Tankily',
    escenas: [
      { t: 'Tu acuario, en un diario', v: pag('/es/tanque/arrecife-del-salon-900200/', { ancla: 'Temperatura', desde: -120, alto: 900, ejemplo: true, esperar: 'Nitrato' }) },
      { t: 'Te avisa cuando toca', v: pag('/es/', { ancla: 'Todo lo que pasa', desde: -60, alto: 900 }) },
      { t: '1.847 especies con ficha', v: pag('/es/wiki/especies/', { desde: 0, alto: 900 }) },
      { t: '¿Pueden convivir?', v: pag('/es/herramientas/compatibilidad/', { desde: 120, alto: 900 }) },
      { t: 'Una comunidad que sabe', v: pag('/es/tanques/', { desde: 0, alto: 900, ejemplo: true }) },
    ],
    texto: '¡Hola! Esto es Tankily, la red social de la acuariofilia.\n\nUn diario para tu acuario (parámetros, habitantes y avisos de mantenimiento), 1.847 especies con su ficha, herramientas para saber qué peces encajan y una comunidad con foro, mercado y tiendas.\n\nEs gratis: enlace en el perfil. ¿Qué acuario tienes tú? Cuéntanoslo en comentarios.',
    tags: '#acuariofilia #acuario #peces #aquarium #pecesdeacuario' },

  { n: 25, fecha: '2026-10-22', slug: 'esto-es-tankily', formato: 'carrusel', titulo: 'Esto es Tankily',
    gancho: 'Esto es Tankily: la red social de la acuariofilia', serie: 'Presentación', cierre: 'Gratis. Te esperamos dentro.',
    laminas: [
      { titulo: 'Tu acuario, en un diario', t: 'Apunta temperatura, pH o nitratos y mira cómo evolucionan.', v: pag('/es/tanque/arrecife-del-salon-900200/', { ancla: 'Temperatura', desde: -120, alto: 900, ejemplo: true, esperar: 'Nitrato' }) },
      { titulo: 'Te avisa cuando toca', t: 'Cambios de agua, filtro, abonado: Tankily te lo recuerda.', v: pag('/es/', { ancla: 'Todo lo que pasa', desde: -60, alto: 900 }) },
      { titulo: '1.847 especies con ficha', t: 'Tamaño, litros, agua y con quién puede vivir cada una.', v: pag('/es/wiki/especies/', { desde: 0, alto: 900 }) },
      { titulo: '¿Pueden convivir?', t: 'Elige tus peces y Tankily te dice si encajan antes de comprarlos.', v: pag('/es/herramientas/compatibilidad/', { desde: 120, alto: 900 }) },
      { titulo: 'Una comunidad que sabe', t: 'Enseña tu acuario, pregunta en el foro y encuentra tiendas cerca.', v: pag('/es/tanques/', { desde: 0, alto: 900, ejemplo: true }) },
    ],
    texto: '¡Hola! Esto es Tankily, la red social de la acuariofilia.\n\nUn diario para tu acuario (parámetros, habitantes y avisos de mantenimiento), 1.847 especies con su ficha, herramientas para saber qué peces encajan y una comunidad con foro, mercado y tiendas.\n\nEs gratis: enlace en el perfil. ¿Qué acuario tienes tú? Cuéntanoslo en comentarios.',
    tags: '#acuariofilia #acuario #peces #aquarium #pecesdeacuario' },
  { n: 1, fecha: '2026-12-06', slug: 'que-es-tankily', formato: 'reel', titulo: 'Qué es Tankily',
    gancho: 'Tu acuario, en el bolsillo',
    escenas: [
      { t: 'El diario de tu acuario, y la gente que lo entiende', v: pag('/es/', { desde: 0, alto: 520 }) },
      { t: 'Apunta tus parámetros y mira cómo evolucionan', v: pag('/es/', { desde: 520, alto: 400, ejemplo: true }) },
      { t: 'Te recuerda el cambio de agua', v: pag('/es/', { ancla: 'Tu agua, bajo control', desde: -24, alto: 300 }) },
      { t: '1.847 especies con su ficha', v: pag('/es/wiki/especies/', { desde: 0, alto: 560 }) },
      { t: 'Y una comunidad que sabe de peces', v: pag('/es/tanque/arrecife-del-salon-900200/', { desde: 0, alto: 520, ejemplo: true, esperar: 'Nitrato' }) },
    ],
    texto: 'Tankily es la red social de la acuariofilia: apunta los parámetros de tu acuario, recibe avisos de mantenimiento, consulta 1.847 especies y comparte tu tanque con gente que sabe de peces.\n\nGratis en tankily.com (enlace en el perfil).',
    tags: '#acuariofilia #acuario #peces #aquarium #pecesdeacuario' },

  { n: 2, fecha: '2026-10-25', slug: 'betta', formato: 'reel', titulo: 'Betta',
    gancho: '¿Un betta en una pecera de un litro? Mejor no.',
    escenas: [
      { t: 'Vive a 24–30 °C: sin calentador lo pasa mal', v: foto('Betta splendens') },
      { t: 'Necesita 40 litros como mínimo', v: cifra('40 L', 'mejor 60') },
      { t: 'Un solo macho por acuario: dos machos se pelean', v: foto('Betta splendens') },
      { t: 'Le encantan las plantas flotantes para descansar', v: null },
      { t: 'Ficha completa en Tankily', v: pag('/es/wiki/especies/betta-splendens/', { desde: 200, alto: 560 }) },
    ],
    texto: 'El betta es de los peces más vendidos… y de los peor alojados. Necesita calentador (24–30 °C), al menos 40 litros y, si es macho, estar solo.\n\nFicha completa: tankily.com/es/wiki/especies/betta-splendens/',
    tags: '#betta #bettafish #pezbetta #acuariofilia' },

  { n: 3, fecha: '2026-10-28', slug: 'calculadora-litros', formato: 'reel', titulo: 'Calculadora de litros',
    gancho: 'Tu acuario de 60 litros no tiene 60 litros',
    escenas: [
      { t: '60 × 30 × 35 cm: el cristal da 63 litros', v: pag('/es/herramientas/volumen/', { desde: 300, alto: 560, rellenar: [60, 30, 35, 0, 0] }) },
      { t: 'Quita 5 cm de sustrato y 3 cm sin llenar', v: pag('/es/herramientas/volumen/', { ancla: 'Agua real', desde: -190, alto: 470, rellenar: [60, 30, 35, 5, 3] }) },
      { t: 'Te quedan unos 49 litros de agua', v: cifra('49 L', 'de agua real') },
      { t: 'Y las rocas restan otro 5–15 %', v: null },
      { t: 'Calcula el tuyo gratis en Tankily', v: pag('/es/herramientas/volumen/', { desde: 0, alto: 520 }) },
    ],
    texto: 'El volumen del cristal no es el agua que tiene tu acuario: hay que descontar el sustrato, lo que queda sin llenar y la decoración. Con los litros reales se calculan la medicación, el abono y los cambios de agua.\n\nCalculadora gratis: tankily.com/es/herramientas/volumen/',
    tags: '#acuario #acuariofilia #consejosacuario' },

  { n: 4, fecha: '2026-10-30', slug: 'betta-y-gambas', formato: 'reel', titulo: 'Betta y gambas cherry',
    gancho: 'Betta y gambas cherry: ¿sí o no?',
    escenas: [
      { t: 'Depende del betta', v: foto('Betta splendens') },
      { t: 'Las gambas adultas pueden convivir si hay muchas plantas y escondites', v: foto('Neocaridina davidi') },
      { t: 'Las crías las verá como comida', v: null },
      { t: 'Si tu betta es muy cazador, mejor por separado', v: null },
      { t: 'Comprueba cualquier pareja en Tankily', v: pag(compat('Betta splendens', 'Neocaridina davidi Red'), { desde: 230, alto: 600 }) },
    ],
    texto: 'Respuesta corta: depende del betta. Con muchas plantas y escondites, las gambas adultas suelen salir adelante; las crías, no tanto.\n\n¿Tu betta convive con gambas? Cuéntanoslo en comentarios.\n\nCompatibilidad entre especies: tankily.com/es/herramientas/compatibilidad/',
    tags: '#betta #gambas #neocaridina #cherryshrimp #acuariofilia' },

  { n: 5, fecha: '2026-11-01', slug: 'corydoras', formato: 'reel', titulo: 'Corydoras',
    gancho: 'Un corydoras solo es un corydoras triste',
    escenas: [
      { t: 'Viven en grupo: 6 como mínimo', v: cifra('6+', 'en grupo') },
      { t: 'Buscan comida con sus barbillas: arena fina, nada de grava que corte', v: foto('Corydoras aeneus') },
      { t: 'El bronce es el más resistente: 22–28 °C', v: foto('Corydoras aeneus') },
      { t: 'El moteado aguanta agua más fresca: 18–24 °C', v: foto('Corydoras paleatus') },
      { t: '80 litros como mínimo. Fichas en Tankily', v: pag('/es/wiki/especies/corydoras-aeneus/', { desde: 200, alto: 560 }) },
    ],
    texto: 'Los corydoras son los limpiadores simpáticos del fondo, pero necesitan grupo (6 o más) y arena fina para no dañarse las barbillas.\n\nFicha del corydoras bronce: tankily.com/es/wiki/especies/corydoras-aeneus/',
    tags: '#corydoras #acuariofilia #pecesdeacuario' },

  { n: 6, fecha: '2026-11-04', slug: 'meter-peces-sin-ciclar', formato: 'reel', titulo: 'Meter peces sin ciclar',
    gancho: 'Montaste el acuario hoy y hoy metiste los peces. Error.',
    escenas: [
      { t: 'El agua nueva aún no tiene las bacterias que eliminan los desechos', v: null },
      { t: 'Semanas 1–2: sube el amoniaco, tóxico', v: cifra('NH₃', 'semanas 1–2') },
      { t: 'Después suben los nitritos, también tóxicos', v: cifra('NO₂', 'semanas 2–6') },
      { t: 'Entre 4 y 8 semanas: amoniaco 0 y nitritos 0. Ya está listo', v: cifra('4–8', 'semanas') },
      { t: 'Guía paso a paso en Tankily', v: pag('/es/wiki/explorer/ciclado/maduracion/', { desde: 240, alto: 560 }) },
    ],
    texto: 'Ciclar el acuario es dejar que crezcan las bacterias que convierten el amoniaco en nitratos. Tarda entre 4 y 8 semanas y es lo que más peces salva.\n\nGuía paso a paso: tankily.com/es/wiki/explorer/ciclado/maduracion/',
    tags: '#ciclado #acuarioprincipiante #acuariofilia' },

  { n: 7, fecha: '2026-10-23', slug: 'neon-o-cardenal', formato: 'carrusel', titulo: 'Neón o cardenal',
    gancho: 'Neón o cardenal: ¿sabes distinguirlos?', serie: 'Especie de la semana',
    laminas: [
      { titulo: 'Neón común', t: 'La franja roja solo llega hasta la mitad del cuerpo.', v: foto('Paracheirodon innesi') },
      { titulo: 'Cardenal', t: 'La franja roja recorre todo el cuerpo, de la cabeza a la cola.', v: foto('Paracheirodon axelrodi') },
      { titulo: 'El agua', t: 'El neón vive a 20–26 °C. El cardenal pide 23–28 °C y agua más blanda.', v: null },
      { titulo: 'Siempre en grupo', t: 'Los dos, en bancos de 10 o más. Fichas completas en Tankily.', v: pag('/es/wiki/especies/paracheirodon-axelrodi/', { desde: 0, alto: 420 }) },
    ],
    texto: 'Se confunden muchísimo: fíjate en la franja roja. En el neón llega hasta la mitad del cuerpo; en el cardenal, de punta a punta. Y el cardenal pide agua más cálida y blanda.\n\nFichas: tankily.com/es/wiki/especies/paracheirodon-innesi/ y tankily.com/es/wiki/especies/paracheirodon-axelrodi/',
    tags: '#neon #tetra #cardenal #acuariofilia' },

  { n: 8, fecha: '2026-11-06', slug: 'recordatorios', formato: 'reel', titulo: 'Recordatorios de mantenimiento',
    gancho: '¿Cuándo cambiaste el agua por última vez?',
    escenas: [
      { t: 'Ponle fecha al mantenimiento', v: pag('/es/', { ancla: 'Tu agua, bajo control', desde: -24, alto: 300 }) },
      { t: 'Cambios de agua, filtro, abonado…', v: null },
      { t: 'Tankily te avisa cuando toca', v: pag('/es/tanque/arrecife-del-salon-900200/', { ancla: 'Temperatura', desde: -50, alto: 460, ejemplo: true, esperar: 'Nitrato' }) },
      { t: 'Por notificación o por email. Gratis', v: null },
    ],
    texto: 'Ponle fecha al mantenimiento: cambios de agua, limpieza del filtro, abonado… Tankily te avisa por notificación o email cuando toca.\n\nGratis en tankily.com',
    tags: '#acuario #mantenimientoacuario #acuariofilia' },

  { n: 9, fecha: '2026-11-08', slug: '1847-especies', formato: 'reel', titulo: '1.847 especies',
    gancho: '1.847 especies con ficha. Gratis.',
    escenas: [
      { t: 'Peces, gambas, corales y plantas', v: pag('/es/wiki/especies/', { desde: 0, alto: 560 }) },
      { t: 'Filtra por agua y dificultad', v: pag('/es/wiki/especies/', { desde: 120, alto: 520 }) },
      { t: 'Cada una con tamaño, litros, temperatura y con quién puede vivir', v: pag('/es/wiki/especies/betta-splendens/', { desde: 200, alto: 560 }) },
      { t: '¿Qué especie quieres ver en el próximo vídeo? Comenta', v: null },
    ],
    texto: 'Peces, gambas, corales y plantas: 1.847 fichas con tamaño, litros, temperatura, pH y con quién pueden vivir.\n\n¿Qué especie quieres ver en el próximo vídeo? Déjala en comentarios.',
    tags: '#acuariofilia #especies #peces #aquarium' },

  { n: 10, fecha: '2026-11-25', slug: 'antes-de-comprar-un-acuario', formato: 'carrusel', titulo: '5 cosas antes de comprar un acuario',
    gancho: '5 cosas antes de comprar un acuario en Black Friday', serie: 'Black Friday',
    laminas: [
      { titulo: '1. Cuanto más grande, más estable', t: 'Para empezar, 60 litros o más. Los pequeños cambian antes de temperatura y de química.', v: cifra('60 L', 'o más') },
      { titulo: '2. Mira qué incluye', t: 'Filtro, calentador, luz y tapa. Si falta algo, súmalo al precio.', v: null },
      { titulo: '3. Cuenta el peso', t: 'Cada litro pesa 1 kg. 60 litros son más de 60 kg con cristal y sustrato: necesitas un mueble firme.', v: cifra('+60 kg', 'un acuario de 60 L') },
      { titulo: '4. No se estrena con peces', t: 'Primero, de 4 a 8 semanas de ciclado para que crezcan las bacterias.', v: null },
      { titulo: '5. Elige los peces antes que el acuario', t: 'Cada especie pide unos litros mínimos. Pruébalo en Tankily.', v: pag('/es/herramientas/especies/', { desde: 0, alto: 470 }) },
    ],
    texto: 'Si estás pensando en aprovechar el Black Friday para tu primer acuario, guárdate esto antes de comprar.\n\n¿Qué especies caben en tu acuario? tankily.com/es/herramientas/especies/',
    tags: '#blackfriday #acuario #acuarioprincipiante #acuariofilia' },

  { n: 11, fecha: '2026-11-27', slug: 'tiendas', formato: 'reel', titulo: '¿Tienes tienda de acuariofilia?',
    gancho: 'Si tienes una tienda de acuariofilia, esto te interesa',
    escenas: [
      { t: 'Tankily tiene un directorio de tiendas', v: pag('/es/tiendas/', { desde: 0, alto: 330 }) },
      { t: 'Darte de alta es gratis', v: pag('/es/tiendas/', { ancla: '¿Tienes una tienda de acuariofilia?', desde: -28, alto: 190 }) },
      { t: 'Y un mercado para la comunidad', v: pag('/es/mercado/', { desde: 0, alto: 330 }) },
      { t: 'Con el plan Pro destacas tus anuncios y tu ficha', v: null },
      { t: 'Entra en tankily.com y busca «Tiendas»', v: null },
    ],
    texto: 'Tankily tiene un directorio de tiendas y un mercado para la comunidad acuarista. Dar de alta tu tienda es gratis, y con el plan Pro destacas tus anuncios y tu ficha.\n\nMás información: tankily.com/es/tiendas/',
    tags: '#tiendaacuarios #acuariofilia #acuario' },

  { n: 12, fecha: '2026-11-11', slug: 'gamba-cherry', formato: 'reel', titulo: 'Gamba cherry',
    gancho: 'La gamba perfecta para empezar',
    escenas: [
      { t: 'Mide 2–3 cm y es rojo intenso', v: foto('Neocaridina davidi') },
      { t: 'Aguanta de 16 a 26 °C', v: cifra('16–26 °C') },
      { t: 'Come restos y la película de algas de plantas y cristal', v: foto('Neocaridina davidi') },
      { t: 'Cría sola si no hay peces que se coman las crías', v: null },
      { t: 'No la mezcles con otras variedades: los cruces pierden el color', v: pag('/es/wiki/especies/neocaridina-davidi-red/', { desde: 200, alto: 560 }) },
    ],
    texto: 'La cherry es la gamba con la que empieza casi todo el mundo: resistente, de colores vivos y se reproduce sola si no tiene peces que se coman las crías.\n\nFicha: tankily.com/es/wiki/especies/neocaridina-davidi-red/',
    tags: '#cherryshrimp #neocaridina #gambas #acuariofilia' },

  { n: 13, fecha: '2026-12-02', slug: 'primer-acuario-1-tamano-y-sitio', formato: 'carrusel', titulo: 'Tu primer acuario 1/4',
    gancho: 'Tu primer acuario: tamaño y dónde ponerlo', serie: 'Tu primer acuario · 1 de 4',
    laminas: [
      { titulo: '60 litros o más', t: 'Los acuarios pequeños cambian más rápido de temperatura y de química. Más agua, más margen de error.', v: cifra('60 L', 'o más') },
      { titulo: 'Lejos de ventanas', t: 'El sol directo dispara las algas y la temperatura.', v: null },
      { titulo: 'Lejos de radiadores', t: 'Y de puertas con corriente: los cambios bruscos de temperatura estresan a los peces.', v: null },
      { titulo: 'Un mueble que aguante', t: 'Cada litro pesa 1 kg. Y deja un enchufe cerca.', v: cifra('1 L = 1 kg') },
      { titulo: 'Nunca lo muevas lleno', t: 'Sigue la serie: el próximo capítulo es el ciclado.', v: null },
    ],
    texto: 'Empezamos la serie «Tu primer acuario», para quien estrene uno estas Navidades. Hoy: tamaño y dónde ponerlo. Guárdalo para cuando lo montes.',
    tags: '#tuprimeracuario #acuarioprincipiante #acuariofilia' },

  { n: 14, fecha: '2026-11-13', slug: 'goldfish-y-tropicales', formato: 'reel', titulo: 'Goldfish y peces tropicales',
    gancho: 'Goldfish con peces tropicales: el error más común',
    escenas: [
      { t: 'El goldfish vive en agua fresca: 10–20 °C', v: foto('Carassius auratus') },
      { t: 'Un betta necesita 24–30 °C. Un guppy, 22–28 °C', v: foto('Poecilia reticulata') },
      { t: 'Uno pasa frío o el otro calor', v: null },
      { t: 'Y el goldfish crece hasta 25–35 cm: 120 litros por pez', v: cifra('120 L', 'por goldfish') },
      { t: 'Mejor con otros goldfish. Compruébalo en Tankily', v: pag(compat('Carassius auratus', 'Poecilia reticulata'), { desde: 230, alto: 600 }) },
    ],
    texto: 'El goldfish es un pez de agua fría que puede pasar de 25 cm y vivir más de 20 años. Juntarlo con tropicales obliga a que uno de los dos viva fuera de su temperatura.\n\nFicha: tankily.com/es/wiki/especies/carassius-auratus/',
    tags: '#goldfish #acuario #acuariofilia' },

  { n: 15, fecha: '2026-11-15', slug: 'guppy', formato: 'reel', titulo: 'Guppy',
    gancho: 'El pez que se multiplica solo',
    escenas: [
      { t: 'Macho de 3 cm, hembra de 6 cm', v: foto('Poecilia reticulata') },
      { t: 'Vive a 22–28 °C y prefiere el agua más bien dura', v: cifra('22–28 °C') },
      { t: 'Un macho por cada 2–3 hembras, para que no las acose', v: cifra('1 : 3', 'macho : hembras') },
      { t: 'Paren crías ya formadas cada pocas semanas', v: foto('Poecilia reticulata') },
      { t: 'Ten un plan para las crías antes de comprarlos', v: pag('/es/wiki/especies/poecilia-reticulata/', { desde: 200, alto: 560 }) },
    ],
    texto: 'Fácil, colorido y prolífico: con un macho y varias hembras tendrás crías en pocas semanas. Piensa antes qué harás con ellas.\n\nFicha: tankily.com/es/wiki/especies/poecilia-reticulata/',
    tags: '#guppy #guppies #acuariofilia #pecesdeacuario' },

  { n: 16, fecha: '2026-12-09', slug: 'primer-acuario-2-ciclado', formato: 'reel', titulo: 'Tu primer acuario 2/4: el ciclado',
    gancho: 'Tu primer acuario (2/4): por qué esperar antes de meter peces',
    escenas: [
      { t: 'Semanas 1–2: sube el amoniaco', v: cifra('1–2', 'semanas') },
      { t: 'Semanas 2–3: baja el amoniaco y suben los nitritos', v: cifra('2–3', 'semanas') },
      { t: 'Semanas 3–6: bajan los nitritos y aparecen los nitratos', v: cifra('3–6', 'semanas') },
      { t: 'Semanas 6–8: amoniaco 0 y nitritos 0. Listo', v: cifra('0', 'amoniaco y nitritos') },
      { t: 'Luego, pocos peces al principio y ve añadiendo', v: null },
      { t: 'Guía completa en Tankily', v: pag('/es/wiki/explorer/ciclado/maduracion/', { desde: 240, alto: 560 }) },
    ],
    texto: 'El paso que más peces salva: dejar que el acuario madure. Así va semana a semana y así sabes que está listo.\n\nGuía: tankily.com/es/wiki/explorer/ciclado/maduracion/',
    tags: '#tuprimeracuario #ciclado #acuarioprincipiante #acuariofilia' },

  { n: 17, fecha: '2026-11-18', slug: 'registro-de-parametros', formato: 'reel', titulo: 'Registro de parámetros',
    gancho: '¿Sabes cómo ha cambiado tu agua este mes?',
    escenas: [
      { t: 'Apunta cada medición de tu acuario', v: pag('/es/', { desde: 520, alto: 400, ejemplo: true }) },
      { t: 'Mira cómo evoluciona', v: pag('/es/tanque/arrecife-del-salon-900200/', { ancla: 'Temperatura', desde: -50, alto: 460, ejemplo: true, esperar: 'Nitrato' }) },
      { t: 'Si algo se dispara, lo ves a tiempo', v: null },
      { t: 'Gratis en tankily.com', v: null },
    ],
    texto: 'Apunta cada medición de tu acuario y mira cómo evoluciona. Si algo se dispara, lo ves antes de que lo noten los peces.\n\nGratis en tankily.com',
    tags: '#acuario #parametrosdelagua #acuariofilia' },

  { n: 18, fecha: '2026-11-20', slug: 'filtro-agua-del-grifo', formato: 'reel', titulo: 'Lavar el filtro con agua del grifo',
    gancho: 'Lavas el filtro bajo el grifo y tu acuario vuelve a empezar',
    escenas: [
      { t: 'El cloro del grifo mata las bacterias del filtro', v: null },
      { t: 'Lava la esponja en un cubo con agua del propio acuario', v: null },
      { t: 'Hazlo durante el cambio de agua', v: null },
      { t: 'No hace falta dejarla como nueva: basta con quitar la suciedad gruesa', v: null },
      { t: 'Y nunca cambies todo el material del filtro a la vez', v: pag('/es/wiki/explorer/mantenimiento/', { desde: 0, alto: 520 }) },
    ],
    texto: 'En el filtro viven las bacterias que mantienen el agua sana. Lávalo con agua del propio acuario y sin dejarlo «como nuevo».\n\nMás sobre mantenimiento: tankily.com/es/wiki/explorer/mantenimiento/',
    tags: '#filtroacuario #mantenimientoacuario #acuariofilia' },

  { n: 19, fecha: '2026-12-16', slug: 'primer-acuario-3-peces-faciles', formato: 'carrusel', titulo: 'Tu primer acuario 3/4',
    gancho: 'Tu primer acuario: 5 peces para empezar', serie: 'Tu primer acuario · 3 de 4',
    laminas: [
      { titulo: 'Platy', t: 'Robusto y de muchos colores. 60 litros, agua dura.', v: foto('Xiphophorus maculatus') },
      { titulo: 'Guppy', t: '40 litros. Un macho por cada 2–3 hembras.', v: foto('Poecilia reticulata') },
      { titulo: 'Danio cebra', t: 'El más resistente. Grupo de 5 o más, y con tapa: salta.', v: foto('Danio rerio') },
      { titulo: 'Corydoras bronce', t: 'Grupo de 6 y arena fina. 80 litros.', v: foto('Corydoras aeneus') },
      { titulo: 'Rasbora arlequín', t: 'Grupo de 6–8. 60 litros, agua más bien blanda.', v: foto('Trigonostigma heteromorpha') },
      { titulo: 'Ojo: no todos comparten agua', t: 'Platys y guppys la prefieren dura; la rasbora, blanda. Comprueba cuáles encajan en el tuyo.', v: pag('/es/herramientas/especies/', { desde: 0, alto: 470 }) },
    ],
    texto: 'Cinco especies resistentes para estrenar acuario. Ojo: no todas quieren la misma agua (los platys y guppys la prefieren dura; la rasbora, más blanda). Comprueba cuáles encajan en el tuyo:\n\ntankily.com/es/herramientas/especies/',
    tags: '#tuprimeracuario #pecesfaciles #acuarioprincipiante #acuariofilia' },

  { n: 20, fecha: '2026-11-22', slug: 'platy', formato: 'reel', titulo: 'Platy',
    gancho: 'Si tu agua es dura, este es tu pez',
    escenas: [
      { t: 'Mide 5–6 cm', v: foto('Xiphophorus maculatus') },
      { t: 'Vive a 20–28 °C con pH 7–8', v: cifra('pH 7–8') },
      { t: 'Más robusto que el guppy y aguanta el agua dura', v: null },
      { t: 'Un macho por cada 2 hembras', v: cifra('1 : 2', 'macho : hembras') },
      { t: 'Hay decenas de colores. Ficha en Tankily', v: pag('/es/wiki/especies/xiphophorus-maculatus/', { desde: 200, alto: 560 }) },
    ],
    texto: 'En muchas zonas de España el agua del grifo es dura. El platy la agradece: es de los vivíparos más resistentes.\n\nFicha: tankily.com/es/wiki/especies/xiphophorus-maculatus/',
    tags: '#platy #viviparos #acuariofilia #pecesdeacuario' },

  { n: 21, fecha: '2026-11-29', slug: 'escalares-y-neones', formato: 'reel', titulo: 'Escalares y neones',
    gancho: 'Escalares y neones: la combinación que acaba mal',
    escenas: [
      { t: 'El escalar llega a 15 cm de alto', v: foto('Pterophyllum scalare') },
      { t: 'Se come los peces que le caben en la boca', v: null },
      { t: 'Un neón mide 4 cm: acaba siendo comida', v: foto('Paracheirodon innesi') },
      { t: 'Además necesita acuario alto: 150 litros y 50 cm de altura', v: cifra('150 L', '50 cm de alto') },
      { t: 'Está en su ficha de Tankily', v: pag('/es/wiki/especies/pterophyllum-scalare/', { ancla: 'Notas', desde: -20, alto: 300 }) },
    ],
    texto: 'Es una de las combinaciones más vendidas juntas y una de las que peor acaban: el escalar adulto se come a los neones.\n\nFicha del escalar: tankily.com/es/wiki/especies/pterophyllum-scalare/',
    tags: '#escalar #pezangel #neon #acuariofilia' },

  { n: 22, fecha: '2026-12-23', slug: 'primer-acuario-4-mantenimiento', formato: 'carrusel', titulo: 'Tu primer acuario 4/4',
    gancho: 'Tu primer acuario: 20 minutos a la semana', serie: 'Tu primer acuario · 4 de 4',
    laminas: [
      { titulo: 'Cambia el 20–30 % del agua', t: 'Cada semana. Es el mantenimiento más importante.', v: cifra('20–30 %', 'cada semana') },
      { titulo: 'Agua nueva, bien preparada', t: 'Con acondicionador para quitar el cloro y a la misma temperatura que el acuario.', v: null },
      { titulo: 'Sifona el fondo', t: 'Aspira los restos del sustrato mientras vacías.', v: null },
      { titulo: 'Cristal y termómetro', t: 'Limpia el cristal y comprueba que la temperatura sigue en su sitio.', v: null },
      { titulo: 'Que no se te olvide', t: 'Ponlo como recordatorio en Tankily y te avisará cada semana.', v: pag('/es/', { ancla: 'Tu agua, bajo control', desde: -24, alto: 300 }) },
    ],
    texto: 'Último capítulo de «Tu primer acuario»: la rutina semanal que mantiene el agua sana en unos 20 minutos.\n\nGuía completa: tankily.com/es/wiki/explorer/mantenimiento/rutinasemanal/',
    tags: '#tuprimeracuario #mantenimientoacuario #acuariofilia' },

  { n: 23, fecha: '2026-12-25', slug: 'si-te-han-regalado-un-acuario', formato: 'reel', titulo: 'Si te han regalado un acuario',
    gancho: '¿Te han regalado un acuario? No metas los peces todavía.',
    escenas: [
      { t: 'Móntalo, llénalo con agua tratada y enciende filtro y calentador', v: null },
      { t: 'Espera a que madure: 4–8 semanas', v: cifra('4–8', 'semanas') },
      { t: '¿Ya vinieron los peces? Pocos, poca comida y cambios de agua pequeños y frecuentes', v: null },
      { t: 'Mide amoniaco y nitritos cada pocos días', v: cifra('0', 'amoniaco y nitritos') },
      { t: 'Toda la serie «Tu primer acuario», en el perfil', v: pag('/es/wiki/explorer/ciclado/maduracion/', { desde: 240, alto: 560 }) },
    ],
    texto: 'Si estas Navidades ha llegado un acuario a casa, esto es lo primero. Y si ya vinieron con peces: poca comida, cambios de agua pequeños y frecuentes, y mide el agua.\n\nGuía: tankily.com/es/wiki/explorer/ciclado/maduracion/\n\n¡Felices fiestas!',
    tags: '#navidad #tuprimeracuario #acuarioprincipiante #acuariofilia' },

  { n: 24, fecha: '2026-12-04', slug: 'nerita-cebra', formato: 'reel', titulo: 'Nerita cebra',
    gancho: 'El caracol que limpia y no se multiplica',
    escenas: [
      { t: 'Mide 2–2,5 cm, con rayas negras en zigzag', v: foto('Neritina natalensis') },
      { t: 'Se come las algas del cristal, las piedras y las hojas', v: foto('Neritina natalensis') },
      { t: 'En agua dulce no se reproduce: no habrá plaga', v: null },
      { t: 'Puede dejar huevos blancos que no llegan a eclosionar', v: null },
      { t: 'Vive a 22–28 °C con pH 7–8. Ficha en Tankily', v: pag('/es/wiki/especies/neritina-natalensis/', { desde: 200, alto: 560 }) },
    ],
    texto: 'Si buscas un limpiador de algas que no se convierta en plaga, la nerita es de lo mejor: en agua dulce no se reproduce.\n\nFicha: tankily.com/es/wiki/especies/neritina-natalensis/',
    tags: '#nerita #caracoles #acuariofilia' },

  // Diciembre (añadidas el 20/10/2026 para cubrir los huecos del mes). Datos de las fichas de src/lib/especiesWiki.js
  { n: 27, fecha: '2026-12-11', slug: 'neon-comun', formato: 'reel', titulo: 'Neón común',
    gancho: 'El pez más vendido… y el que más se compra mal',
    escenas: [
      { t: 'Mide unos 4 cm y vive en grupo: 6 como mínimo', v: foto('Paracheirodon innesi') },
      { t: 'Agua de 20 a 26 °C, blanda y con pH 5,5–7,5', v: foto('Paracheirodon innesi') },
      { t: 'Necesita al menos 60 litros', v: cifra('60 L', 'como mínimo') },
      { t: 'Nunca en un acuario recién montado', v: null },
      { t: 'Ficha completa en Tankily', v: pag('/es/wiki/especies/paracheirodon-innesi/', { desde: 200, alto: 560 }) },
    ],
    texto: 'El neón es de los peces más vendidos, y casi siempre se compran dos o tres para un acuario pequeño. Necesita grupo (6 como mínimo, mejor 10), agua blanda y un acuario ya maduro.\n\nFicha: tankily.com/es/wiki/especies/paracheirodon-innesi/',
    tags: '#neon #tetraneon #acuariofilia #pecesdeacuario' },

  { n: 28, fecha: '2026-12-13', slug: 'regalos-para-acuaristas', formato: 'carrusel', titulo: 'Regalos para acuaristas',
    gancho: 'Regalos para un acuarista (que sí va a usar)', serie: 'Navidad', cierre: 'Y si regalas peces… mejor que los elija él.',
    laminas: [
      { titulo: 'Un test de gotas', t: 'Para medir nitritos, nitratos y pH. Las tiras sirven para salir del paso; las gotas son más fiables.', v: null },
      { titulo: 'Un termómetro digital', t: 'Barato y de los que más se agradecen: la temperatura estable es media salud del acuario.', v: null },
      { titulo: 'Un sifón para el fondo', t: 'Aspira la suciedad del sustrato mientras hace el cambio de agua.', v: null },
      { titulo: 'Acondicionador de agua', t: 'Quita el cloro del agua del grifo. Se gasta siempre, así que nunca sobra.', v: null },
      { titulo: 'Lo que NO conviene regalar', t: 'Peces por sorpresa: cada especie necesita su acuario, su agua y sus compañeros.', v: null },
    ],
    texto: 'Ideas de regalo para quien tiene acuario, de las que se usan de verdad: test de gotas, termómetro, sifón y acondicionador.\n\nY si estás pensando en regalar peces: mejor un vale y que los elija quien los va a cuidar.\n\nGratis en tankily.com (enlace en el perfil).',
    tags: '#acuariofilia #regalosnavidad #acuario' },

  { n: 29, fecha: '2026-12-18', slug: 'guppy-y-platy', formato: 'reel', titulo: 'Guppy y platy',
    gancho: 'Guppy y platy en el mismo acuario: ¿sí o no?',
    escenas: [
      { t: 'Los dos son pacíficos y les gusta el agua dura', v: foto('Poecilia reticulata') },
      { t: 'Comparten temperatura: 22–28 °C', v: cifra('22–28 °C', 'los dos a gusto') },
      { t: 'El platy pide 60 litros como mínimo', v: foto('Xiphophorus maculatus') },
      { t: 'Ojo: los dos tienen crías. Muchas.', v: null },
      { t: 'Compruébalo en Tankily antes de juntarlos', v: pag(compat('Poecilia reticulata', 'Xiphophorus maculatus'), { desde: 120, alto: 560 }) },
    ],
    texto: 'Guppy y platy suelen convivir bien: los dos son pacíficos, de agua dura y de 22 a 28 °C. Eso sí, con 60 litros como mínimo y un plan para las crías.\n\nCompatibilidad entre especies: tankily.com/es/herramientas/compatibilidad/',
    tags: '#guppy #platy #acuariofilia #pecesdeacuario' },

  { n: 30, fecha: '2026-12-20', slug: 'vacaciones-de-navidad', formato: 'carrusel', titulo: 'Tu acuario en vacaciones',
    gancho: 'Te vas por Navidad: ¿y el acuario?', serie: 'Navidad', cierre: 'Felices fiestas, a ti y a tus peces.',
    laminas: [
      { titulo: 'Unos días sin comer, sin drama', t: 'Un pez adulto y sano aguanta varios días sin comida. Es peor de más que de menos.', v: null },
      { titulo: 'Cambia el agua antes de irte', t: 'Dos o tres días antes, no el mismo día: así ves que todo sigue bien.', v: null },
      { titulo: 'Cuidado con los bloques de comida', t: 'Algunos ensucian el agua más de lo que alimentan. Si los usas, pruébalos antes.', v: null },
      { titulo: 'Más de una semana fuera', t: 'Un comedero automático o alguien de confianza con las raciones ya preparadas.', v: null },
      { titulo: 'Luz con temporizador', t: 'Y revisa el calentador: en invierno es lo que más importa.', v: null },
    ],
    texto: 'Si te vas unos días por Navidad, tu acuario puede quedarse solo sin problema con un poco de preparación.\n\nGuía de mantenimiento: tankily.com/es/wiki/explorer/mantenimiento/',
    tags: '#acuariofilia #acuario #navidad' },

  { n: 31, fecha: '2026-12-27', slug: 'pez-payaso-para-empezar', formato: 'reel', titulo: '¿Un pez payaso para empezar?',
    gancho: '¿Un pez payaso para empezar? Espera un momento',
    escenas: [
      { t: 'Vive en agua de mar, y la sal hay que medirla bien', v: video('arrecife') },
      { t: 'Necesita al menos 120 litros', v: cifra('120 L', 'como mínimo') },
      { t: 'Y temperatura estable: 24–26 °C', v: video('payasos') },
      { t: 'El marino pide más equipo y más control', v: null },
      { t: 'Infórmate bien en Tankily antes de dar el salto', v: pag('/es/wiki/especies/amphiprion-ocellaris/', { desde: 200, alto: 560 }) },
    ],
    texto: 'Después de ver «Buscando a Nemo» muchos quieren un pez payaso. Se puede, pero un acuario marino no es como uno de agua dulce: agua salada medida, 120 litros como mínimo y temperatura estable.\n\nFicha: tankily.com/es/wiki/especies/amphiprion-ocellaris/',
    tags: '#pezpayaso #acuariomarino #acuariofilia' },

  { n: 32, fecha: '2026-12-30', slug: 'propositos-2027', formato: 'carrusel', titulo: 'Propósitos de acuarista para 2027',
    gancho: '5 propósitos de acuarista para 2027', serie: 'Año nuevo', cierre: '¡Feliz 2027! Nos vemos en el agua.',
    laminas: [
      { titulo: 'Cambio de agua cada semana', t: 'Sin saltarse ninguna. Es lo que más se nota.', v: null },
      { titulo: 'Medir el agua y apuntarlo', t: 'Al menos una vez al mes. Con el historial ves los problemas antes de que lleguen.', v: pag('/es/tanque/arrecife-del-salon-900200/', { ancla: 'Temperatura', desde: -120, alto: 560, ejemplo: true, esperar: 'Nitrato' }) },
      { titulo: 'Investigar antes de comprar', t: 'Cada pez nuevo, con su ficha y su compatibilidad comprobadas.', v: null },
      { titulo: 'Comer menos (ellos)', t: 'Lo que comen en 2–3 minutos. El resto ensucia el agua.', v: null },
      { titulo: 'Enseñar tu acuario', t: 'Compártelo en la comunidad de Tankily: se aprende mucho de los demás.', v: null },
    ],
    texto: 'Cinco propósitos de acuarista para empezar 2027 con el agua en su sitio. ¿Cuál es el tuyo?\n\nGratis en tankily.com (enlace en el perfil).',
    tags: '#acuariofilia #acuario #propositos2027' },
];
