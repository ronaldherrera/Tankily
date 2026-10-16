# Informe de la sesión de noche (13/10/2026)

Trabajo hecho mientras dormías. **Nada está commiteado**: revísalo y, si te convence, dime "haz el commit". Lo que necesita tu intervención está en `docs/PENDIENTES.md`.

Para verlo: `npx next dev -p 3210` y abre http://localhost:3210/es/

## Resumen en un minuto
- **Google**: la portada no tenía contenido para Google (ahora sí, punto 21); cada sección, cada categoría del foro y cada tipo de acuario tienen su página con título propio (18, 27, 31): unas 200 páginas nuevas posicionables. Arreglados 456 enlaces rotos de WikiTank (30).
- **Dos herramientas nuevas, sin cuenta**: "¿Qué peces puedo tener?" y "¿Pueden convivir?" (32, 23). Responden a las búsquedas más habituales de la afición y llevan al registro.
- **Más registros**: portada con cifras y beneficios (16), invitación en tanques y tiendas compartidos (28), la wiki enseña qué tanques tienen cada especie (19).
- **Errores de datos corregidos**: 9 invertebrados marinos salían como de agua dulce y daban falsos "incompatible" en los reef (24).
- **Más robusta**: freno antispam en la base de datos (40), 30 pruebas automáticas y un comprobador de enlaces; el despliegue no publica si algo falla (26, 30). Pantalla de error en vez de página en blanco y aviso de "sin conexión" con reintentar en vez de listas vacías (33, 34).
- **Para ti**: emails de la cuenta con la marca listos para pegar en Supabase (29) y una propuesta de arquitectura para que tanques, hilos y anuncios salgan en Google uno a uno (en PENDIENTES).

---

## 1. Tankily se puede instalar como app
- Manifiesto PWA: en Android/Chrome aparece "Instalar Tankily"; en iPhone, "Añadir a pantalla de inicio" con su icono.
- Iconos nuevos generados desde el logo (192, 512, versión "maskable" para Android y 180 px para iPhone) y **favicon.ico nuevo** (el anterior era el logo viejo).
- Accesos directos desde el icono instalado: Tanques, Foro y Calculadoras.
- **Imagen para compartir enlaces** (WhatsApp, Facebook, X…): logotipo + tres tarjetas de tanque. Sirve para los 8 idiomas.

## 2. "Primeros pasos" para usuarios nuevos
En la portada, una lista de 6 pasos con barra de progreso que se marca sola: foto y bio, primer tanque, habitantes, primera medición, seguir a 3 acuaristas y primera publicación. Cada paso lleva donde se hace. Se puede ocultar.

## 3. La wiki convierte visitas en usuarios
En la ficha de cada especie de WikiTank aparece **"Añadir a mi tanque"**:
- Con sesión: eliges tanque y cantidad y ves al momento si encaja (temperatura, pH, litros, arrecife…).
- Sin sesión: invita a crear una cuenta gratis.
WikiTank es lo que más tráfico de Google traerá; ahora cada visita puede acabar en registro.

## 4. Logros en el perfil
12 insignias (primer tanque, químico del agua, sabio del foro, veterano…) con su progreso. Laura (demo) tiene 3/12 y ve que le falta 1 cambio de agua para "Constante".

## 5. Buscador más listo
Encuentra especies por nombre común ("payaso" → *Amphiprion*) y muestra las calculadoras ("co2", "litros").

## 6. Panel de administración `/admin/`
Para gestionar el negocio sin tocar la base de datos:
- **Resumen**: usuarios, nuevos esta semana, actividad, tiendas Pro, denuncias pendientes.
- **Denuncias**: ver, borrar el contenido, marcar revisada o descartar.
- **Tiendas**: activar/quitar Pro (1 año) y verificar.
- **Campañas**: crear y pausar campañas de publicidad propias.
Seguro: las acciones protegidas pasan por funciones de la base de datos que vuelven a comprobar que eres administrador (probado: un anónimo recibe "permiso denegado"). Para entrar tienes que hacerte admin (ver PENDIENTES).

## 7. Estadísticas para tiendas Pro
La ficha de cada tienda cuenta visitas (una por sesión, sin contar al dueño) y clics en contactar y en su web. En "Gestionar tienda", las Pro ven sus últimos 30 días con gráfica; las gratuitas ven qué se pierden y un botón al plan Pro. Añadido como ventaja del Pro en los 8 idiomas.

## 8. SEO
- Datos estructurados para Google: organización y buscador del sitio (portada), herramienta y migas de pan (calculadoras), artículo y migas (168 páginas de WikiTank).
- Meta descripción automática en cada página de WikiTank (antes no tenían).

## 9. Anuncios guardados en el mercado
Como los favoritos de Wallapop o Vinted: marcador en la esquina de cada anuncio y en su ficha, filtro "Guardados" en el mercado. Privados (cada uno ve solo los suyos; probado que un anónimo no puede leerlos). Sin sesión, el marcador avisa de que hay que entrar.

## 10. Hilos relacionados en el foro
Al final de cada hilo, otros de la misma categoría (primero los resueltos). Más tiempo en la web y mejor enlazado interno para Google. He añadido 6 hilos más a la demo para que se vea (arrecife, plantados, primeros pasos y gambas).

## 11. Contraste del tema claro
El color de texto de acento (etiquetas de tipo de tanque, enlaces, cifras destacadas) tenía poco contraste en tema claro (~2:1). Ahora 5,7:1, por encima del mínimo de accesibilidad (4,5:1). El oscuro no cambia.

