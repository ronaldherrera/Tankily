"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

// useLayoutEffect avisa en el servidor (export estático): allí basta con useEffect
const useLayoutEffectSeguro = typeof window === 'undefined' ? useEffect : useLayoutEffect;
import Link from '@/components/Enlace';
import { useT } from '@/i18n/IdiomaProvider';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { subirImagen } from '@/lib/imagenes';
import { DURACION_SALIDA } from '@/lib/presencia';

export function Avatar({ perfil, tamano = 40 }) {
  const inicial = (perfil?.nombre || perfil?.usuario || '?').trim().charAt(0).toUpperCase();
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.42 };
  if (perfil?.avatar_url) {
    return <img className="avatar" src={perfil.avatar_url} alt="" style={estilo} loading="lazy" />;
  }
  return <span className="avatar" style={estilo} aria-hidden="true">{inicial}</span>;
}

export function NombreAutor({ perfil, conUsuario = true }) {
  const { t } = useT();
  if (!perfil) return <strong>{t('comun.cuentaEliminada')}</strong>;
  return (
    <Link href={`/u/?n=${perfil.usuario}`} style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline', minWidth: 0 }}>
      <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil.nombre || perfil.usuario}</strong>
      {conUsuario && <span className="texto-3 pequeno">@{perfil.usuario}</span>}
    </Link>
  );
}

