/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // Solo en desarrollo: deja que la recarga en vivo funcione desde el móvil, por la red de casa
  // (192.168.x.x) o por un túnel (ver-desde-fuera)
  allowedDevOrigins: ['192.168.*.*', '*.trycloudflare.com'],
  images: {
    unoptimized: true,
  },
  experimental: {
    // 404 única para URLs inexistentes (el layout raíz está bajo [lang])
    globalNotFound: true,
    // En este disco (lento, según el propio Next) la caché en disco del servidor de desarrollo se
    // quedaba trabajando en segundo plano y acumulaba memoria hasta caerse (más de 16 GB)
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