## 12. Web más rápida: cada página carga solo su idioma
Cada visitante descargaba los textos de los 8 idiomas (106 KB comprimidos de JavaScript) en todas las páginas. Ahora el servidor incluye solo el diccionario del idioma de la página (~15 KB, y al navegar se guarda en caché). **Unos 85 KB menos en la primera visita**, lo que se nota en móviles y en la puntuación de velocidad de Google. Comprobado en los 8 idiomas: textos, plurales y fechas correctos, sin errores en el navegador.

## 13. Títulos del foro traducidos en los listados
En las listas del foro, los títulos de hilos en otro idioma salen traducidos (versión compacta, sin aviso; el original al pasar el ratón). Con MyMemory hay errores de calidad (en polaco tradujo "nano" como "enano"); con la clave de DeepL mejoraría mucho.

## 14. Privacidad: exportación de datos completa
El botón "Descargar mis datos" de Ajustes (derecho de acceso del RGPD) no incluía las tablas nuevas ni algunas antiguas. Ahora exporta también tareas, anuncios guardados, notificaciones, tanques que sigues y votos del foro. El borrado de cuenta ya lo cubría todo (se borra en cascada).

## 15. Auditoría de la base de datos
He pasado el analizador de seguridad y rendimiento de Supabase:
- **Corregido**: 4 tablas tenían reglas de acceso duplicadas que se evaluaban dos veces en cada lectura (habitantes, mediciones, diario y campañas). Ahora una sola regla por operación; los permisos son los mismos (comprobado).
- **Revisado y correcto**: las funciones ejecutables por cualquiera lo son a propósito (las de administrador comprueban por dentro), y la visibilidad en GraphQL respeta las mismas reglas de seguridad.
- **Para ti**: activar la protección contra contraseñas filtradas (en PENDIENTES).

## 16. Portada para visitantes que convence más
Quien llega sin cuenta ve ahora, además del titular:
- Una línea de confianza bajo los botones: "Gratis para aficionados" y cifras reales (140 especies con ficha, 153 artículos en WikiTank, 6 calculadoras, 8 idiomas). Se calculan al publicar la web, así que si la wiki crece, las cifras se actualizan solas.
- Un bloque "Todo lo que pasa en tu acuario, en un solo sitio" con lo que se puede hacer de verdad: control del agua y recordatorios, compatibilidad de especies, foro con soluciones marcadas y mercado entre aficionados.
- El botón "Crear cuenta gratis" repetido al final, antes de las publicaciones de la comunidad.
En los 8 idiomas; comprobado en español y alemán, sin errores.

## 17. Página 404 en los 8 idiomas
Antes solo hablaba español e inglés a la vez. Ahora detecta el idioma por la dirección (/fr/... → francés) o, si no lo hay, por el del navegador, y ofrece tres salidas: inicio, buscar y WikiTank, todas en su idioma.

## 18. Cada sección con su propio título en Google
Tanques, Foro, Mercado, Tiendas, WikiTank y Buscar salían en Google y al compartirlas con el mismo título y descripción que la portada ("Tankily — La comunidad de los acuarios"), lo que hace que Google las trate casi como duplicados. Ahora cada una tiene título, descripción y URL canónica propios en los 8 idiomas, pensados para lo que la gente busca (p. ej. en francés: "Marché de l’aquariophilie : achat et vente entre passionnés"). El título de la pestaña también cambia al navegar.

## 19. WikiTank: "En tanques de la comunidad"
En la ficha de cada especie, debajo de "Añadir a mi tanque", aparecen los tanques públicos que la tienen (foto, nombre, dueño, litros y número de ejemplares), con enlace a cada tanque. Ejemplo: la *Acropora millepora* muestra el reef de Laura (3) y el de Jake (4). Así quien llega desde Google a una ficha descubre la parte social. Si nadie la tiene, el bloque no aparece.

## 20. WikiTank: plantillas internas ocultas y descripciones para Google
- 30 páginas de grupos de especies (Corales, Peces, Plantas… de cada tipo de acuario) empezaban mostrando la **plantilla interna de redacción** ("ESTRUCTURA DE FICHA DE CORAL" con campos vacíos). Ahora se omite al mostrar la página; **los archivos .md no se han tocado**. Comprobado en las 30: se quita solo la plantilla y no se pierde ninguna ficha. Si prefieres borrarla de los archivos, está en PENDIENTES.
- Esas páginas no tenían descripción para Google (son solo fichas). Ahora se genera enumerando las especies: "Corales: fichas de Seta Discosoma, Seta Ricordea Florida… y 21 más, con temperatura, pH, tamaño y cuidados."

## 21. La portada ya existe para Google (importante)
He descubierto que la portada se dibujaba solo después de que el navegador comprobase si había sesión. Resultado: el HTML que lee Google **no tenía titular ni texto** (ni un H1), y los visitantes veían un instante en blanco. Ahora el titular, las cifras y los beneficios van en el HTML estático en los 8 idiomas. Para que quien ya tiene sesión no vea la portada un instante, un mini script (junto al del tema) detecta la sesión guardada y la oculta; si esa sesión había caducado, la portada vuelve a aparecer. Probado en los dos casos.
Lo mismo en el Mercado: su cabecera (título y descripción) ahora va en el HTML.

## 22. Rendimiento: imágenes diferidas y conexión anticipada
Logos de tiendas, habitantes, resultados de búsqueda y miniaturas de anuncios ya no se descargan hasta que se van a ver (menos datos en móvil).
Además, cada página abre la conexión con la base de datos (Supabase) nada más empezar a cargar, en paralelo al resto, así que los primeros datos llegan antes. He medido el JavaScript que descarga cada página: unos 225 KB comprimidos, de los que la mayor parte es React, Next y Supabase (necesario en todas para la sesión); no hay ganancias fáciles ahí.

