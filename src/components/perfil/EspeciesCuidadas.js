"use client";

import { useMemo } from 'react';
import { Fish, Sprout, Shell, Flower2, Turtle, ExternalLink } from 'lucide-react';
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { Avatar, Modal } from '@/components/ui';
import { especieDe } from '@/lib/compatibilidad';

const ICONO = { pez: Fish, planta: Sprout, invertebrado: Shell, coral: Flower2, anfibio: Turtle };
const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// La misma especie en varios tanques cuenta una vez (misma regla que el contador del perfil)
const claveEspecie = (h) => normalizar(h.nombre_cientifico || h.nombre);

// "Especies que cuida": cada especie con su foto de WikiTank, ejemplares, tanques y enlace a la ficha.
// Se carga aparte (dynamic import en el perfil) porque usa el índice de especies de la wiki.
export default function EspeciesCuidadas({ perfil, habitantes, tanques, onCerrar }) {
  const { t, locale } = useT();
  const especies = useMemo(() => {
    const nombreTanque = Object.fromEntries(tanques.map((tq) => [tq.id, tq]));
    const grupos = new Map();
    for (const h of habitantes) {
      const k = claveEspecie(h);
      const g = grupos.get(k) || { clave: k, h, ejemplares: 0, tanques: new Map() };
      g.ejemplares += h.cantidad || 1;
      if (nombreTanque[h.tanque_id]) g.tanques.set(h.tanque_id, nombreTanque[h.tanque_id]);
      grupos.set(k, g);
    }
    return [...grupos.values()]
      .map((g) => ({ ...g, wiki: especieDe(g.h) }))
      .sort((a, b) => (a.wiki?.comun || a.h.nombre).localeCompare(b.wiki?.comun || b.h.nombre, locale));
  }, [habitantes, tanques, locale]);
  const lista = new Intl.ListFormat(locale, { type: 'conjunction' });

  return (
    <Modal titulo={t('seguimiento.especiesTitulo')} icono={<Avatar perfil={perfil} tamano={32} />} onCerrar={onCerrar} ancho={540}>
      <div className="seguimientos-lista">
        {especies.length === 0 && <p className="pequeno texto-3" style={{ padding: '24px 4px', textAlign: 'center' }}>{t('seguimiento.vacioEspecies')}</p>}
        {especies.map(({ clave, h, wiki, ejemplares, tanques: enTanques }) => {
          const Icono = ICONO[h.categoria] || Fish;
          const nombre = wiki?.comun || h.nombre;
          // El científico solo si aporta algo (si no hay nombre común, ya es el nombre que se muestra)
          const candidato = h.nombre_cientifico || wiki?.nombre;
          const cientifico = candidato && normalizar(candidato) !== normalizar(nombre) ? candidato : null;
          return (
            <div key={clave} className="seguimientos-fila">
              <span className="seguimientos-quien">
                <span className="seguimientos-tanque especie-miniatura">
                  {wiki?.imagen ? <img src={encodeURI(wiki.imagen)} alt="" loading="lazy" /> : <Icono size={20} aria-hidden />}
                </span>
                <span>
                  <strong>{nombre}</strong>
                  {cientifico && <em className="mini texto-3">{cientifico}</em>}
                  <span className="mini texto-3">
                    {t('seguimiento.ejemplares', { n: ejemplares })}
                    {enTanques.size > 0 && ` · ${t('seguimiento.enTanques', { lista: lista.format([...enTanques.values()].map((tq) => tq.nombre)) })}`}
                  </span>
                </span>
              </span>
              {wiki?.slug && (
                <Link href={`/wiki/especies/${wiki.slug}/`} className="btn btn-s btn-fantasma" onClick={onCerrar} aria-label={`${t('seguimiento.verFicha')}: ${nombre}`}>
                  <ExternalLink size={14} aria-hidden /> {t('seguimiento.verFicha')}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
