"use client";

import { useState } from 'react';
import { Check, CheckCheck, Clock, Languages } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { formatRelativeTime, formatFecha } from '@/lib/formatRelativeTime';
import { useTraduccion } from '@/lib/traduccion';

// Piezas del chat compartidas por la página /mensajes/ y el chat flotante.

// Nombre de un idioma en el de la interfaz ("pt" → "portugués")
function nombreIdioma(codigo, lang) {
  try { return new Intl.DisplayNames([lang], { type: 'language' }).of(codigo); } catch { return codigo; }
}

// Mensaje tuyo: texto y pie (hora + reloj / check / doble check). Si la otra persona usa la web en otro idioma
// (destino), en el pie sale "Ver en portugués", que alterna tu original con la traducción que le llega.
export function MensajePropio({ m, destino }) {
  const { t, lang } = useT();
  const [verla, setVerla] = useState(false);
  // Mientras se envía no tiene id ni idioma: no se traduce
  const { necesita, estado, traducido } = useTraduccion({ tabla: 'mensajes', id: m.enviando ? null : m.id, texto: m.contenido, idioma: m.idioma }, destino);
  const lista = necesita && estado === 'listo';
  const idioma = destino ? nombreIdioma(destino, lang) : '';
  const ayuda = verla ? `${t('trad.asiLeLlega', { idioma })} · ${t('trad.verOriginal')}` : `${t('trad.leLlega', { idioma })} · ${t('trad.verComoLlega')}`;
  return (
    <>
      <p className="prosa">{verla && lista ? traducido : m.contenido}</p>
      <span className="burbuja-pie mini">
        {lista && (
          <button type="button" className={`boton-idioma${verla ? ' activo' : ''}`} onClick={() => setVerla(!verla)} title={ayuda} aria-pressed={verla}>
            <Languages size={12} aria-hidden="true" />{verla ? t('trad.verOriginal') : t('trad.verEn', { idioma })}
          </button>
        )}
        {formatRelativeTime(m.creado_en)}<MarcaEnvio m={m} />
      </span>
    </>
  );
}

// Estado de un mensaje propio: reloj mientras se envía, un check al llegar al servidor y doble check al leerlo
export function MarcaEnvio({ m }) {
  const { t } = useT();
  const [Icono, clave] = m.enviando ? [Clock, 'enviando'] : m.leido ? [CheckCheck, 'leido'] : [Check, 'enviado'];
  return <Icono size={14} className={`marca-envio ${clave}`} aria-label={t(`chat.${clave}`)} />;
}

// Debajo del nombre: "En línea", "Últ. vez hace 5 min" o, sin hora exacta, el último día que entró
// ("Últ. vez ayer"); si no se sabe nada, "Desconectado"
export function LineaConexion({ estado }) {
  const { t } = useT();
  if (!estado) return null;
  if (estado.enLinea) return <span className="linea-conexion en-linea mini">{t('chat.enLinea')}</span>;
  let texto = t('chat.desconectado');
  if (estado.vistoEn) {
    texto = estado.hace < 7 * 86400000
      ? t('chat.ultimaVez', { tiempo: formatRelativeTime(estado.vistoEn) })
      : t('chat.ultimaVezFecha', { fecha: formatFecha(estado.vistoEn) });
  } else if (estado.ultimoDia === 'hoy') texto = t('chat.vistoHoy');
  else if (estado.ultimoDia === 'ayer') texto = t('chat.vistoAyer');
  else if (estado.ultimoDia) texto = t('chat.ultimaVezFecha', { fecha: formatFecha(`${estado.ultimoDia}T12:00:00Z`) });
  return <span className="linea-conexion mini">{texto}</span>;
}

// Encima de donde se escribe: a qué idioma le llegan traducidos tus mensajes (solo si no es el tuyo)
export function AvisoTraduccion({ estado }) {
  const { t, lang } = useT();
  if (!estado?.idioma || estado.idioma === lang) return null;
  const idioma = nombreIdioma(estado.idioma, lang);
  return <p className="aviso-traduccion-chat mini"><Languages size={13} aria-hidden="true" /> {t('chat.traducidoA', { idioma })}</p>;
}