## 23. Nueva herramienta pública: "¿Pueden convivir?"
`/herramientas/compatibilidad/` — la búsqueda "compatibilidad de peces" es de las más habituales en acuariofilia, y ahora Tankily tiene una página que la responde, sin cuenta y en los 8 idiomas:
- Eliges agua dulce, marino o arrecife y los litros, y añades especies buscando por nombre común o científico (solo salen las 140 con ficha técnica y del tipo de agua elegido).
- Te dice al momento si hay conflictos (agua, temperatura, pH, dureza, salinidad, apto para arrecife, litros mínimos, peces en grupo, agresivos con pacíficos) y el rango de agua que sirve a todas. Usa el mismo análisis que el panel de cada tanque.
- Al final invita a "Montar este tanque en Tankily" (registro). Cada especie enlaza a su ficha de WikiTank.
- Arranca con un ejemplo que ya enseña algo (neón + betta + goldfish → el goldfish pide agua fría).
- Es la primera de la lista de calculadoras y se carga aparte, así que las demás calculadoras no pesan más.
- Conectada con el resto: en la portada, el bloque "¿Pueden convivir?" lleva a ella ("Pruébalo sin cuenta"), y cada ficha de especie de WikiTank tiene "¿Con qué puede convivir? Compruébalo", que abre la herramienta con esa especie y su tipo de acuario ya puestos.

## 24. Corregido: invertebrados marinos marcados como de agua dulce
Al revisar los datos de las fichas encontré que 9 invertebrados marinos (gamba limpiadora, gamba sangre, caracoles Astraea, Trochus y Nassarius, cangrejo esmeralda…) estaban clasificados como de agua dulce, porque su ficha pone la salinidad en otro campo. Consecuencia: un tanque reef con una gamba limpiadora mostraba un falso "Incompatible: especie de agua dulce en tanque marino". Corregido el índice (sin tocar las fichas): ahora lee "Tipo de agua", la salinidad donde esté y la carpeta del acuario. Las 5 especies de agua salobre (pez arquero, globo de manglar, cangrejos violinista y Sesarma, killi) quedan sin tipo para no dar avisos falsos en ningún sentido. La gamba Amano sigue como agua dulce (su ficha dice "dulce (ciclo larval marino)").

## 25. Compartir hilos del foro y fichas de tiendas
Los tanques, publicaciones y anuncios ya se podían compartir; los hilos del foro y las tiendas no. Ahora tienen el mismo botón: en móvil abre el menú de compartir del teléfono (WhatsApp, Telegram…) y en ordenador copia el enlace. En las tiendas lo ve también el dueño, que es quien más va a difundir su ficha. La descripción de la página de calculadoras menciona ahora la de compatibilidad, en los 8 idiomas.

## 26. Pruebas automáticas y despliegue protegido
La web no tenía ninguna prueba automática. He añadido 21 pruebas de la lógica que más importa que no falle (fórmulas de las calculadoras, compatibilidad entre especies, recordatorios de mantenimiento), incluida una que comprueba que no vuelve el error de los invertebrados marinos del punto 24. Usan el ejecutor de pruebas que trae Node, sin instalar nada: `npm test`.
Además, el despliegue automático (GitHub Actions) ahora pasa el lint, la comprobación de textos y las pruebas **antes** de publicar: si algo falla, la web publicada no se toca. _El despliegue usa Node 20 y aquí tengo Node 24: he ajustado el comando de pruebas para Node 20, pero la primera vez que hagas push conviene mirar que el paso "Lint, textos y pruebas" sale en verde en GitHub → Actions._

## 27. Cada categoría del foro con su propia página
Las categorías del foro vivían en `/foro/categoria/?c=reef`: para Google, las 14 eran la misma página. Ahora cada una tiene dirección propia (`/foro/reef/`, `/foro/gambas/`, `/foro/principiantes/`…), título y descripción ("Reef y corales · Foro de acuariofilia"), migas de pan para Google y entrada en el sitemap: 14 categorías × 8 idiomas = 112 páginas nuevas que se pueden posicionar. Las direcciones antiguas siguen funcionando (redirigen a la nueva) y todos los enlaces internos ya apuntan a las nuevas.

## 28. Más conversión desde lo que se comparte, y detalles
- **Invitación a registrarse** en la ficha de un tanque y de una tienda, solo para visitantes sin cuenta: "¿Tienes acuario? Lleva su diario como Laura Ferrer: el agua, los habitantes y los recordatorios, en un solo sitio" + "Crear cuenta gratis". Son las páginas que más llegan por WhatsApp; antes no invitaban a nada. Con sesión no aparece.
- **Litros calculados solos** al crear un tanque: si pones largo, fondo y alto pero no el volumen, el campo sugiere "≈ 112" y se guarda ese valor (el del cristal). _No lo he podido probar con una sesión real; es un cálculo sencillo._
- **Buscar** ya no se ve en blanco un instante al abrirse: la caja de búsqueda aparece desde el primer momento.

## 29. Emails de la cuenta con la marca, en 8 idiomas (listos para activar)
Supabase manda por defecto emails genéricos en inglés ("Confirm your signup"), que suelen ser la primera impresión de la marca. He preparado las cuatro plantillas (confirmar cuenta, nueva contraseña, enlace para entrar sin contraseña y cambio de email) con el logo, los colores de Tankily y los textos en los 8 idiomas. Al registrarse ahora se guarda el idioma de la web, y el email sale en ese idioma (si no se sabe, en español). Activarlas es pegar cada una en Supabase: pasos en PENDIENTES.

