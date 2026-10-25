'use client';
// Foto de la cabecera de una ficha de especie: en la cabecera va recortada (object-fit: cover); al pulsarla
// se abre entera en un visor a pantalla completa (dialog nativo: se cierra con Esc, la X o pulsando fuera)
import { useRef } from 'react';
import { Maximize2, X } from 'lucide-react';

export default function FotoEspecie({ src, alt, textoAmpliar, textoCerrar }) {
  const visor = useRef(null);
  const abrir = () => visor.current?.showModal();
  const cerrar = () => visor.current?.close();
  return (
    <>
      <img src={src} alt={alt} onClick={abrir} className="especie-hero-foto" />
      <button type="button" className="especie-ampliar" onClick={abrir} aria-label={textoAmpliar} title={textoAmpliar}>
        <Maximize2 size={18} aria-hidden="true" />
      </button>
      <dialog ref={visor} className="especie-visor" aria-label={alt} onClick={(ev) => ev.target === visor.current && cerrar()}>
        <img src={src} alt={alt} />
        <button type="button" className="especie-visor-cerrar" onClick={cerrar} aria-label={textoCerrar} title={textoCerrar}>
          <X size={20} aria-hidden="true" />
        </button>
      </dialog>
    </>
  );
}
