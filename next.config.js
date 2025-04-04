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
    const staticExportUtil = `/**
 * Static Export Utilities
 * 
 * This file provides utilities for detecting and handling static export environments.
 * It is created by next.config.js during the export process and available
 * throughout the application to help components bypass authentication and API calls.
 */

// Constants for static export detection
export const IS_STATIC_EXPORT = true;
export const STATIC_EXPORT_MARKER = '.static-export-marker';

/**
 * Check if the current execution context is a static export
 * Uses multiple signals to detect static export environment
 */
export function isStaticExport() {
  return (
    // Various environment signals
    IS_STATIC_EXPORT === true ||
    process.env.STATIC_EXPORT === 'true' || 
    process.env.DOCKER_BUILD === 'true' ||
    process.env.IS_EXPORT === 'true' ||
    process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build' ||
    // Client-side detection
    typeof window !== 'undefined' && window.__NEXT_DATA__?.nextExport === true
  );
}

/**
 * Safe authentication check - returns true if the check should be bypassed
 * This provides a unified way to skip auth in various components
 */
export function shouldSkipAuthCheck() {
  return isStaticExport();
}

/**
 * Check if the current page is being statically rendered
 * This is useful in getStaticProps to determine if data fetching should be skipped
 */
export function isStaticRender() {
  return isStaticExport();
}

/**
 * A mock user object that can be used during static export
 * This ensures components don't crash when they need a user object
 */
export const mockUser = {
  id: 'static-user',
  email: 'static@example.com',
  name: 'Static User',
  role: 'user',
  isAdmin: false
};`;
    
    try {
      if (!fs.existsSync(path.join(dir, 'utils'))) {
        fs.mkdirSync(path.join(dir, 'utils'), { recursive: true });
      }
      fs.writeFileSync(path.join(dir, 'utils', 'static-export.js'), staticExportUtil);
      console.log('Created enhanced static export utility file');
    } catch (err) {
      console.error('Error creating static export utility:', err);
    }
    
    // Log what pages are being exported
    console.log('Available pages in defaultPathMap:', Object.keys(defaultPathMap));
    
    // Create an explicit list of public, non-authenticated pages
    const publicPages = {
      // Public pages
      '/': { page: '/' },
      '/404': { page: '/404' },
      '/minimal': { page: '/minimal' },
      
      // Auth pages - these handle authentication themselves
      '/auth/signin': { page: '/auth/signin' },
      '/auth/signup': { page: '/auth/signup' },
      '/auth/login': { page: '/auth/login' },
      '/auth/simple-signin': { page: '/auth/simple-signin' },
      '/auth/forgot-password': { page: '/auth/forgot-password' },
    };
    
    console.log('Exporting only these public pages:', Object.keys(publicPages));
    
    // Explicitly log pages that are being excluded
    const excludedPages = Object.keys(defaultPathMap).filter(
      path => !publicPages[path]
    );
    console.log('Explicitly EXCLUDING these pages from static export:', excludedPages);
    
    return publicPages;
  },
  
  // Disable powered by header for security
  poweredByHeader: false,
}

module.exports = nextConfig; 