## 30. 456 enlaces rotos en WikiTank, arreglados (y vigilados)
He pasado un comprobador por las 1.789 páginas de la web (48.955 enlaces internos). Había **57 enlaces rotos en cada idioma**, todos dentro de WikiTank: los índices de Ciclado, Química, Enfermedades, Algas, Equipamiento, Mantenimiento, Reproducción, Biología y Alimentación enlazan a sus artículos como `Carpeta/Archivo.md`, y la web los convertía en direcciones que no existían (`/ciclado/ciclonitrogeno/ciclonitrogeno/`), así que al pulsarlos salía el 404. Ahora se resuelven como rutas de archivos (incluidos `../`) y llevan a la página correcta. Resultado: **0 enlaces rotos**. No he tocado los .md.
El comprobador queda en el proyecto (`npm run enlaces`) y el despliegue lo ejecuta tras el build: si algún día aparece un enlace roto, no se publica.

## 31. Una página por tipo de acuario
Igual que con el foro: `/tanques/plantado/`, `/tanques/reef/`, `/tanques/agua-fria/`, `/tanques/gambas/`… (12 tipos × 8 idiomas = 96 páginas), cada una con título y descripción propios ("Plantado: acuarios de la comunidad") y los tanques reales de ese tipo. Búsquedas como "acuario plantado" o "acuario de gambas" son de las más frecuentes del sector, y ahora hay una página con ejemplos reales para cada una. Los filtros por tipo de la lista de tanques son ahora enlaces a esas páginas (antes eran botones que Google no seguía).

## 32. Nueva herramienta: "¿Qué peces puedo tener?"
`/herramientas/especies/` — responde a búsquedas tan habituales como "peces para acuario de 60 litros". Eliges agua dulce o marino, los litros y, si quieres, la temperatura y el pH de tu agua, la dificultad (fácil / hasta media / cualquiera) y qué buscas (peces, invertebrados, corales o plantas). Sale la lista de especies que encajan, de la más fácil a la más difícil, con su temperatura, pH, litros mínimos (teniendo en cuenta el grupo mínimo cuando la ficha pide litros por ejemplar) y tamaño de grupo, y cada una enlaza a su ficha. Ejemplo: 60 l, agua dulce, peces fáciles → 16 especies. Al final lleva a la de compatibilidad para comprobar si las elegidas conviven. Es la primera de las calculadoras, en los 8 idiomas, y tiene su prueba automática.
- **Las dos herramientas trabajan juntas**: en la lista puedes marcar varias especies (botón +) y "Comprobar estas 3 juntas" abre la de compatibilidad con esas especies, su grupo mínimo y tus litros ya puestos. Probado: barbo cherry + endler + neón en 60 l → "pueden convivir", con el agua ideal para las tres.

## 33. Si algo falla, ya no se queda la página en blanco
No había ninguna "red de seguridad": si un componente fallaba en el navegador (por ejemplo, por un dato inesperado o un corte de conexión), la página se quedaba en blanco sin salida. Ahora aparece, dentro del diseño normal y con el menú, un aviso en el idioma del usuario ("Algo ha fallado al mostrar esta página") con dos botones: Reintentar e Ir al inicio. Probado forzando un error en una página temporal (ya borrada).

## 34. Sin conexión ya no parece que "no hay nada"
Si fallaba la carga del muro, de los tanques, de una categoría del foro o del mercado (cobertura mala en el móvil, un corte de Supabase), la web decía "Todavía no hay publicaciones" o "No hay tanques", como si estuviera vacía. Ahora dice "No se ha podido cargar. Comprueba tu conexión y vuelve a intentarlo" con un botón Reintentar, en los 8 idiomas. Si falla al cargar más publicaciones con el scroll, se conserva lo ya cargado y aparece un botón para reintentar. Probado simulando un corte de conexión en el navegador.

## 35. Foro: "¿Ya se ha preguntado?" al escribir un hilo nuevo
Mientras escribes el título de un hilo nuevo, aparecen hasta 3 hilos que ya existen con esas palabras (primero los que más coinciden y los resueltos), con el aviso "¿Ya se ha preguntado? Mira estos hilos antes de publicar". Así quien pregunta encuentra antes la respuesta y el foro no se llena de preguntas repetidas. Ignora palabras que no aportan ("cuántos", "acuario", "problema"…) y los hilos se abren en otra pestaña para no perder lo escrito. Ejemplo: "Mis neones pierden color" → "Gambas CRS pierden color" y "¿Cuántos neones mínimo?". _Probado contra la base de datos y visto en pantalla con una página temporal (ya borrada); el formulario completo requiere sesión._

## 36. La app instalada ya tiene página "sin conexión"
Si abrías Tankily (sobre todo instalada en el móvil) sin cobertura, salía la página de error del navegador (el dinosaurio). Ahora sale una pantalla con el logo, "Sin conexión" en el idioma de la página y un botón Reintentar; si vuelve la conexión, recarga sola. Lo hace un *service worker* mínimo que **solo** actúa cuando una página no se puede abrir por falta de red: no guarda contenido en caché, así que con conexión nunca se ve nada antiguo. Probado con el build de producción: apagando el servidor sale la pantalla (en alemán, en una página /de/) y al volver a encenderlo, Reintentar abre la página normal.

