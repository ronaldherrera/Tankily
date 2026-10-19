// Avisos por email (mensajes nuevos, respuestas en el foro y resumen semanal).
// La llama pg_cron cada 15 minutos ({ tipo: 'rapidos' }) y los lunes ({ tipo: 'resumen' }) con la cabecera
// x-avisos (clave compartida guardada en Vault y en el secreto AVISOS_CLAVE). Qué enviar lo decide la base
// de datos (avisos_por_enviar); aquí solo se redacta y se envía por SMTP desde krill@tankily.com.
//
// También atiende la baja de un clic de Gmail/Outlook (List-Unsubscribe-Post): POST ?baja=<token>&tipo=<tipo>.
//
// Secretos: AVISOS_CLAVE (node scripts/clave_avisos.mjs) y SMTP_PASS (contraseña del buzón krill@tankily.com).
// Se despliega sin verificación JWT (supabase/config.toml): la protege la clave compartida.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const SITIO = 'https://tankily.com';
const FUNCION = `${Deno.env.get('SUPABASE_URL')}/functions/v1/avisos`;
const REMITENTE = 'krill@tankily.com';
const MAXIMO = 300; // correos por ejecución, para no pasar del límite diario del buzón
const C = { fondo: '#eef6fa', tarjeta: '#ffffff', tinta: '#0b1f33', texto: '#3c5266', suave: '#7a8fa3', ola: '#4fc3e8', boton: '#0b1f33' };

type Fila = { usuario_id: string; email: string; idioma: string; baja: string; total: number; actores: string[] | null; detalle: Record<string, any> | null };
type Tipo = 'mensajes' | 'foro' | 'resumen';

