"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { Plus } from 'lucide-react';
import { supabase, AUTOR } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { TIPOS_TANQUE, slugTipo } from '@/lib/constantes';
import { useT } from '@/i18n/IdiomaProvider';
import { Pestanas, Vacio, Cargando } from '@/components/ui';
import TanqueCard from '@/components/tanques/TanqueCard';
import ErrorCarga from '@/components/ErrorCarga';

// Tanques de la comunidad (y los míos). Con `tipo` es la página de ese tipo (/tanques/plantado/):
// enseña la comunidad aunque haya sesión, que es lo que busca quien llega a ella.
export default function TanquesCliente({ tipo = '' }) {
  const { usuario, cargando } = useSesion();
  const { t } = useT();
  const [vista, setVista] = useState('comunidad');
  const [tanques, setTanques] = useState(null);
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(0); // al reintentar tras un fallo se vuelve a pedir

  useEffect(() => {
    if (!cargando && usuario && !tipo) setVista('mios');
  }, [cargando, usuario, tipo]);

  useEffect(() => {
    if (cargando) return;
    setTanques(null);
    let q = supabase.from('tanques').select(`id, nombre, tipo, litros, foto_url, visibilidad, ${AUTOR}`);
    if (vista === 'mios' && usuario) q = q.eq('usuario_id', usuario.id).order('creado_en');
    else q = q.eq('visibilidad', 'publico').order('creado_en', { ascending: false }).limit(60);
    if (tipo) q = q.eq('tipo', tipo);
    q.then(({ data, error }) => { setFallo(!!error); setTanques(error ? [] : data || []); });
  }, [vista, tipo, usuario, cargando, intento]);

  return (
    <div className="contenido ancho">
      <div className="columna" style={{ gap: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', paddingTop: 12 }}>
          <div>
            <h1 className="titulo-l">{tipo ? t('seo.tipoTanque.t', { tipo: t(`tipos.${tipo}`) }) : t('tanques.titulo')}</h1>
            <p className="texto-2">{tipo ? t('seo.tipoTanque.d', { tipo: t(`tipos.${tipo}`) }) : t('tanques.subtitulo')}</p>
          </div>
          {usuario && <Link href="/tanques/nuevo/" className="btn btn-primario"><Plus size={18} /> {t('nav.nuevoTanque')}</Link>}
        </header>

        {usuario && (
          <div style={{ maxWidth: 360 }}>
            <Pestanas etiqueta={t('tanques.vista')} opciones={[['mios', t('tanques.mios')], ['comunidad', t('tanques.comunidad')]]} valor={vista} onCambio={setVista} />
          </div>
        )}

        <div className="chips-desliza" role="group" aria-label={t('tanques.filtrarTipo')}>
          {/* Enlaces de verdad (no botones): cada tipo tiene su página y Google la encuentra desde aquí */}
          <Link href="/tanques/" className="chip" aria-current={!tipo ? 'page' : undefined}>{t('comun.todos')}</Link>
          {Object.entries(TIPOS_TANQUE).filter(([clave]) => clave !== 'otro').map(([clave, info]) => (
            <Link key={clave} href={tipo === clave ? '/tanques/' : `/tanques/${slugTipo(clave)}/`} className="chip" style={{ '--agua': info.agua }} aria-current={tipo === clave ? 'page' : undefined}>
              {t(`tipos.${clave}`)}
            </Link>
          ))}
        </div>

        {tanques === null ? (
          <div className="rejilla-tarjetas"><Cargando alto={220} n={6} /></div>
        ) : fallo ? (
          <ErrorCarga onReintentar={() => setIntento((i) => i + 1)} />
        ) : tanques.length === 0 ? (
          vista === 'mios' ? (
            <Vacio titulo={t('tanques.vacioMiosTitulo')} accion={<Link href="/tanques/nuevo/" className="btn btn-primario"><Plus size={18} /> {t('tanques.anadirPrimero')}</Link>}>
              {t('tanques.vacioMiosTexto')}
            </Vacio>
          ) : (
            <Vacio titulo={t('tanques.vacioTipoTitulo')}>{t('tanques.vacioTipoTexto')}</Vacio>
          )
        ) : (
          <div className="rejilla-tarjetas">
            {tanques.map((tq) => <TanqueCard key={tq.id} tanque={tq} conAutor={vista !== 'mios'} />)}
          </div>
        )}
      </div>
    </div>
  );
}