## 37. Gráficas de parámetros más claras y accesibles
- Los valores **fuera del rango recomendado** se pintan en color de aviso y el tooltip lo dice ("Fuera de rango"), para no depender solo del color.
- Con muchas mediciones (más de 40) ya no se dibuja un punto por cada una, que se amontonaban: se ve la línea, el último valor, los que están fuera de rango y el señalado con el ratón.
- Cada gráfica lleva su **tabla de datos para lectores de pantalla** (antes solo anunciaban el último valor).

## 38. Corregido: las tiendas Pro caducadas seguían saliendo las primeras
Cuando a una tienda se le acaba el Pro, su plan sigue marcado como "pro" en la base de datos hasta que alguien lo cambie. La tarjeta ya ocultaba el distintivo, pero la tienda **seguía apareciendo la primera del directorio**, conservaba las estadísticas Pro en "Gestionar tienda" y contaba como Pro en el panel de administración. Ahora hay una única regla ("es Pro si tiene el plan y no ha pasado la fecha de fin") que usan el directorio, la tarjeta, las estadísticas, la gestión y el resumen del panel. Con prueba automática (incluido que el último día todavía cuenta).

## 39. Auditoría de permisos: correcta
He revisado en la base de datos real qué puede cambiar cada usuario, buscando trampas típicas: nadie puede hacerse administrador editando su perfil, ni marcar su anuncio como destacado, ni fijar o cerrar hilos, ni cambiarse el plan Pro o la verificación de su tienda; no se puede reseñar la propia tienda ni reseñar dos veces la misma; y un tanque no se puede "pasar" a otro usuario. No he tenido que cambiar nada.

## 40. Freno antispam en la base de datos
Antes de abrir al público conviene que un bot o una cuenta abusiva no pueda inundar la web. Ahora la propia base de datos limita cuánto puede publicar cada usuario: 20 publicaciones por hora, 60 comentarios por hora, 8 hilos y 40 respuestas del foro por hora, 15 anuncios al día, 60 mensajes cada 10 minutos, 10 reseñas al día y 20 denuncias por hora. Un aficionado normal no llega nunca a esas cifras. Si alguien las supera, ve en su idioma "Vas muy rápido: espera unos minutos antes de volver a publicar". Como está en la base de datos, vale también para quien intente saltarse la web y usar la API directamente. Los administradores no tienen límite.
Probado con un usuario de demostración dentro de una transacción que luego se deshizo: publicó 20 y la 21.ª fue bloqueada; no quedó ningún rastro. Si algún límite se queda corto, se cambia en un minuto (dímelo).
De paso: si fallaba enviar un **comentario** o un **mensaje del chat**, no se avisaba de nada (el texto simplemente no aparecía). Ahora se muestra el motivo.

## 41. Privacidad: al borrar la cuenta se borra todo (también fotos y traducciones)
Al preparar el borrador de la política de privacidad (`docs/borrador-privacidad.md`, para que lo revises) comprobé que las traducciones automáticas guardadas **no se borraban** al borrar la publicación original, ni al eliminar una cuenta. Eso contradecía "al eliminarla se borran tu perfil y todo tu contenido". Ahora se borran a la vez (probado en una transacción de prueba que se deshizo). No había ninguna huérfana que limpiar. Comprobado además que las 20 tablas que guardan algo de un usuario (tanques, mensajes, reseñas, notificaciones, votos…) se borran con su cuenta.
**Las fotos tampoco se borraban**: las imágenes que sube cada usuario están en el almacenamiento de archivos, que no se borra en cascada con la base de datos. Ahora, al eliminar la cuenta, primero se borran todas sus fotos y después la cuenta. Para que eso funcionase he tenido que añadir un permiso que deja a cada usuario ver *solo su propia carpeta* (probado: ve sus archivos y ninguno de los de otros). También se borran las fotos de una publicación o un anuncio cuando se elimina. _El borrado de fotos no lo he podido probar con una cuenta real; si falla, el contenido o la cuenta se eliminan igualmente._
El borrador cubre lo que la política actual no menciona: traducción automática (MyMemory/DeepL), acceso con Google/Apple/Facebook/Microsoft, idioma guardado, freno antispam y almacenamiento en el dispositivo.

## 42. Las herramientas, a mano desde WikiTank
WikiTank será la principal puerta de entrada desde Google. Bajo su buscador hay ahora accesos a "Qué especies", "Compatibilidad" y las calculadoras, para que quien llega a leer descubra lo que puede hacer con sus datos.

## 43. El plan Pro cumple lo que promete: anuncios destacados automáticos
La página del plan Pro promete "anuncios destacados en el mercado", pero en realidad un anuncio solo salía destacado si un administrador lo marcaba a mano. Ahora **los anuncios de una tienda con Pro vigente salen destacados solos** (primeros en el mercado y con el sello "Destacado") y dejan de estarlo cuando el Pro caduca; los que marques tú a mano siguen funcionando. Además, quien tiene tienda publica sus anuncios "como tienda" por defecto (antes había que marcar la casilla, y sin ella el anuncio no contaba como de la tienda). Probado contra la base de datos y en el mercado.
Y como el Pro también promete la "insignia de tienda verificada", el botón "Activar Pro" del panel de administración ahora también la verifica (quitar el Pro no quita la verificación, que es otra decisión).

