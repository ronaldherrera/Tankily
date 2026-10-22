import { identidadTitular } from '../../lib/titular.js';

// Titular: nombre, NIF y domicilio en src/lib/titular.js (lo vacío no se muestra)
const IDENTIDAD = identidadTitular();
// Textos legales. IMPORTANTE: los datos entre [corchetes] deben completarse con los del titular real
// antes de lanzar, y conviene que un profesional los revise. Son una base, no asesoría legal.
// La versión en inglés es una traducción de cortesía; para usuarios de EE. UU. (CCPA) habrá que ampliarla.

export const es = {
  legal: {
    otros: 'Documentos legales',
    docs: {
      'aviso-legal': {
        titulo: 'Aviso legal',
        secciones: [
          ['Titular del sitio', `En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE), se informa de que este sitio web es titularidad de ${IDENTIDAD}. Contacto: {email}.`],
          ['Objeto', 'Tankily es una comunidad en línea para aficionados a la acuariofilia: registro de acuarios y estanques, muro social, foro, compraventa entre particulares, directorio de tiendas y la enciclopedia WikiTank.'],
          ['Contenido de los usuarios', 'Cada usuario es responsable de lo que publica. Tankily no participa en las compraventas entre usuarios ni garantiza los productos anunciados, y retirará el contenido ilícito en cuanto tenga conocimiento efectivo de él (puedes avisarnos con el botón "Reportar").'],
          ['Propiedad intelectual', 'El diseño, la marca y los textos de WikiTank pertenecen a su titular. Los usuarios conservan los derechos sobre sus fotos y textos, y conceden a Tankily una licencia no exclusiva para mostrarlos dentro del servicio.'],
          ['Legislación aplicable', 'Este aviso se rige por la legislación española.'],
        ],
      },
      privacidad: {
        titulo: 'Política de privacidad',
        secciones: [
          ['Responsable', `${IDENTIDAD}. Contacto para privacidad: {email}.`],
          ['Qué datos tratamos', 'Email y contraseña (cifrada) para tu cuenta; los datos de perfil que decidas añadir (nombre, foto, país, región, biografía); el contenido que publicas (tanques, mediciones, fotos, mensajes, anuncios, reseñas) y datos técnicos mínimos para la seguridad del servicio. Si entras con Google o con Apple, recibimos de ellos tu nombre, tu email (con Apple puedes ocultarlo y recibimos una dirección de reenvío); puedes desvincularlo borrando tu cuenta.'],
          ['Para qué', 'Prestar el servicio que solicitas al registrarte (base legal: ejecución del contrato), mantener la seguridad y moderar contenido (interés legítimo) y, solo si lo aceptas, mostrar publicidad personalizada (consentimiento).'],
          ['Con quién se comparten', 'Con los proveedores que nos ayudan a prestar el servicio: Supabase (base de datos y autenticación, servidores en la UE), Hostinger (alojamiento de la web y envío de los correos de tu cuenta, UE), los servicios de traducción automática MyMemory y DeepL (reciben solo el texto de publicaciones, comentarios y mensajes privados que se traducen, sin datos de tu cuenta; UE; si tu navegador tiene el traductor integrado de Chrome, la traducción se hace en tu dispositivo y no se envía nada) y, si aceptas las cookies de publicidad, Google AdSense. No vendemos tus datos.'],
          ['Estadísticas y avisos', 'Para mejorar la web medimos las visitas con Umami (sin cookies ni datos personales: solo páginas, procedencia, país y tipo de dispositivo, de forma agregada; UE) y apuntamos qué días entras con tu cuenta, sin más detalle (interés legítimo). Si activas los avisos por email o las notificaciones push, usamos tu email o la suscripción de tu navegador solo para eso; el texto de cada notificación push pasa por el servicio de notificaciones de tu navegador (Google, Apple o Mozilla). Puedes desactivarlos cuando quieras en Avisos y notificaciones.'],
          ["Pagos y donaciones", "Si contratas un plan de pago o haces una donación, el pago lo gestiona Stripe (y Ko-fi en las donaciones). Nosotros solo recibimos el estado del pago, el periodo contratado y tu email, nunca los datos de tu tarjeta. Base legal: ejecución del contrato. Guardamos estos datos el tiempo que exija la normativa fiscal y contable."],
          ['Qué es público', 'Tu perfil, tus tanques públicos, publicaciones, hilos del foro, anuncios y reseñas son visibles para cualquiera. Los tanques marcados como privados o solo para seguidores, y los mensajes privados, no.'],
          ['Cuánto tiempo', 'Mientras mantengas la cuenta. Al eliminarla se borran tu perfil y todo tu contenido.'],
          ['Tus derechos', 'Puedes acceder, corregir, exportar y borrar tus datos desde Ajustes ("Descargar mis datos" y "Eliminar mi cuenta"), o escribirnos para ejercer cualquier otro derecho (limitación, oposición). También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es) o la autoridad de tu país.'],
        ],
      },
      cookies: {
        titulo: 'Política de cookies',
        secciones: [
          ['Cookies técnicas (siempre activas)', 'Guardan tu sesión y tus preferencias (tema, idioma, unidades y tu elección sobre cookies). Sin ellas no podrías entrar en tu cuenta. Se almacenan en el almacenamiento local de tu navegador.'],
          ['Cookies de publicidad (solo si aceptas)', 'Mostramos anuncios de Google AdSense. La primera vez que entras, el gestor de consentimiento de Google (certificado por IAB Europe) te pregunta si aceptas cookies para anuncios personalizados. Si no aceptas, se muestran anuncios no personalizados, que no usan tu historial.'],
          ['Cómo cambiar tu elección', 'Puedes cambiarla en cualquier momento desde el enlace de privacidad y cookies que muestra el aviso de Google, o borrando los datos de este sitio en tu navegador para volver a ver el aviso.'],
        ],
      },
      planes: {
        titulo: "Condiciones de los planes de pago",
        secciones: [
          ["Qué son", "Tankily es gratuito para los aficionados y para las tiendas con una ficha básica. Los planes de pago (hoy, el plan Pro) añaden ventajas de visibilidad para tiendas y profesionales. Las ventajas y el precio de cada plan son los que se publican en la página de planes (tiendas/pro) en el momento de contratarlo. Podremos crear nuevos planes con otras ventajas y precios; estas condiciones se aplican a todos ellos."],
          ["Quién puede contratarlos", "El titular de una ficha de tienda en Tankily, que contrata en el ámbito de su actividad profesional o comercial. Al contratar declaras que los datos de tu tienda son reales y que tienes capacidad para hacerlo en su nombre."],
          ["Precio y pago", "Los precios se indican en euros y se muestran antes de pagar. El pago es por adelantado, con tarjeta, Apple Pay o Google Pay, a través de Stripe, nuestro proveedor de pagos: Tankily no ve ni guarda los datos de tu tarjeta. Recibirás por email el recibo de cada cobro."],
          ["Duración y renovación", "Los planes son suscripciones mensuales o anuales y se renuevan automáticamente por el mismo periodo hasta que los canceles. Si cambiamos el precio, te avisaremos con al menos 30 días de antelación; el cambio nunca afecta al periodo que ya has pagado."],
          ["Cancelación", "Puedes cancelar cuando quieras, sin permanencia ni penalización, desde Gestionar mi tienda → Gestionar suscripción. La cancelación tiene efecto al final del periodo ya pagado: hasta entonces mantienes todas las ventajas y después la tienda vuelve al plan gratuito, con su ficha y su contenido intactos."],
          ["Devoluciones", "Los periodos ya iniciados no se reembolsan, salvo cobros por error o fallos graves del servicio atribuibles a Tankily. En esos casos, escríbenos a {email} y te devolveremos lo que corresponda."],
          ["Cobros fallidos", "Si un cobro falla, Stripe lo reintentará durante unos días y te avisaremos en tu panel para que puedas actualizar la tarjeta. Si no se resuelve, el plan termina al acabar el último periodo pagado."],
          ["Alcance de las ventajas", "Las ventajas de los planes mejoran la visibilidad de tu tienda en Tankily, pero no garantizan un número concreto de visitas, contactos o ventas. La insignia de tienda verificada indica que la tienda tiene un plan activo y ha aportado sus datos; podemos retirarla si los datos resultan falsos. Podemos mejorar o cambiar las ventajas; si retiramos alguna importante, te avisaremos y podrás cancelar con reembolso de la parte no disfrutada."],
          ["Uso correcto", "Se aplican las Normas de la comunidad. Si una tienda las incumple de forma grave o reiterada, podremos suspender su plan; salvo fraude o abuso, te devolveremos la parte proporcional no disfrutada."],
          ["Facturas", "Con cada pago recibirás el recibo de Stripe. Si necesitas una factura, escríbenos a {email}."],
          ["Cambios y ley aplicable", "Podemos actualizar estas condiciones; los cambios importantes te los avisaremos con al menos 30 días de antelación y podrás cancelar si no estás de acuerdo. Se rigen por la legislación española."],
          ["Contacto", "Para cualquier duda sobre tu plan: {email}."],
        ],
      },
      normas: {
        titulo: 'Normas de la comunidad',
        secciones: [
          ['Respeto', 'Aquí aprende todo el mundo. Nada de insultos, burlas a principiantes ni ataques personales.'],
          ['Bienestar animal', 'No se permite contenido que muestre o fomente el maltrato. Los animales vivos se venden y envían con garantías: bolsas adecuadas, temperatura y tiempos razonables.'],
          ['Especies protegidas e invasoras', 'Prohibido anunciar especies protegidas (CITES) o invasoras según la normativa de tu país sin la documentación exigida. En España, el Catálogo Español de Especies Exóticas Invasoras.'],
          ['Mercado honesto', 'Fotos reales, precio claro y estado verdadero. Marca tus anuncios como reservados o vendidos. Nada de reventa engañosa ni spam.'],
          ['Tiendas', 'Las tiendas pueden participar como cualquier usuario; la publicidad se hace a través de los espacios destinados a ello, no con spam en el foro o los comentarios.'],
          ['Moderación', 'Usa "Reportar" ante cualquier contenido que incumpla estas normas. Podemos retirar contenido y suspender cuentas que las incumplan.'],
        ],
      },
    },
  },
};

