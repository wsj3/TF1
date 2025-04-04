/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

// Force set static export flags
process.env.STATIC_EXPORT = 'true';
process.env.DOCKER_BUILD = 'true';
process.env.IS_EXPORT = 'true';

// Create static export marker file if it doesn't exist
try {
  if (!fs.existsSync('.static-export-marker')) {
    fs.writeFileSync('.static-export-marker', 'true');
    console.log('Created .static-export-marker file');
  }
} catch (err) {
  console.error('Error creating static export marker:', err);
}

const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  swcMinify: true,
  // Enable image optimization
  images: {
    domains: ['localhost'],
    unoptimized: true, // Always unoptimize images for static export
  },
  // Environment variables accessible on the client
  env: {
    APP_NAME: 'Therapists Friend',
    APP_VERSION: '0.1.0',
    BUILD_VERSION: '14.0.4-fixed',
    STATIC_EXPORT: 'true',
    DOCKER_BUILD: 'true',
    IS_EXPORT: 'true',
    NEXT_PHASE: 'phase-production-build',
  },
  // Optimize for serverless environments
  experimental: {
    // This can improve serverless function initialization
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Configure pages that require authentication to be server-side rendered
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Use standalone output mode for better Docker support
  output: 'standalone',
  
  // Explicitly set target to server to avoid client-side only features during export
  target: 'server',
  
  // Configure only public pages to be pre-rendered - NO authenticated pages
  async exportPathMap(defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    console.log('Running exportPathMap with STATIC_EXPORT =', process.env.STATIC_EXPORT);
    console.log('Running exportPathMap with DOCKER_BUILD =', process.env.DOCKER_BUILD);
    
    // Create a utility file to help detect static export during build
    const staticExportUtil = `export const IS_STATIC_EXPORT = true;\nexport function isStaticExport() { return true; }`;
    try {
      if (!fs.existsSync(path.join(dir, 'utils'))) {
        fs.mkdirSync(path.join(dir, 'utils'), { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'utils', 'static-export.js'), staticExportUtil);
      console.log('Created static export utility file');
    } catch (err) {
      console.error('Error creating static export utility:', err);
    }
    
    // Return only essential public pages and explicitly exclude any authenticated routes
    return {
      '/': { page: '/' },
      '/404': { page: '/404' },
      '/auth/signin': { page: '/auth/signin' },
      '/auth/login': { page: '/auth/login' },
      '/auth/simple-signin': { page: '/auth/simple-signin' },
    }
  },
  
  // Disable powered by header for security
  poweredByHeader: false,
}

module.exports = nextConfig; 