// `icono`: algo que va delante del título (p. ej. la foto del usuario)
export function Modal({ titulo, onCerrar, children, ancho = 520, icono }) {
  const ref = useRef(null);
  const { t } = useT();
  const [saliendo, setSaliendo] = useState(false);
  // Primero se anima la salida y después se avisa al padre para que lo desmonte
  const cerrar = useCallback(() => {
    setSaliendo(true);
    setTimeout(onCerrar, DURACION_SALIDA);
  }, [onCerrar]);

  useEffect(() => {
    const alPulsar = (e) => e.key === 'Escape' && cerrar();
    document.addEventListener('keydown', alPulsar);
    const previo = document.activeElement;
    // Foco al primer campo donde escribir; si no hay, al primer botón (el de cerrar)
    (ref.current?.querySelector('input:not([type=hidden]):not([type=range]):not([type=checkbox]), textarea, select')
      || ref.current?.querySelector('button'))?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = '';
      previo?.focus?.();
    };
  }, [cerrar]);

  return (
    <div className={`velo${saliendo ? ' saliendo' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && cerrar()}>
      <div ref={ref} className="modal cristal cristal-refracta" role="dialog" aria-modal="true" aria-label={titulo} style={{ maxWidth: ancho }}>
        <div className="modal-cabecera">
          <h2 className="titulo-m" style={icono ? { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 } : undefined}>{icono}{titulo}</h2>
          <button className="btn btn-fantasma btn-icono btn-s" onClick={cerrar} aria-label={t('comun.cerrar')}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const TostadaContext = createContext(() => {});

export function TostadaProvider({ children }) {
  const [mensaje, setMensaje] = useState(null);
  const [saliendo, setSaliendo] = useState(false);
  const temporizador = useRef(null);
  const mostrar = useCallback((texto) => {
    setMensaje(texto);
    setSaliendo(false);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setSaliendo(true);
      temporizador.current = setTimeout(() => setMensaje(null), DURACION_SALIDA);
    }, 2800);
  }, []);
  return (
    <TostadaContext.Provider value={mostrar}>
      {children}
      {mensaje && <div className={`tostada cristal${saliendo ? ' saliendo' : ''}`} role="status">{mensaje}</div>}
    </TostadaContext.Provider>
  );
}
export const useTostada = () => useContext(TostadaContext);

// Pestañas con una marca que se desliza (con muelle) hasta la elegida en lugar de saltar
export function Pestanas({ opciones, valor, onCambio, etiqueta }) {
  const caja = useRef(null);
  const [marca, setMarca] = useState(null);
  const primera = useRef(true);

  useLayoutEffectSeguro(() => {
    const medir = () => {
      const b = caja.current?.querySelector('[aria-selected="true"]');
      if (!b) return setMarca(null);
      setMarca({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight, animar: !primera.current });
      primera.current = false;
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (caja.current) obs.observe(caja.current);
    return () => obs.disconnect();
  }, [valor, opciones.length]);

  return (
    <div ref={caja} className={`pestanas cristal-suave${marca ? ' con-marca' : ''}`} role="tablist" aria-label={etiqueta}>
      {marca && (
        <span
          className="pestanas-marca"
          aria-hidden="true"
          style={{ width: marca.w, height: marca.h, transform: `translate(${marca.x}px, ${marca.y}px)`, transition: marca.animar ? undefined : 'none' }}
        />
      )}
      {opciones.map(([clave, texto]) => (
        <button key={clave} role="tab" className="pestana" aria-selected={valor === clave} onClick={() => onCambio(clave)} title={typeof texto === 'string' ? texto : undefined}>
          {texto}
        </button>
      ))}
    </div>
  );
}

// Altura que se anima (con muelle) cuando cambia el contenido, en lugar de saltar
export function AlturaFluida({ children, className }) {
  const interior = useRef(null);
  const [alto, setAlto] = useState(null);
  useLayoutEffectSeguro(() => {
    const nodo = interior.current;
    if (!nodo) return undefined;
    const obs = new ResizeObserver(() => setAlto(nodo.offsetHeight));
    obs.observe(nodo);
    return () => obs.disconnect();
  }, []);
  return (
    <div className={`altura-fluida${className ? ` ${className}` : ''}`} style={{ height: alto ?? 'auto' }}>
      <div ref={interior}>{children}</div>
    </div>
  );
}

export function Vacio({ titulo, children, accion }) {
  return (
    <div className="vacio">
      <p className="titulo-s">{titulo}</p>
      {children && <p className="pequeno" style={{ maxWidth: 380 }}>{children}</p>}
      {accion}
    </div>
  );
}

export function Cargando({ alto = 120, n = 3 }) {
  return Array.from({ length: n }, (_, i) => <div key={i} className="esqueleto" style={{ height: alto }} />);
}

// Con `sinEnlaces` las fotos no se abren aparte: se usa dentro de otro enlace (cita de un eco)
export function Galeria({ imagenes, alt = '', sinEnlaces = false }) {
  if (!imagenes?.length) return null;
  return (
    <div className={`galeria n${Math.min(imagenes.length, 6)}`}>
      {imagenes.map((src) => (sinEnlaces ? (
        <span key={src}><img src={src} alt={alt} loading="lazy" /></span>
      ) : (
        <a key={src} href={src} target="_blank" rel="noopener noreferrer">
          <img src={src} alt={alt} loading="lazy" />
        </a>
      )))}
    </div>
  );
}

// Selector de imágenes con subida inmediata a Storage. Devuelve las URLs vía onCambio.
export function SubidorImagenes({ valor, onCambio, maximo = 6, carpeta = 'posts', compacto = false }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const { t } = useT();

  async function alElegir(e) {
    const archivos = Array.from(e.target.files || []).slice(0, maximo - valor.length);
    e.target.value = '';
    if (!archivos.length) return;
    setSubiendo(true);
    setError('');
    try {
      const urls = [];
      for (const archivo of archivos) urls.push(await subirImagen(archivo, carpeta));
      onCambio([...valor, ...urls]);
    } catch (err) {
      setError(err.message);
    }
    setSubiendo(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {valor.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {valor.map((url) => (
            <div key={url} style={{ position: 'relative' }}>
              <img src={url} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 12 }} />
              <button
                type="button"
                className="btn btn-icono btn-s"
                style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26, background: 'rgba(0,0,0,.65)' }}
                onClick={() => onCambio(valor.filter((u) => u !== url))}
                aria-label={t('comun.quitarImagen')}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {valor.length < maximo && (
        <div>
          <button type="button" className={`btn ${compacto ? 'btn-fantasma btn-icono' : 'btn-s'}`} onClick={() => input.current?.click()} disabled={subiendo} aria-label={t('comun.anadirFotos')}>
            {subiendo ? <Loader2 size={18} className="girar" /> : <ImagePlus size={18} />}
            {!compacto && (subiendo ? t('comun.subiendo') : t('comun.anadirFotos'))}
          </button>
          <input ref={input} type="file" accept="image/*" multiple={maximo > 1} hidden onChange={alElegir} />
        </div>
      )}
      {error && <p className="aviso error">{error}</p>}
    </div>
  );
}

export function RequiereSesion({ children, texto }) {
  const { t } = useT();
  return (
    <div className="cristal" style={{ padding: 28 }}>
      <Vacio
        titulo={texto || t('comun.necesitasCuenta')}
        accion={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="btn btn-primario" href="/registro/">{t('sesion.crearCuenta')}</Link>
            <Link className="btn" href="/acceder/">{t('sesion.entrar')}</Link>
          </div>
        }
      >
        {children}
      </Vacio>
    </div>
  );
}
