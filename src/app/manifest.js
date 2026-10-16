// /manifest.webmanifest: el de la raíz (en español). Cada idioma enlaza el suyo, ver src/lib/manifiesto.js.
import { manifiesto } from '@/lib/manifiesto';

export const dynamic = 'force-static';

export default function manifest() {
  return manifiesto();
}
