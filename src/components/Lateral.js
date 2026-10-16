"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { Droplets, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { colorAgua } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { diasDesde } from '@/lib/formatRelativeTime';
import Publicidad from './Publicidad';

export function MisTanques() {
  const { usuario } = useSesion();
  const [tanques, setTanques] = useState(null);
  const { t } = useT();
  const u = useUnidades();

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const { data } = await supabase
        .from('tanques')
        .select('id, nombre, tipo, litros, foto_url, cambio_agua_cada_dias, eventos:tanque_eventos(fecha, tipo)')
        .eq('usuario_id', usuario.id)
        .eq('eventos.tipo', 'cambio_agua')
        .order('fecha', { referencedTable: 'eventos', ascending: false })
        .limit(1, { referencedTable: 'eventos' })
        .order('creado_en');
      setTanques(data || []);
    })();
  }, [usuario]);

  if (!usuario || tanques === null) return null;

  return (
    <section className="cristal" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 className="titulo-s">{t('lateral.tusTanques')}</h2>
        <Link href="/tanques/nuevo/" className="btn btn-fantasma btn-icono btn-s" aria-label={t('nav.nuevoTanque')}><Plus size={18} /></Link>
      </div>
      {tanques.length === 0 ? (
        <p className="pequeno texto-2">{t('lateral.sinTanques')} <Link className="enlace" href="/tanques/nuevo/">{t('lateral.anadePrimero')}</Link> {t('lateral.yEmpieza')}</p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tanques.map((tq) => {
            const ultimo = tq.eventos?.[0]?.fecha;
            const dias = ultimo ? diasDesde(ultimo) : null;
            const toca = tq.cambio_agua_cada_dias && (dias === null || dias >= tq.cambio_agua_cada_dias);
            return (
              <li key={tq.id}>
                <Link href={`/tanque/?id=${tq.id}`} className="fila-tanque" style={{ '--agua': colorAgua(tq.tipo) }}>
                  <span className="miniatura-tanque" style={tq.foto_url ? { backgroundImage: `url(${JSON.stringify(tq.foto_url)})` } : undefined} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <strong className="pequeno" style={{ display: 'block' }}>{tq.nombre}</strong>
                    <span className="mini texto-3">{t(`tipos.${tq.tipo}`)}{tq.litros ? ` · ${u.volumen(tq.litros)}` : ''}</span>
                  </span>
                  {toca && <span className="mini" style={{ color: 'var(--aviso)', display: 'flex', gap: 4, alignItems: 'center' }} title={t('lateral.tocaAgua')}><Droplets size={14} /> {t('lateral.agua')}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Tendencias() {
  const [etiquetas, setEtiquetas] = useState([]);
  const { t } = useT();

  useEffect(() => {
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString();
    supabase.from('publicaciones').select('etiquetas').gte('creado_en', hace7).neq('etiquetas', '{}').limit(300)
      .then(({ data }) => {
        const cuenta = {};
        (data || []).forEach((p) => p.etiquetas.forEach((e) => { cuenta[e] = (cuenta[e] || 0) + 1; }));
        setEtiquetas(Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 8));
      });
  }, []);

  if (!etiquetas.length) return null;
  return (
    <section className="cristal-suave" style={{ padding: 16 }}>
      <h2 className="titulo-s" style={{ marginBottom: 10 }}>{t('lateral.seHablaDe')}</h2>
      <div className="chips">
        {etiquetas.map(([e, n]) => (
          <Link key={e} href={`/explorar/?tag=${encodeURIComponent(e)}`} className="chip">#{e} <span className="texto-3">{n}</span></Link>
        ))}
      </div>
    </section>
  );
}

export default function Lateral({ children, ubicacionPubli = 'lateral' }) {
  return (
    <aside className="lateral">
      {children}
      <Publicidad ubicacion={ubicacionPubli} />
    </aside>
  );
}
