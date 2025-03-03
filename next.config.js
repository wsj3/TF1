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
  // Disable static optimization for auth-dependent pages
  unstable_runtimeJS: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Ensure these pages are server-side rendered
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
      '/dashboard': { page: '/dashboard' },
      '/profile': { page: '/profile' }
    }
  },
  poweredByHeader: false,
}

module.exports = nextConfig; 