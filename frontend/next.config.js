/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  turbopack: { root: __dirname },
}

module.exports = nextConfig