// Textos de los correos. {a} = quién escribe, {h} = título del hilo
const T: Record<string, any> = {
  es: {
    mensajes: { asunto: 'Tienes mensajes nuevos de {a}', titulo: 'Mensajes nuevos', texto: '{a} te ha escrito en Tankily.', boton: 'Ver mensajes' },
    foro: { asunto: 'Nuevas respuestas en «{h}»', titulo: 'Respuestas en el foro', texto: '{a} ha respondido en «{h}».', boton: 'Ver respuestas' },
    resumen: { asunto: 'Tu semana en Tankily', titulo: 'Tu semana en Tankily', texto: 'Esto es lo que te espera:', boton: 'Abrir Tankily' },
    lineas: { mensajes: 'Mensajes sin leer', tareas: 'Tareas de mantenimiento esta semana', me_gusta: 'Me gusta', comentario: 'Comentarios', seguidor: 'Seguidores nuevos', eco: 'Ecos', mencion: 'Menciones', respuesta_foro: 'Respuestas en el foro', solucion: 'Soluciones aceptadas', resena: 'Reseñas de tu tienda', seguidor_tanque: 'Seguidores de tus tanques' },
    pie: 'Recibes este correo porque tienes activados los avisos por email.', ajustes: 'Elegir avisos', baja: 'No quiero más correos así', lema: 'La comunidad de los acuarios',
  },
  en: {
    mensajes: { asunto: 'You have new messages from {a}', titulo: 'New messages', texto: '{a} wrote to you on Tankily.', boton: 'View messages' },
    foro: { asunto: 'New replies in “{h}”', titulo: 'Forum replies', texto: '{a} replied in “{h}”.', boton: 'View replies' },
    resumen: { asunto: 'Your week on Tankily', titulo: 'Your week on Tankily', texto: 'Here’s what’s waiting for you:', boton: 'Open Tankily' },
    lineas: { mensajes: 'Unread messages', tareas: 'Maintenance tasks this week', me_gusta: 'Likes', comentario: 'Comments', seguidor: 'New followers', eco: 'Reposts', mencion: 'Mentions', respuesta_foro: 'Forum replies', solucion: 'Accepted solutions', resena: 'Shop reviews', seguidor_tanque: 'Tank followers' },
    pie: 'You’re getting this email because email notifications are on.', ajustes: 'Choose notifications', baja: 'Stop these emails', lema: 'The aquarium community',
  },
  de: {
    mensajes: { asunto: 'Neue Nachrichten von {a}', titulo: 'Neue Nachrichten', texto: '{a} hat dir auf Tankily geschrieben.', boton: 'Nachrichten ansehen' },
    foro: { asunto: 'Neue Antworten in „{h}“', titulo: 'Antworten im Forum', texto: '{a} hat in „{h}“ geantwortet.', boton: 'Antworten ansehen' },
    resumen: { asunto: 'Deine Woche auf Tankily', titulo: 'Deine Woche auf Tankily', texto: 'Das wartet auf dich:', boton: 'Tankily öffnen' },
    lineas: { mensajes: 'Ungelesene Nachrichten', tareas: 'Wartungsaufgaben diese Woche', me_gusta: 'Gefällt mir', comentario: 'Kommentare', seguidor: 'Neue Follower', eco: 'Reposts', mencion: 'Erwähnungen', respuesta_foro: 'Antworten im Forum', solucion: 'Akzeptierte Lösungen', resena: 'Shop-Bewertungen', seguidor_tanque: 'Follower deiner Becken' },
    pie: 'Du erhältst diese E-Mail, weil deine E-Mail-Benachrichtigungen aktiv sind.', ajustes: 'Benachrichtigungen wählen', baja: 'Keine solchen E-Mails mehr', lema: 'Die Aquarium-Community',
  },
  pt: {
    mensajes: { asunto: 'Você tem mensagens novas de {a}', titulo: 'Mensagens novas', texto: '{a} escreveu para você no Tankily.', boton: 'Ver mensagens' },
    foro: { asunto: 'Novas respostas em “{h}”', titulo: 'Respostas no fórum', texto: '{a} respondeu em “{h}”.', boton: 'Ver respostas' },
    resumen: { asunto: 'Sua semana no Tankily', titulo: 'Sua semana no Tankily', texto: 'Veja o que espera por você:', boton: 'Abrir o Tankily' },
    lineas: { mensajes: 'Mensagens não lidas', tareas: 'Tarefas de manutenção desta semana', me_gusta: 'Curtidas', comentario: 'Comentários', seguidor: 'Novos seguidores', eco: 'Ecos', mencion: 'Menções', respuesta_foro: 'Respostas no fórum', solucion: 'Soluções aceitas', resena: 'Avaliações da sua loja', seguidor_tanque: 'Seguidores dos seus aquários' },
    pie: 'Você recebe este e-mail porque os avisos por e-mail estão ativados.', ajustes: 'Escolher avisos', baja: 'Não quero mais e-mails assim', lema: 'A comunidade dos aquários',
  },
  fr: {
    mensajes: { asunto: 'Nouveaux messages de {a}', titulo: 'Nouveaux messages', texto: '{a} t’a écrit sur Tankily.', boton: 'Voir les messages' },
    foro: { asunto: 'Nouvelles réponses dans « {h} »', titulo: 'Réponses sur le forum', texto: '{a} a répondu dans « {h} ».', boton: 'Voir les réponses' },
    resumen: { asunto: 'Ta semaine sur Tankily', titulo: 'Ta semaine sur Tankily', texto: 'Voici ce qui t’attend :', boton: 'Ouvrir Tankily' },
    lineas: { mensajes: 'Messages non lus', tareas: 'Tâches d’entretien cette semaine', me_gusta: 'J’aime', comentario: 'Commentaires', seguidor: 'Nouveaux abonnés', eco: 'Échos', mencion: 'Mentions', respuesta_foro: 'Réponses sur le forum', solucion: 'Solutions acceptées', resena: 'Avis sur ta boutique', seguidor_tanque: 'Abonnés à tes bacs' },
    pie: 'Tu reçois cet e-mail car les notifications par e-mail sont activées.', ajustes: 'Choisir les notifications', baja: 'Ne plus recevoir ces e-mails', lema: 'La communauté des aquariums',
  },
  it: {
    mensajes: { asunto: 'Hai nuovi messaggi da {a}', titulo: 'Nuovi messaggi', texto: '{a} ti ha scritto su Tankily.', boton: 'Vedi i messaggi' },
    foro: { asunto: 'Nuove risposte in «{h}»', titulo: 'Risposte nel forum', texto: '{a} ha risposto in «{h}».', boton: 'Vedi le risposte' },
    resumen: { asunto: 'La tua settimana su Tankily', titulo: 'La tua settimana su Tankily', texto: 'Ecco cosa ti aspetta:', boton: 'Apri Tankily' },
    lineas: { mensajes: 'Messaggi non letti', tareas: 'Attività di manutenzione questa settimana', me_gusta: 'Mi piace', comentario: 'Commenti', seguidor: 'Nuovi follower', eco: 'Echi', mencion: 'Menzioni', respuesta_foro: 'Risposte nel forum', solucion: 'Soluzioni accettate', resena: 'Recensioni del negozio', seguidor_tanque: 'Follower delle tue vasche' },
    pie: 'Ricevi questa email perché hai attivato gli avvisi via email.', ajustes: 'Scegli gli avvisi', baja: 'Non voglio più queste email', lema: 'La community degli acquari',
  },
  nl: {
    mensajes: { asunto: 'Nieuwe berichten van {a}', titulo: 'Nieuwe berichten', texto: '{a} heeft je geschreven op Tankily.', boton: 'Berichten bekijken' },
    foro: { asunto: 'Nieuwe reacties in ‘{h}’', titulo: 'Reacties op het forum', texto: '{a} heeft gereageerd in ‘{h}’.', boton: 'Reacties bekijken' },
    resumen: { asunto: 'Jouw week op Tankily', titulo: 'Jouw week op Tankily', texto: 'Dit staat voor je klaar:', boton: 'Tankily openen' },
    lineas: { mensajes: 'Ongelezen berichten', tareas: 'Onderhoudstaken deze week', me_gusta: 'Likes', comentario: 'Reacties', seguidor: 'Nieuwe volgers', eco: 'Reposts', mencion: 'Vermeldingen', respuesta_foro: 'Reacties op het forum', solucion: 'Geaccepteerde oplossingen', resena: 'Winkelbeoordelingen', seguidor_tanque: 'Volgers van je aquaria' },
    pie: 'Je krijgt deze e-mail omdat e-mailmeldingen aanstaan.', ajustes: 'Meldingen kiezen', baja: 'Geen e-mails zoals deze meer', lema: 'De aquariumcommunity',
  },
  pl: {
    mensajes: { asunto: 'Masz nowe wiadomości od {a}', titulo: 'Nowe wiadomości', texto: '{a} napisał(a) do ciebie na Tankily.', boton: 'Zobacz wiadomości' },
    foro: { asunto: 'Nowe odpowiedzi w „{h}”', titulo: 'Odpowiedzi na forum', texto: '{a} odpowiedział(a) w „{h}”.', boton: 'Zobacz odpowiedzi' },
    resumen: { asunto: 'Twój tydzień w Tankily', titulo: 'Twój tydzień w Tankily', texto: 'Oto co na ciebie czeka:', boton: 'Otwórz Tankily' },
    lineas: { mensajes: 'Nieprzeczytane wiadomości', tareas: 'Zadania konserwacyjne w tym tygodniu', me_gusta: 'Polubienia', comentario: 'Komentarze', seguidor: 'Nowi obserwujący', eco: 'Udostępnienia', mencion: 'Wzmianki', respuesta_foro: 'Odpowiedzi na forum', solucion: 'Zaakceptowane rozwiązania', resena: 'Opinie o sklepie', seguidor_tanque: 'Obserwujący twoje akwaria' },
    pie: 'Otrzymujesz tę wiadomość, bo masz włączone powiadomienia e-mail.', ajustes: 'Wybierz powiadomienia', baja: 'Nie chcę więcej takich e-maili', lema: 'Społeczność akwarystów',
  },
};
const ORDEN_LINEAS = ['mensajes', 'tareas', 'respuesta_foro', 'solucion', 'mencion', 'comentario', 'seguidor', 'seguidor_tanque', 'me_gusta', 'eco', 'resena'];
const DESTINO: Record<Tipo, string> = { mensajes: '/mensajes/', foro: '/notificaciones/', resumen: '/' };

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rellenar = (s: string, v: Record<string, string>) => s.replace(/\{(\w)\}/g, (_, k) => v[k] ?? '');
const recortar = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function redactar(tipo: Tipo, f: Fila) {
  const lang = T[f.idioma] ? f.idioma : 'es';
  const t = T[lang];
  const v = { a: (f.actores || []).join(', '), h: recortar(String(f.detalle?.hilos?.[0] ?? '')) };
  const baja = `${SITIO}/${lang}/avisos/?baja=${f.baja}&tipo=${tipo}`;
  const url = `${SITIO}/${lang}${DESTINO[tipo]}`;

  let cuerpo = `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.texto};">${esc(rellenar(t[tipo].texto, v))}</p>`;
  let texto = rellenar(t[tipo].texto, v);
  if (tipo === 'resumen') {
    const cuentas: Record<string, number> = { ...(f.detalle?.avisos || {}), mensajes: f.detalle?.mensajes || 0, tareas: f.detalle?.tareas || 0 };
    const lineas = ORDEN_LINEAS.filter((k) => cuentas[k] > 0).map((k) => [t.lineas[k], cuentas[k]] as const);
    cuerpo = `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${C.texto};">${esc(t.resumen.texto)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${lineas.map(([n, c]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e3edf3;font-size:15px;color:${C.texto};">${esc(n)}</td><td style="padding:8px 0;border-bottom:1px solid #e3edf3;font-size:15px;font-weight:700;color:${C.tinta};text-align:right;">${c}</td></tr>`).join('')}</table>`;
    texto = `${t.resumen.texto}\n${lineas.map(([n, c]) => `· ${n}: ${c}`).join('\n')}`;
  }

  const html = `<!doctype html>
