import { supabase } from './supabase';
import { tActual } from '@/i18n/actual';

const t = (clave, vars) => tActual(clave, vars);

const LADO_MAXIMO = 1920;

// Reduce y recomprime en el navegador antes de subir: las fotos de móvil pesan 5-10 MB.
async function comprimir(archivo, ladoMaximo = LADO_MAXIMO) {
  if (archivo.type === 'image/gif') return archivo;
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
}

// Sube una imagen a media/{uid}/{carpeta}/... y devuelve su URL pública.
export async function subirImagen(archivo, carpeta, { ladoMaximo } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error(t('imagenes.entraParaSubir'));
  if (!archivo.type.startsWith('image/')) throw new Error(t('imagenes.noEsImagen'));

  const blob = await comprimir(archivo, ladoMaximo);
  const extension = blob.type === 'image/gif' ? 'gif' : 'webp';
  const ruta = `${user.id}/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage.from('media').upload(ruta, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
  });
  if (error) throw new Error(t('imagenes.errorSubir', { error: error.message }));
  return supabase.storage.from('media').getPublicUrl(ruta).data.publicUrl;
}

// Borra todas las imágenes del usuario (media/{uid}/…). Se llama antes de eliminar la cuenta:
// los archivos no se borran en cascada con la base de datos y Supabase solo deja borrarlos con
// su API, que el propio usuario puede usar sobre su carpeta. Devuelve cuántos ha borrado.
export async function borrarMisArchivos(uid) {
  const bucket = supabase.storage.from('media');
  const listar = async (carpeta) => {
    const rutas = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await bucket.list(carpeta, { limit: 1000, offset: desde });
      if (error || !data?.length) break;
      for (const item of data) {
        const ruta = `${carpeta}/${item.name}`;
        // Las carpetas vienen sin id: se recorren también
        if (item.id) rutas.push(ruta); else rutas.push(...await listar(ruta));
      }
      if (data.length < 1000) break;
    }
    return rutas;
  };
  const rutas = await listar(uid);
  for (let i = 0; i < rutas.length; i += 100) await bucket.remove(rutas.slice(i, i + 100));
  return rutas.length;
}

// Borra del almacenamiento las imágenes propias de un contenido que se acaba de eliminar
// (publicación, anuncio…). Solo toca URLs de nuestro bucket; lo demás se ignora. Sin errores visibles:
// si no se puede, la imagen se queda huérfana pero el contenido ya está borrado.
export async function borrarImagenes(urls = []) {
  const marca = '/storage/v1/object/public/media/';
  const rutas = urls.filter((u) => typeof u === 'string' && u.includes(marca)).map((u) => decodeURIComponent(u.split(marca)[1].split('?')[0]));
  if (rutas.length) { try { await supabase.storage.from('media').remove(rutas); } catch { /* huérfana */ } }
}
