/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/dashboard',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // En entorno local usará el puerto 5000, en el servidor usará el de la red docker 'backend' u otra variable.
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
