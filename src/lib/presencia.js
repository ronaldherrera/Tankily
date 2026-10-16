"use client";

import { useEffect, useState } from 'react';

// Mantiene un elemento montado mientras se anima su salida.
// const { montado, saliendo } = usePresencia(abierto) → render si `montado`, añade la clase "saliendo" si `saliendo`.
export const DURACION_SALIDA = 220;

export function usePresencia(visible, duracion = DURACION_SALIDA) {
  const [montado, setMontado] = useState(visible);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (visible) {
      setMontado(true);
      setSaliendo(false);
      return undefined;
    }
    if (!montado) return undefined;
    setSaliendo(true);
    const t = setTimeout(() => { setMontado(false); setSaliendo(false); }, duracion);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duracion]);

  return { montado, saliendo };
}
