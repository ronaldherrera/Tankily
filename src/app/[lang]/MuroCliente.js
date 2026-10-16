"use client";

import { useEffect, useState } from 'react';
import Link from '@/components/Enlace';
import { useSesion } from '@/lib/sesion';
import { useT } from '@/i18n/IdiomaProvider';
import { useUnidades } from '@/lib/unidades';
import { formatNumero } from '@/lib/formatRelativeTime';
import { Pestanas, Vacio } from '@/components/ui';
import Feed from '@/components/feed/Feed';
import PostComposer from '@/components/feed/PostComposer';
import Lateral, { MisTanques, Tendencias } from '@/components/Lateral';
import PanelHoy from '@/components/tanques/PanelHoy';
import PrimerosPasos from '@/components/PrimerosPasos';
import TiendasCerca from '@/components/tiendas/TiendasCerca';
import { ChartLine, ShieldCheck, MessagesSquare, Tag } from 'lucide-react';

// Ficha de ejemplo: enseña en un vistazo qué es Tankily (un tanque con su diario de agua)
const FICHA = [
  ['temperatura', 25.4, [25.1, 25.3, 25.2, 25.6, 25.4, 25.5, 25.4]],
  ['salinidad', 35, [34.6, 34.8, 35.1, 35, 34.9, 35, 35]],
  ['kh', 8.1, [7.6, 7.9, 8.3, 8.0, 7.8, 8.2, 8.1]],
  ['nitrato', 4, [9, 8, 7, 6.5, 5, 4.5, 4]],
];
const UNIDAD = { salinidad: 'ppt', kh: 'dKH', nitrato: 'mg/l' };

function Linea({ valores }) {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const puntos = valores.map((v, i) => `${(i / (valores.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" width="100%" height="30" aria-hidden="true">
      <polyline points={puntos} fill="none" stroke="var(--agua)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

// Cifras de la web (vienen calculadas del servidor) y los cuatro motivos para registrarse
const CIFRAS = ['especies', 'articulos', 'calculadoras', 'idiomas'];
const BENEFICIOS = [['agua', ChartLine], ['compat', ShieldCheck], ['foro', MessagesSquare], ['mercado', Tag]];

function Portada({ cifras }) {
  const { t } = useT();
  const u = useUnidades();
  return (
    <section className="portada" style={{ '--agua': '#3fa9ff' }}>
      <div className="portada-texto">
        <h1 className="titulo-xl">{t('portada.titulo')}</h1>
        <p className="texto-2" style={{ fontSize: '1.1rem', maxWidth: '46ch' }}>
          {t('portada.texto')}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/registro/" className="btn btn-primario">{t('portada.crearCuenta')}</Link>
          <Link href="/tanques/" className="btn">{t('portada.verTanques')}</Link>
        </div>
        {cifras && (
          <p className="portada-confianza mini texto-3">
            <strong>{t('bienvenida.gratis')}</strong>{' '}
            {CIFRAS.map((c, i) => (
              <span key={c}>{formatNumero(cifras[c], 0)} {t(`bienvenida.${c}`)}{i < CIFRAS.length - 1 ? ', ' : '.'}</span>
            ))}
          </p>
        )}
      </div>

      <div className="ficha-demo cristal cristal-refracta" aria-label={t('portada.ejemplo')}>
        <div className="ficha-foto" />
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span className="etiqueta-agua">{t('tipos.reef')} · {u.volumen(300)}</span>
            <p className="titulo-m" style={{ marginTop: 4 }}>{t('portada.fichaNombre')}</p>
          </div>
          <div className="ficha-parametros">
            {FICHA.map(([clave, valor, serie]) => (
              <div key={clave}>
                <span className="mini texto-3">{t(`parametros.${clave}`)}</span>
                <p><span className="cifra" style={{ fontSize: '1.35rem' }}>{formatNumero(clave === 'temperatura' ? u.deC(valor) : valor, 1)}</span> <span className="mini texto-3">{clave === 'temperatura' ? u.unidadTemp : UNIDAD[clave]}</span></p>
                <Linea valores={serie} />
              </div>
            ))}
          </div>
          <p className="mini texto-3">{t('portada.fichaPie')}</p>
        </div>
      </div>
    </section>
  );
}

function Beneficios() {
  const { t } = useT();
  return (
    <section className="beneficios" aria-labelledby="beneficios-titulo">
      <h2 id="beneficios-titulo" className="titulo-l">{t('bienvenida.titulo')}</h2>
      <div className="beneficios-rejilla">
        {BENEFICIOS.map(([clave, Icono]) => (
          <div key={clave} className="beneficio">
            <Icono size={22} aria-hidden="true" />
            <h3 className="titulo-s">{t(`bienvenida.${clave}.titulo`)}</h3>
            <p className="texto-2">{t(`bienvenida.${clave}.texto`)}</p>
            {clave === 'compat' && <Link href="/herramientas/compatibilidad/" className="enlace pequeno">{t('bienvenida.probar')}</Link>}
          </div>
        ))}
      </div>
      <div className="beneficios-cierre">
        <p className="texto-2">{t('bienvenida.cierre')}</p>
        <Link href="/registro/" className="btn btn-primario">{t('portada.crearCuenta')}</Link>
      </div>
    </section>
  );
}

export default function MuroCliente({ cifras }) {
  const { usuario, cargando } = useSesion();
  const [modo, setModo] = useState('todos');
  const { t } = useT();

  // La sesión guardada había caducado: se quita la marca para que se vea la portada
  useEffect(() => {
    if (!cargando && !usuario) delete document.documentElement.dataset.sesion;
  }, [cargando, usuario]);

  return (
    <>
      {/* Sin sesión confirmada se pinta la portada: así va en el HTML estático (Google la lee) */}
      {!usuario && <><Portada cifras={cifras} /><Beneficios /></>}
      <div className="contenido">
        <div className="columna">
          <Feed
            modo={usuario ? modo : 'todos'}
            cabecera={(alPublicar) => usuario && (
              <>
                <PrimerosPasos />
                <PanelHoy />
                <PostComposer onPublicado={alPublicar} />
                <Pestanas etiqueta={t('muro.pestanas')} opciones={[['todos', t('muro.paraTi')], ['siguiendo', t('muro.siguiendo')]]} valor={modo} onCambio={setModo} />
              </>
            )}
            vacio={
              modo === 'siguiendo' ? (
                <Vacio titulo={t('muro.vacioSiguiendoTitulo')} accion={<Link href="/tanques/" className="btn">{t('muro.descubrirTanques')}</Link>}>
                  {t('muro.vacioSiguiendoTexto')}
                </Vacio>
              ) : (
                <Vacio titulo={t('muro.vacioTitulo')}>{t('muro.vacioTexto')}</Vacio>
              )
            }
          />
        </div>
        <Lateral ubicacionPubli="lateral">
          <MisTanques />
          <Tendencias />
          <TiendasCerca />
        </Lateral>
      </div>
    </>
  );
}
