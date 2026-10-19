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
          ['Qué datos tratamos', 'Email y contraseña (cifrada) para tu cuenta; los datos de perfil que decidas añadir (nombre, foto, país, región, biografía); el contenido que publicas (tanques, mediciones, fotos, mensajes, anuncios, reseñas) y datos técnicos mínimos para la seguridad del servicio. Si entras con Google o con Apple, recibimos de ellos tu nombre, tu email (con Apple puedes ocultarlo y recibimos una dirección de reenvío) y, en el caso de Google, tu foto de perfil; puedes desvincularlo borrando tu cuenta.'],
          ['Para qué', 'Prestar el servicio que solicitas al registrarte (base legal: ejecución del contrato), mantener la seguridad y moderar contenido (interés legítimo) y, solo si lo aceptas, mostrar publicidad personalizada (consentimiento).'],
          ['Con quién se comparten', 'Con los proveedores que nos ayudan a prestar el servicio: Supabase (base de datos y autenticación, servidores en la UE), Hostinger (alojamiento de la web y envío de los correos de tu cuenta, UE), los servicios de traducción automática MyMemory y DeepL (reciben solo el texto de publicaciones y comentarios que se traducen, sin datos de tu cuenta; UE) y, si aceptas las cookies de publicidad, Google AdSense. No vendemos tus datos.'],
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
          ['What data we process', 'Your email and (encrypted) password for your account; the profile details you choose to add (name, photo, country, region, bio); the content you post (tanks, measurements, photos, messages, listings, reviews) and minimal technical data to keep the service secure. If you sign in with Google or Apple, we receive your name and email from them (Apple lets you hide it, in which case we get a relay address) and, with Google, your profile photo; you can unlink it by deleting your account.'],
          ['Why', 'To provide the service you sign up for (legal basis: performance of a contract), to keep it secure and moderate content (legitimate interest) and, only if you agree, to show personalised ads (consent).'],
          ['Who we share it with', 'The providers that help us run the service: Supabase (database and authentication, EU servers), Hostinger (website hosting and sending your account emails, EU), the machine translation services MyMemory and DeepL (they only receive the text of posts and comments being translated, with no account data; EU) and, if you accept advertising cookies, Google AdSense. We do not sell your data.'],
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