## 44. Pulido visual (15/10, por la mañana, tras tus capturas)
- En todas las calculadoras, las cajas de una misma fila quedan alineadas aunque alguna etiqueta ocupe dos líneas (pasaba también en la de cambio de agua con "Nitratos del agua nueva").
- En "¿Qué peces puedo tener?", "Opcional" va como antetítulo pequeño encima de "Temperatura del agua" y "pH del agua", así los títulos quedan en línea.
- Las ubicaciones ya no se repiten cuando la ciudad y la provincia se llaman igual: "Madrid, Madrid, España" → "Madrid, España" (tiendas, anuncios y perfiles).
- En las categorías del foro, el botón "Abrir hilo" ya no cae debajo del título cuando la descripción es larga: se queda a la derecha, como en el resto de secciones.
- Los **perfiles** tienen ahora botón de compartir y, para visitantes sin cuenta, la misma invitación a registrarse que los tanques y las tiendas.
- El **diario del tanque** se ha rediseñado: va en un panel como el resto de pestañas, agrupado por meses y con un icono por tipo (gota para cambios de agua, embudo para el filtro, matraz para dosificación, tijeras para poda…). Antes eran puntos iguales pegados al borde.
- En el resumen de cada tanque, los parámetros del agua salen en el orden habitual de su tipo (en un reef: temperatura, salinidad, pH, KH, calcio, magnesio, nitrato, fosfato), en vez de en el orden en que se apuntaron.
- **Móvil**: en la ficha de un tanque, el nombre del dueño salía cortado ("L…") porque los botones ocupaban el sitio; ahora los botones bajan bajo el título. Revisadas también en móvil la portada y las herramientas, sin desbordes.
- **Dos fallos reales de diseño adaptable, corregidos:**
  - En el móvil, la página "Más" (la del menú inferior) mostraba solo iconos, sin texto: no se sabía qué era cada opción. La regla que deja el menú lateral en iconos se aplicaba también a esa lista.
  - En tablet (720–960 px), el menú lateral tenía los iconos aplastados a 8 px y el botón Entrar sin icono, por el relleno de los botones. Ahora se ven a su tamaño (20 px).
- **Títulos de pestaña** en las 14 páginas que no tenían (entrar, registro, mensajes, notificaciones, ajustes, nuevo tanque, publicar anuncio, abrir hilo, gestionar tienda, admin…), en los 8 idiomas. Con varias pestañas abiertas ya no salen todas como "Tankily — La comunidad de los acuarios". Además quedan marcadas para que Google no las indexe, porque son de cuenta.
- En la página del plan Pro, el recuadro "¿Marcas o distribuidores?" tiene ya el mismo ancho que los planes.
- Las dos herramientas nuevas tienen el mismo estilo: "Tipo de acuario" con su título en ambas, los tipos en una fila propia y todos los títulos de grupo con el mismo tamaño que los de los campos.

## 45. Falso aviso de salinidad en los reef, corregido
En el reef de la demo (35,1 ppt, la salinidad normal de cualquier arrecife) el panel de compatibilidad avisaba de que estaba "fuera de rango" para el pez payaso y la gamba pistolera. Las fichas de WikiTank dan la salinidad como densidad (1,023–1,025), que con la conversión exacta es ~31–33 ppt, pero entre aficionados 1,025–1,026 se lee como ~35 ppt. He subido el margen de tolerancia de la salinidad de 1,5 a 2 ppt: 35 ppt ya no avisa, y 38 o 27 siguen avisando (con prueba automática). En ese tanque, el panel dice ahora "Las 5 especies pueden convivir".

## 46. La web tiene en cuenta dónde está el usuario (15/10, a petición tuya)
**De dónde sale la ubicación:** del perfil si ha entrado (país y provincia) y, si no, se deduce el país de la zona horaria del navegador (y si no se reconoce, del idioma). No se pide permiso de GPS ni se usa ningún servicio externo. Antes solo se miraba el idioma, que fallaba mucho: un mexicano con el navegador en español salía como España.
- **Mercado y tiendas** se abren filtrados por el país del usuario, con el aviso "Anuncios en España · Ver todos los países". Solo si hay algo en su país; si no, se muestran todos, para que la web nunca parezca vacía. Si pulsa "Ver todos los países", se respeta durante la visita. Si alguien llega con un enlace que ya trae filtros, no se toca.
- **Directorio de tiendas**: con la provincia en el perfil, primero las de su provincia (y dentro, las Pro), que es lo que promete el plan Pro con "primeras posiciones en el directorio de tu zona".
- **"Tiendas cerca de ti"** en la columna de la portada: hasta 3 tiendas de su país, primero las de su provincia. Da visibilidad a las tiendas.
- **Unidades**: los galones y °F salen por defecto también a quien está en EE. UU. con el navegador en otro idioma.
- Ya se usaba antes para rellenar país, provincia y moneda al publicar un anuncio o dar de alta una tienda; ahora esa deducción también es más fiable.
Probado: en este ordenador (zona horaria de Madrid) detecta España; el mercado muestra los 9 anuncios españoles y, con "Ver todos", los 16. Tiene sus pruebas automáticas (zona horaria → país).

