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
    STATIC_EXPORT: process.env.STATIC_EXPORT || 'true',
  },
  // Optimize for serverless environments
  experimental: {
    // This can improve serverless function initialization
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Configure pages that require authentication to be server-side rendered
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Disable static export for most pages
  output: 'standalone',
  
  // Configure only the absolute minimum pages to be pre-rendered
  async exportPathMap(defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    // Return only essential public pages
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
      '/auth/signin': { page: '/auth/signin' },
      '/auth/login': { page: '/auth/login' },
      '/auth/simple-signin': { page: '/auth/simple-signin' },
    }
  },
  poweredByHeader: false,
}

module.exports = nextConfig; 