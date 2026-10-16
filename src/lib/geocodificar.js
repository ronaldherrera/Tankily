// Coordenadas de la dirección pública de una tienda con OpenStreetMap (Nominatim, gratuito).
// Solo se usa con tiendas: su dirección ya es pública en su ficha. Nunca con particulares.
// Normas de Nominatim: poco volumen (una petición al guardar la ficha) y con identificación (el navegador
// envía la página de origen). Si no encuentra la dirección o falla, devuelve null y no pasa nada:
// la tienda se sitúa en el centro de su provincia.
export async function geocodificarTienda({ direccion, ciudad, provincia, pais }) {
  if (!pais || (!direccion && !ciudad)) return null;
  const consulta = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: pais.toLowerCase() });
  if (direccion) consulta.set('street', direccion);
  if (ciudad) consulta.set('city', ciudad);
  if (provincia) consulta.set('state', provincia);
  try {
    const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?${consulta}`, { headers: { Accept: 'application/json' } });
    if (!respuesta.ok) return null;
    const [lugar] = await respuesta.json();
    if (!lugar) return null;
    // 5 decimales ≈ 1 m: de sobra para ordenar por distancia
    return { lat: Math.round(Number(lugar.lat) * 1e5) / 1e5, lng: Math.round(Number(lugar.lon) * 1e5) / 1e5 };
  } catch {
    return null;
  }
}
