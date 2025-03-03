/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  swcMinify: true,
  // Enable image optimization
  images: {
    domains: ['localhost'],
  },
  // Environment variables accessible on the client
  env: {
    APP_NAME: 'Therapists Friend',
    APP_VERSION: '0.1.0',
    BUILD_VERSION: '14.0.4-fixed',
  },
  // Optimize for serverless environments
  experimental: {
    // This can improve serverless function initialization
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Configure pages that require authentication to be server-side rendered
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Configure which pages should be pre-rendered
  async exportPathMap(defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
      // Remove dashboard and profile from static export
    }
  },
  poweredByHeader: false,
}

module.exports = nextConfig; 