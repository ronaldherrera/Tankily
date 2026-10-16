"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSesion } from './sesion';
import { paisProbable } from './paises';
import { centroProvincia } from './geo';

// Dónde está el usuario, para ordenar o filtrar por cercanía: su perfil si lo ha rellenado y, si no,
// el país que se deduce del navegador (zona horaria / idioma). Sin GPS ni servicios externos.
// listo = false mientras se carga la sesión (para no decidir con un dato que va a cambiar).
export function useUbicacion() {
  const { perfil, cargando } = useSesion();
  return useMemo(() => {
    if (cargando) return { listo: false, pais: null, provincia: null, origen: null };
    if (perfil?.pais) return { listo: true, pais: perfil.pais, provincia: perfil.provincia || null, origen: 'perfil' };
    return { listo: true, pais: paisProbable(), provincia: null, origen: 'navegador' };
  }, [perfil, cargando]);
}

const leerTodos = (clave) => { try { return sessionStorage.getItem(`tk-todos-${clave}`) === '1'; } catch { return false; } };

// Filtro inicial por el país del usuario en una lista (mercado, tiendas): solo si hay algo en su país,
// para que la web no parezca vacía. `contar(pais)` devuelve cuántos resultados hay allí. `omitir`: la
// URL ya trae filtros (enlace compartido, "mis anuncios"…). Si el usuario pide ver todos los países,
// se respeta durante la visita. Mientras decide, decidido = false (la lista espera para no parpadear).
export function usePaisInicial(clave, contar, omitir = false) {
  const ubicacion = useUbicacion();
  const [estado, setEstado] = useState({ decidido: false, pais: null });

  useEffect(() => {
    if (estado.decidido || !ubicacion.listo) return undefined;
    if (omitir || leerTodos(clave) || !ubicacion.pais) {
       
      setEstado({ decidido: true, pais: null });
      return undefined;
    }
    let vigente = true;
    contar(ubicacion.pais)
      .then((n) => vigente && setEstado({ decidido: true, pais: n > 0 ? ubicacion.pais : null }))
      .catch(() => vigente && setEstado({ decidido: true, pais: null }));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se decide una sola vez por visita a la página
  }, [ubicacion.listo]);

  const verTodos = () => { try { sessionStorage.setItem(`tk-todos-${clave}`, '1'); } catch { /* sin almacenamiento */ } };
  return { ...estado, verTodos };
}

const CLAVE_GPS = 'tk-punto-gps';
const leerGps = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE_GPS)); } catch { return null; } };

// Punto desde el que medir distancias: la ubicación exacta si el usuario la ha compartido en esta visita
// (botón "Usar mi ubicación": la pide el navegador, solo se guarda en esta pestaña y nunca se envía) o,
// si no, el centro de la provincia de su perfil. punto = null si no hay ninguno de los dos.
export function usePuntoUsuario() {
  const ubicacion = useUbicacion();
  const [gps, setGps] = useState(null);
  const [estado, setEstado] = useState('inactivo'); // 'inactivo' | 'pidiendo' | 'error'

  useEffect(() => {
    const guardado = leerGps();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage solo existe en el navegador
    if (guardado) setGps(guardado);
  }, []);

  const pedir = () => {
    if (!('geolocation' in navigator)) { setEstado('error'); return; }
    setEstado('pidiendo');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Redondeado a ~1 km: suficiente para ordenar y más respetuoso
        const punto = [Math.round(coords.latitude * 100) / 100, Math.round(coords.longitude * 100) / 100];
        try { sessionStorage.setItem(CLAVE_GPS, JSON.stringify(punto)); } catch { /* sin almacenamiento */ }
        setGps(punto);
        setEstado('inactivo');
      },
      () => setEstado('error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const perfil = centroProvincia(ubicacion.pais, ubicacion.provincia);
  if (gps) return { punto: gps, origen: 'gps', lugar: null, estado, pedir };
  if (perfil) return { punto: perfil, origen: 'perfil', lugar: ubicacion.provincia, estado, pedir };
  return { punto: null, origen: null, lugar: null, estado, pedir };
}