<html lang="${lang}"><body style="margin:0;padding:0;background:${C.fondo};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};padding:32px 16px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
    <tr><td style="padding:0 8px 16px;"><a href="${SITIO}/${lang}/" style="text-decoration:none;"><img src="${SITIO}/icons/icon-192.png" width="40" height="40" alt="Tankily" style="display:block;border:0;border-radius:10px;"></a></td></tr>
    <tr><td style="background:${C.tarjeta};border-radius:18px;padding:32px 28px;border-top:4px solid ${C.ola};">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:${C.tinta};font-weight:700;">${esc(t[tipo].titulo)}</h1>
      ${cuerpo}
      <p style="margin:0;"><a href="${url}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${C.boton};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${esc(t[tipo].boton)}</a></p>
    </td></tr>
    <tr><td style="padding:16px 8px 0;font-size:12px;line-height:1.6;color:${C.suave};text-align:center;">
      ${esc(t.pie)}<br><a href="${SITIO}/${lang}/avisos/" style="color:${C.suave};">${esc(t.ajustes)}</a> · <a href="${baja}" style="color:${C.suave};">${esc(t.baja)}</a><br>Tankily · ${esc(t.lema)}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  return {
    asunto: rellenar(t[tipo].asunto, v),
    html,
    texto: `${t[tipo].titulo}\n\n${texto}\n\n${t[tipo].boton}: ${url}\n\n—\n${t.pie}\n${t.ajustes}: ${SITIO}/${lang}/avisos/\n${t.baja}: ${baja}`,
    unsubscribe: `${FUNCION}?baja=${f.baja}&tipo=${tipo}`,
  };
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const params = new URL(req.url).searchParams;

  // Baja de un clic desde el gestor de correo
  const token = params.get('baja');
  if (token) {
    if (req.method !== 'POST') return Response.redirect(`${SITIO}/es/avisos/?baja=${encodeURIComponent(token)}&tipo=${encodeURIComponent(params.get('tipo') || 'todo')}`, 302);
    if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response('', { status: 400 });
    await sb.rpc('baja_avisos', { p_token: token, p_tipo: params.get('tipo') || 'todo' });
    return new Response('ok');
  }

  const clave = Deno.env.get('AVISOS_CLAVE');
  if (req.method !== 'POST' || !clave || req.headers.get('x-avisos') !== clave) return new Response('', { status: 401 });

  const { tipo } = await req.json().catch(() => ({}));
  const tipos: Tipo[] = tipo === 'resumen' ? ['resumen'] : ['mensajes', 'foro'];

  const correo = nodemailer.createTransport({
    host: 'smtp.hostinger.com', port: 465, secure: true,
    auth: { user: REMITENTE, pass: Deno.env.get('SMTP_PASS') },
  });

  const resultado: Record<string, { enviados: number; fallos: number }> = {};
  let enviados = 0;
  for (const t of tipos) {
    resultado[t] = { enviados: 0, fallos: 0 };
    const { data, error } = await sb.rpc('avisos_por_enviar', { p_tipo: t });
    if (error) { console.error(t, error.message); continue; }
    for (const f of (data || []) as Fila[]) {
      if (enviados >= MAXIMO) break;
      const m = redactar(t, f);
      try {
        await correo.sendMail({
          from: { name: 'Tankily', address: REMITENTE },
          to: f.email,
          subject: m.asunto,
          text: m.texto,
          html: m.html,
          headers: { 'List-Unsubscribe': `<${m.unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        });
        await sb.rpc('avisos_enviado', { p_usuario: f.usuario_id, p_tipo: t });
        resultado[t].enviados++;
        enviados++;
      } catch (e) {
        console.error('envío', t, (e as Error).message);
        resultado[t].fallos++;
      }
    }
  }
  correo.close();
  return new Response(JSON.stringify(resultado), { headers: { 'Content-Type': 'application/json' } });
});
