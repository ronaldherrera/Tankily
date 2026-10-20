"use client";

import { Children, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { useT } from '@/i18n/IdiomaProvider';
import { usePresencia } from '@/lib/presencia';

// Sustituto del <select> nativo con el estilo de la web. Se usa igual: mismas props (value, onChange,
// required, disabled, aria-label, className, style, id) y las opciones como <option> hijos, así cada
// formulario no cambia su lógica: onChange recibe { target: { value } } como con el nativo.
// Con más de BUSCAR_DESDE opciones (países, provincias…) añade un buscador.
const BUSCAR_DESDE = 12;
const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function leerOpciones(children) {
  const lista = [];
  const recorrer = (nodos) => Children.forEach(nodos, (n) => {
    if (!isValidElement(n)) return;
    if (n.type === 'option') {
      const texto = Children.toArray(n.props.children).join('');
      lista.push({ valor: String(n.props.value ?? texto), texto, desactivada: !!n.props.disabled });
    } else if (n.props?.children) recorrer(n.props.children);
  });
  recorrer(children);
  return lista;
}

export default function Selector({
  value, onChange, children, required, disabled, id, className = 'entrada', style,
  'aria-label': ariaLabel, buscar,
}) {
  const { t } = useT();
  const opciones = useMemo(() => leerOpciones(children), [children]);
  const actual = opciones.find((o) => o.valor === String(value ?? '')) || opciones[0];
  const conBuscador = buscar ?? opciones.length > BUSCAR_DESDE;

  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [activa, setActiva] = useState(0);
  const [pos, setPos] = useState(null);
  const presencia = usePresencia(abierto);
  const boton = useRef(null);
  const lista = useRef(null);
  const buscador = useRef(null);
  const capa = useRef(null);
  const idLista = useId();
  const tecleado = useRef({ texto: '', hasta: 0 });

  const visibles = useMemo(() => {
    const f = normalizar(filtro.trim());
    return f ? opciones.filter((o) => normalizar(o.texto).includes(f)) : opciones;
  }, [opciones, filtro]);

  function abrir() {
    if (disabled) return;
    setFiltro('');
    setActiva(Math.max(0, opciones.findIndex((o) => o.valor === actual?.valor)));
    setAbierto(true);
  }
  function cerrar(devolverFoco = true) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }
  function elegir(o) {
    if (!o || o.desactivada) return;
    if (o.valor !== actual?.valor) onChange?.({ target: { value: o.valor } });
    cerrar();
  }

  // Posición: debajo del campo o, si no cabe, encima. En una capa propia (portal) para que no la recorte
  // ni la descoloque ningún contenedor con overflow o backdrop-filter (modales, tarjetas de cristal).
  useLayoutEffect(() => {
    if (!presencia.montado) return undefined;
    const colocar = () => {
      const r = boton.current?.getBoundingClientRect();
      if (!r) return;
      const margen = 8;
      const abajo = window.innerHeight - r.bottom - margen;
      const arriba = r.top - margen;
      const haciaArriba = abajo < 240 && arriba > abajo;
      const ancho = Math.min(Math.max(r.width, 220), window.innerWidth - margen * 2);
      const izquierda = Math.min(Math.max(r.left, margen), window.innerWidth - ancho - margen);
      setPos({ izquierda, ancho, haciaArriba, alto: Math.min(340, (haciaArriba ? arriba : abajo) - 6), top: r.bottom + 6, bottom: window.innerHeight - r.top + 6 });
    };
    // El scroll de la propia lista no mueve el campo: no hay que recolocar (y recolocar la devolvía arriba)
    const alDesplazar = (e) => { if (!capa.current?.contains(e.target)) colocar(); };
    colocar();
    window.addEventListener('resize', colocar);
    window.addEventListener('scroll', alDesplazar, true);
    return () => { window.removeEventListener('resize', colocar); window.removeEventListener('scroll', alDesplazar, true); };
  }, [presencia.montado]);

  // Al abrir (solo una vez por apertura): foco en el buscador o la lista y la opción elegida a la vista
  const preparado = useRef(false);
  useEffect(() => {
    if (!abierto) { preparado.current = false; return; }
    if (!pos || preparado.current) return;
    preparado.current = true;
    // En táctil no se enfoca el buscador: sacaría el teclado y taparía la lista aunque solo se quiera elegir
    const tactil = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;
    (conBuscador && !tactil ? buscador.current : lista.current)?.focus({ preventScroll: true });
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [abierto, pos, conBuscador]);

  // Clic fuera: cierra sin robar el foco a lo que se haya pulsado
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (!boton.current?.contains(e.target) && !capa.current?.contains(e.target)) cerrar(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  // Solo al moverse con el teclado se lleva la opción activa a la vista (con el ratón, el que manda es él)
  const porTeclado = useRef(false);
  useEffect(() => {
    if (!porTeclado.current) return;
    porTeclado.current = false;
    lista.current?.querySelector(`[data-i="${activa}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activa]);

  function teclaBoton(e) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abrir(); }
  }
  function teclaLista(e) {
    porTeclado.current = true;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiva((i) => Math.min(i + 1, visibles.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiva((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActiva(0); }
    else if (e.key === 'End') { e.preventDefault(); setActiva(visibles.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(visibles[activa]); }
    else if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    else if (e.key === 'Tab') cerrar(false);
    else if (!conBuscador && e.key.length === 1) {
      // Sin buscador: escribir salta a la primera opción que empieza así
      const ahora = e.timeStamp;
      const tt = tecleado.current;
      tt.texto = (ahora < tt.hasta ? tt.texto : '') + normalizar(e.key);
      tt.hasta = ahora + 700;
      const i = visibles.findIndex((o) => normalizar(o.texto).startsWith(tt.texto));
      if (i >= 0) setActiva(i);
    }
  }

  return (
    <span className="selector" style={style?.width ? { width: style.width } : undefined}>
      <button
        ref={boton}
        type="button"
        id={id}
        className={`${className} selector-boton`}
        style={style}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? idLista : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={teclaBoton}
      >
        <span className="selector-texto">{actual?.texto ?? ''}</span>
        <ChevronDown size={16} className="selector-flecha" aria-hidden />
      </button>
      {/* Para que "obligatorio" funcione como en el nativo (el navegador avisa si está vacío) */}
      {required && (
        <input className="selector-validacion" tabIndex={-1} aria-hidden="true" required value={actual?.valor ?? ''} onChange={() => {}}
          onFocus={() => boton.current?.focus()} />
      )}

      {presencia.montado && pos && createPortal(
        <div
          ref={capa}
          className={`selector-capa menu cristal${presencia.saliendo ? ' saliendo' : ''}${pos.haciaArriba ? ' hacia-arriba' : ''}`}
          style={{ position: 'fixed', left: pos.izquierda, right: 'auto', width: pos.ancho, ...(pos.haciaArriba ? { top: 'auto', bottom: pos.bottom } : { top: pos.top, bottom: 'auto' }) }}
          onKeyDown={teclaLista}
        >
          {conBuscador && (
            <label className="selector-buscar">
              <Search size={16} aria-hidden />
              <input
                ref={buscador}
                value={filtro}
                onChange={(e) => { setFiltro(e.target.value); setActiva(0); }}
                placeholder={t('selector.buscar')}
                aria-label={t('selector.buscar')}
                aria-controls={idLista}
                aria-activedescendant={visibles[activa] ? `${idLista}-${activa}` : undefined}
              />
            </label>
          )}
          <ul ref={lista} id={idLista} role="listbox" tabIndex={-1} className="selector-lista" style={{ maxHeight: Math.max(pos.alto - (conBuscador ? 52 : 0), 120) }}
            aria-activedescendant={!conBuscador && visibles[activa] ? `${idLista}-${activa}` : undefined}>
            {visibles.length === 0 && <li className="selector-vacio">{t('selector.sinResultados')}</li>}
            {visibles.map((o, i) => (
              <li
                key={o.valor + i}
                id={`${idLista}-${i}`}
                data-i={i}
                role="option"
                aria-selected={o.valor === actual?.valor}
                aria-disabled={o.desactivada || undefined}
                className={`selector-opcion${i === activa ? ' activa' : ''}`}
                onPointerMove={() => setActiva(i)}
                onClick={() => elegir(o)}
              >
                <span>{o.texto}</span>
                {o.valor === actual?.valor && <Check size={16} aria-hidden />}
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </span>
  );
}