export const en = {
  legal: {
    otros: 'Legal documents',
    docs: {
      'aviso-legal': {
        titulo: 'Legal notice',
        secciones: [
          ['Site owner', `In accordance with Spanish Law 34/2002 on Information Society Services (LSSI-CE), this website is owned by ${IDENTIDAD}. Contact: {email}.`],
          ['Purpose', 'Tankily is an online community for fishkeeping hobbyists: aquarium and pond logs, a social feed, a forum, a person-to-person marketplace, a store directory and the WikiTank encyclopedia.'],
          ['User content', 'Each user is responsible for what they post. Tankily is not a party to sales between users and does not guarantee listed products. We remove unlawful content as soon as we become aware of it (you can tell us using the "Report" button).'],
          ['Intellectual property', 'The design, brand and WikiTank texts belong to the owner. Users keep the rights to their photos and texts and grant Tankily a non-exclusive licence to display them within the service.'],
          ['Governing law', 'This notice is governed by Spanish law.'],
        ],
      },
      privacidad: {
        titulo: 'Privacy policy',
        secciones: [
          ['Controller', `${IDENTIDAD}. Privacy contact: {email}.`],
          ['What data we process', 'Your email and (encrypted) password for your account; the profile details you choose to add (name, photo, country, region, bio); the content you post (tanks, measurements, photos, messages, listings, reviews) and minimal technical data to keep the service secure. If you sign in with Google or Apple, we receive your name and email from them (Apple lets you hide it, in which case we get a relay address); you can unlink it by deleting your account.'],
          ['Why', 'To provide the service you sign up for (legal basis: performance of a contract), to keep it secure and moderate content (legitimate interest) and, only if you agree, to show personalised ads (consent).'],
          ['Who we share it with', 'The providers that help us run the service: Supabase (database and authentication, EU servers), Hostinger (website hosting and sending your account emails, EU), the machine translation services MyMemory and DeepL (they only receive the text of posts, comments and private messages being translated, with no account data; EU; if your browser has the built-in Chrome translator, translation happens on your device and nothing is sent) and, if you accept advertising cookies, Google AdSense. We do not sell your data.'],
          ['Statistics and notifications', 'To improve the site we measure visits with Umami (no cookies or personal data: only pages, referrer, country and device type, in aggregate; EU) and record which days you visit with your account, with no further detail (legitimate interest). If you turn on email or push notifications, we use your email or your browser’s subscription only for that; the text of each push notification goes through your browser’s notification service (Google, Apple or Mozilla). You can turn them off at any time in Notifications.'],
          ["Payments and donations", "If you subscribe to a paid plan or make a donation, the payment is handled by Stripe (and Ko-fi for donations). We only receive the payment status, the plan period and your email, never your card details. Legal basis: performance of the contract. We keep this data for as long as tax and accounting rules require."],
          ['What is public', 'Your profile, public tanks, posts, forum threads, listings and reviews are visible to anyone. Private or followers-only tanks and private messages are not.'],
          ['How long', 'For as long as you keep your account. Deleting it removes your profile and all your content.'],
          ['Your rights', 'You can access, correct, export and delete your data from Settings ("Download my data" and "Delete my account"), or contact us to exercise any other right (restriction, objection). You can also complain to the Spanish Data Protection Agency (aepd.es) or your local authority.'],
        ],
      },
      cookies: {
        titulo: 'Cookie policy',
        secciones: [
          ['Technical cookies (always on)', 'They keep you signed in and store your preferences (theme, language, units and your cookie choice). Without them you could not log in. They are stored in your browser’s local storage.'],
          ['Advertising cookies (only if you agree)', 'We show Google AdSense ads. On your first visit, Google’s consent manager (certified by IAB Europe) asks whether you accept cookies for personalised ads. If you decline, you see non-personalised ads that don’t use your history.'],
          ['How to change your choice', 'You can change it at any time from the privacy and cookie link shown in Google’s message, or by clearing this site’s data in your browser to see the message again.'],
        ],
      },
      planes: {
        titulo: "Paid plan terms",
        secciones: [
          ["What they are", "Tankily is free for hobbyists and for stores with a basic listing. Paid plans (currently the Pro plan) add visibility benefits for stores and professionals. Each plan’s benefits and price are those published on the plans page (stores/pro) when you subscribe. We may create new plans with other benefits and prices; these terms apply to all of them."],
          ["Who can subscribe", "The owner of a store listing on Tankily, subscribing in the course of their business or professional activity. By subscribing you confirm that your store’s details are genuine and that you are authorised to act on its behalf."],
          ["Price and payment", "Prices are shown in euros before you pay. Payment is made in advance by card, Apple Pay or Google Pay through Stripe, our payment provider: Tankily never sees or stores your card details. You’ll receive a receipt by email for every charge."],
          ["Term and renewal", "Plans are monthly or yearly subscriptions and renew automatically for the same period until you cancel. If we change the price, we’ll give you at least 30 days’ notice; a change never affects a period you have already paid for."],
          ["Cancellation", "You can cancel at any time, with no commitment or penalty, from Manage my store → Manage subscription. Cancellation takes effect at the end of the period already paid: until then you keep all the benefits, and afterwards the store returns to the free plan with its listing and content intact."],
          ["Refunds", "Periods that have already started are not refunded, except for charges made in error or serious service failures attributable to Tankily. In those cases, write to {email} and we will refund what is due."],
          ["Failed payments", "If a payment fails, Stripe will retry it for a few days and we’ll let you know in your dashboard so you can update your card. If it isn’t resolved, the plan ends when the last paid period ends."],
          ["Scope of the benefits", "Plan benefits improve your store’s visibility on Tankily but do not guarantee a specific number of visits, contacts or sales. The verified store badge shows that the store has an active plan and has provided its details; we may remove it if those details turn out to be false. We may improve or change the benefits; if we remove an important one, we’ll let you know and you may cancel with a refund of the unused part."],
          ["Proper use", "The Community guidelines apply. If a store breaches them seriously or repeatedly, we may suspend its plan; except in cases of fraud or abuse, we will refund the unused part."],
          ["Invoices", "You’ll receive a Stripe receipt with every payment. If you need an invoice, write to {email}."],
          ["Changes and governing law", "We may update these terms; we’ll give you at least 30 days’ notice of important changes and you may cancel if you disagree. They are governed by Spanish law."],
          ["Contact", "For any question about your plan: {email}."],
        ],
      },
      normas: {
        titulo: 'Community guidelines',
        secciones: [
          ['Respect', 'Everyone here is learning. No insults, mocking beginners or personal attacks.'],
          ['Animal welfare', 'Content that shows or encourages animal abuse is not allowed. Live animals must be sold and shipped with proper care: suitable bags, temperature and reasonable transit times.'],
          ['Protected and invasive species', 'Listing protected (CITES) or invasive species under your country’s laws without the required paperwork is forbidden.'],
          ['Honest marketplace', 'Real photos, clear prices and truthful condition. Mark your listings as reserved or sold. No misleading resale or spam.'],
          ['Stores', 'Stores can take part like any other user; advertising goes through the dedicated ad spaces, not spam in the forum or comments.'],
          ['Moderation', 'Use "Report" for any content that breaks these guidelines. We may remove content and suspend accounts that break them.'],
        ],
      },
    },
  },
};