## 47. Ordenar por distancia y alcance de los envíos (15/10, a petición tuya)
**Más cerca.** En el mercado y en tiendas hay un botón "Más cerca" que ordena por distancia y muestra en cada tarjeta "a 12 km".
- **Desde dónde se mide:** la provincia del perfil del usuario o, si pulsa "Usar mi ubicación", su posición real (la pide el navegador, se redondea a ~1 km, solo se guarda en esa pestaña y nunca se envía a ningún sitio). Si no hay ninguna de las dos, se le explica cómo activarlo.
- **Dónde está cada cosa:** las tiendas, en su dirección real (convertida en coordenadas con OpenStreetMap al guardar la ficha; ya he situado las 4 de la demo, incluida la de México). Los anuncios de tienda usan la posición de la tienda. Los anuncios de particulares, en el centro de su provincia, nunca en su casa. Por eso a esos no se les pone falsa precisión: "en tu zona" si están cerca y "a ~270 km" si no.
- **Provincias:** de momento las de España (las 52, con sus nombres en las lenguas cooficiales: Vizcaya/Bizkaia, Gerona/Girona…). En otros países se sitúan las tiendas con coordenadas; los anuncios de particulares van al final sin distancia.
**Envíos.** Al publicar un anuncio con envío se elige hasta dónde: "solo mi provincia", "todo mi país" u "otros países también". Lo mismo las tiendas con venta online. Las tarjetas y la ficha dicen "Envía a todo el país" o "Envío internacional" en vez de solo "Envío". Los anuncios y tiendas que ya tenían envío han pasado a "todo el país".
Probado en el navegador simulando una ubicación en Madrid: mercado (Madrid → Zaragoza ~270 km → Valencia 300 km → Cantabria 340 km…) y tiendas (Madrid, Valencia, Santander, Ciudad de México). Con prueba automática de distancias y orden. _No he podido probar los formularios (requieren sesión) ni pulsar "Usar mi ubicación" de verdad: el permiso saldría en tu pantalla de casa._

## 48. WikiTank: una página por especie y un catálogo con filtros (15/10, a petición tuya)
Comparado con Fishipedia, lo que le faltaba a WikiTank no era tanto información como **estructura**: las especies no tenían página propia (se abrían en una ventana dentro de cada artículo, Google no las veía y no se podían compartir) y no había forma de ver todas juntas. Ahora:
- **Una página por especie** (`/wiki/especies/amphiprion-ocellaris/`): foto grande, nombre común y científico, **datos clave** a la vista (temperatura, pH, acuario mínimo, tamaño, dificultad, grupo, carácter, agua, apto para arrecife), la ficha completa, en qué tipos de acuario es habitual, **añadir a mi tanque** con comprobación, **tanques de la comunidad que la tienen**, enlace a la calculadora de compatibilidad y especies relacionadas. Con título y descripción para Google ("Neón Cardinal (Paracheirodon axelrodi): 23–28 °C, pH 4,5–7, acuario desde 80 l…") y datos estructurados.
- **Catálogo** (`/wiki/especies/`): las 167 especies con buscador (nombre común o científico, sin importar tildes), filtros por tipo, agua dulce/marina, dificultad, aptas para arrecife y pacíficas, y orden por nombre, dificultad, tamaño o litros.
- **Todo enlazado:** la ventana de cada especie en los artículos tiene "Ficha completa"; el buscador de WikiTank y las herramientas ("¿Qué peces puedo tener?", compatibilidad) llevan a la página de la especie; la portada de WikiTank tiene un acceso destacado al catálogo; y todo está en el sitemap (688 direcciones, antes 416).
- **Sin tocar los .md**: todo se genera al publicar a partir de las fichas. Si añades o cambias fichas, las páginas se actualizan solas. Las especies que salen en varios tipos de acuario son una sola página "habitual en" todos ellos.
- Leyendo las fichas he tenido que resolver formatos distintos: nombres al revés ("Corydoras Aeneus (Corydoras Bronce)"), plantas sin paréntesis y con mayúsculas, varios nombres separados por barras y variedades de koi y goldfish. Comprobado especie a especie en los casos dudosos.

**Lo que nos separa de Fishipedia es el número**: ellos tienen 2.314 especies y WikiTank 167. Eso es contenido (y el contenido de WikiTank es tuyo): lo he dejado en PENDIENTES. A cambio, WikiTank tiene algo que ellos no: datos de acuario utilizables (compatibilidad, litros, dificultad) y la comunidad detrás.
Build con 3.239 páginas (1.344 nuevas) y 0 enlaces rotos entre 99.355.

---

## 49. WikiTank: de 167 a 511 especies, contrastadas con GBIF y FishBase (15/10, a petición tuya)
- **344 fichas nuevas** (243 peces, 52 plantas, 20 corales y anémonas, 29 invertebrados): las más habituales en tiendas que faltaban, con el mismo formato que la wiki y texto propio. Van en una carpeta aparte, `especies/`, sin tocar la WikiTank; el catálogo las une a las de la wiki (si una especie está en las dos, manda la wiki) y las herramientas (compatibilidad, «qué especies encajan», «Añadir a mi tanque») ya las conocen: el índice ha pasado de 182 a 516 especies.
- **Comprobadas con fuentes externas**: cada nombre científico y familia contra GBIF (base de datos mundial de biodiversidad, datos abiertos) y, en los peces, temperatura, pH y tamaño contra FishBase. FishBase solo se ha usado como referencia, porque su licencia no permite copiar sus datos en una web con plan de pago, y respetando su límite de una consulta cada 10 segundos. Con eso he corregido unas 15 fichas. Cuando la ciencia ha cambiado un nombre (por ejemplo *Briareum violaceum* para los pólipos estrella verde), dejo como principal el de las tiendas y el nuevo como alternativo, para que la búsqueda encuentre los dos.
- **483 especies con foto**: las nuevas, y también las que no tenían en la wiki, salen de Wikimedia Commons. Solo se usan licencias que permiten uso comercial, y la ficha muestra autor y licencia bajo la foto, como exigen. He revisado todas a ojo y descartado 24 (dibujos antiguos, ejemplares de museo, conchas vacías); la herramienta no las vuelve a usar. Pesan 18 MB en total, en WebP.
- **Correcciones en la wiki existente** (solo en la lectura, sin tocar los textos): koi, goldfish de estanque y carpas ya cuentan como agua dulce, y la gamba «Taiwan Bee Blue Bolt» ya muestra su nombre científico.
- **Herramientas para seguir ampliándola**: `npm run especies:validar`, `npm run especies:fotos` y `npm run especies`. Explicado en CONTEXTO.md.
- La web pasa de 3.239 a 5.991 páginas y el mapa del sitio de 688 a 1.032 direcciones.

