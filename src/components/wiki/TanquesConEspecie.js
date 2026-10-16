"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from '@/components/Enlace';
import { supabase, AUTOR } from '@/lib/supabase';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { colorAgua, imagenTanque } from '@/lib/constantes';
import { especieDe } from '@/lib/compatibilidad';
import { nombresDe } from './AnadirATanque';

const MAXIMO = 6;

// Ficha de especie: enlace a la calculadora de compatibilidad y tanques visibles de la comunidad que la tienen. Une la wiki (que trae
// visitas de Google) con la red social. Si nadie la tiene, no ocupa sitio.
export default function TanquesConEspecie({ titulo }) {
  const { t } = useT();
  const u = useUnidades();
  const { comun, cientifico } = useMemo(() => nombresDe(titulo), [titulo]);
  const especie = useMemo(() => especieDe({ nombre: comun, nombre_cientifico: cientifico }), [comun, cientifico]);
  const [tanques, setTanques] = useState([]);

  useEffect(() => {
    let vigente = true;
    supabase.from('habitantes')
      .select(`cantidad, tanque:tanques!inner(id, nombre, tipo, litros, foto_url, ${AUTOR})`)
      .ilike('nombre_cientifico', cientifico)
      .order('creado_en', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!vigente) return;
        // Un tanque puede tener la especie en varias filas: se suman
        const porTanque = new Map();
        for (const h of data || []) {
          const previo = porTanque.get(h.tanque.id);
          porTanque.set(h.tanque.id, { ...h.tanque, cantidad: (previo?.cantidad || 0) + h.cantidad });
        }
        setTanques([...porTanque.values()]);
      });
    return () => { vigente = false; };
  }, [cientifico]);

  const probar = especie?.ficha && (
    <Link href={`/herramientas/compatibilidad/?con=${encodeURIComponent(especie.nombre)}`} className="enlace pequeno con-especie-probar">
      {t('conEspecie.probar')}
    </Link>
  );
  if (!tanques.length) return probar ? <div className="con-especie">{probar}</div> : null;
  return (
    <section className="con-especie" aria-labelledby="con-especie-titulo">
      {probar}
      <h3 id="con-especie-titulo" className="titulo-s">{t('conEspecie.titulo')}</h3>
      <ul>
        {tanques.slice(0, MAXIMO).map((tq) => (
          <li key={tq.id}>
            <Link href={`/tanque/?id=${tq.id}`} className="fila-tanque" style={{ '--agua': colorAgua(tq.tipo) }}>
              <img className="miniatura-tanque" src={imagenTanque(tq)} alt="" loading="lazy" />
              <span style={{ minWidth: 0, flex: 1 }}>
                <strong className="pequeno" style={{ display: 'block' }}>{tq.nombre}</strong>
                <span className="mini texto-3">
                  @{tq.autor?.usuario} · {t(`tipos.${tq.tipo}`)}{tq.litros ? `, ${u.volumen(tq.litros)}` : ''}
                </span>
              </span>
              <span className="mini texto-2">{t('conEspecie.ejemplares', { n: tq.cantidad })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