## 50. El servidor de desarrollo ya no se come la memoria
El servidor local se caía cada pocos minutos al llegar a 16 GB, incluso sin usarlo. La causa era la caché en disco de Next 16 (`turbopackFileSystemCacheForDev`): en este disco, que el propio Next detecta como lento, se quedaba trabajando en segundo plano con 9 núcleos y acumulando memoria. Desactivada solo en desarrollo; ahora se mantiene estable en 1 GB sin usar el procesador. La web publicada no cambia. También autoricé la recarga en vivo desde el móvil por la red de casa (`192.168.x.x`) y por el túnel.

## 51. WikiTank: de 511 a 1.848 especies (16/10, a petición tuya)
- **1.681 fichas en `especies/`** (1.250 peces, 187 plantas, 134 corales y anémonas, 110 invertebrados), escritas a mano con el formato de la wiki y repartidas en 25 archivos por grupo (tetras, corydoras, plecos, Malawi, Tanganica, killis, marinos, corales duros y blandos…). El estado de cada grupo está en `especies/PLAN.md`. La WikiTank no se ha tocado.
- **Contrastadas como las anteriores**: nombre y familia con GBIF, y temperatura, pH y tamaño de los peces con FishBase, solo como referencia. He corregido unas 40 fichas. Cuando GBIF da un nombre más reciente, la ficha muestra los dos (por ejemplo *Chindongo saulosi / Pseudotropheus saulosi*), para que la búsqueda encuentre cualquiera de ellos.
- **Especies retiradas por legales**: no hay ninguna especie de las listas de invasoras de la UE ni del catálogo español. He quitado *Gambusia holbrooki*, *Silurus glanis*, el rutilo, el alburno y la perca europea. **Ojo**: la WikiTank original incluye el caracol manzana (*Pomacea bridgesii*, «Caracol Misterio»), cuyo comercio está prohibido en la UE, y menciona *Caulerpa taxifolia*. No los he tocado porque son textos tuyos, pero convendría quitarlos o avisar en la ficha.
- **1.507 especies con foto**. Todas son de Wikimedia Commons con licencia que permite uso comercial, y llevan el autor y la licencia bajo la foto. He revisado una a una más de 1.200 descargas y descartado 221: dibujos antiguos, ejemplares de museo con regla o etiqueta, conchas vacías, corales muertos, fotos de otra especie y hasta un tucán. Las especies que solo tienen fotos así se quedan sin foto. La herramienta ya filtra por sí sola los ilustradores clásicos y no usa la foto de la especie silvestre para variedades de cultivo.
- El índice de la wiki y las herramientas (compatibilidad, «qué encaja», «Añadir a mi tanque») ya conocen todas las especies.

## Cómo lo he comprobado
- Build de producción correcto (5.991 páginas, 0 enlaces internos rotos), lint, traducciones y las 30 pruebas automáticas sin errores tras cada bloque.
- Cada pantalla revisada en el navegador; las que requieren sesión, con una sesión simulada en páginas temporales que he borrado.
- Permisos de base de datos probados como visitante anónimo.

## Lo que no he podido probar
- Acciones con una sesión real (añadir a tanque desde la wiki, panel admin con datos privados, estadísticas de una tienda Pro con tu cuenta, el cálculo automático de litros al crear un tanque y que el idioma quede guardado al registrarse), porque no puedo entrar con una cuenta. La lógica reutiliza piezas ya probadas.
- Las plantillas de email solo las he visto renderizadas aquí; hasta pegarlas en Supabase y mandar un email de prueba no se puede confirmar cómo las muestra cada cliente de correo.

## Cambios en la base de datos (ya aplicados en Supabase)
- `20261013160000_admin_y_estadisticas.sql`: funciones `admin_tienda`, `admin_hilo`, `admin_anuncio`, `admin_resumen`; tabla `tienda_visitas` y función `registrar_visita_tienda`.
- `20261013170000_politicas_sin_duplicar.sql`: reglas de acceso separadas por operación (rendimiento).
- `20261013180000_anuncios_guardados.sql`: tabla de anuncios guardados.
- `20261015090000_pro_caducado.sql`: el resumen del panel de administración ya no cuenta como Pro las tiendas caducadas.
- `20261015100000_limite_frecuencia.sql`: freno antispam (función `limitar_frecuencia` y sus triggers) e índices para que los recuentos sean rápidos.
- `20261015110000_borrar_traducciones.sql`: las traducciones guardadas se borran al borrar el contenido original.
- `20261015120000_media_ver_lo_mio.sql`: cada usuario puede listar (solo) su carpeta de imágenes, necesario para borrarlas al eliminar la cuenta.
- `20261015130000_anuncios_destacados_pro.sql`: campo calculado `destacado_ahora` (destacado por un admin o de una tienda con Pro vigente).
- `20261015140000_envios_y_distancia.sql`: alcance del envío en anuncios y tiendas, y coordenadas de las tiendas.

## Nota técnica
El servidor de desarrollo se quedaba sin memoria por la caché en disco de Next; resuelto (sección 50). Si alguna vez una página da «no encontrado» en local tras generar la versión de producción con el servidor encendido, ciérralo, borra la carpeta `.next` y vuelve a arrancarlo. No afecta a la web publicada, que es estática.
