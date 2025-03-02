/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  swcMinify: true,
  // Ensure PostCSS processing is enabled
  postcss: true,
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
    serverComponentsExternalPackages: ['@prisma/client'],
    // Ensure we're not using any experimental features
    appDir: false,
  },
  // Configure webpack to use our mock tailwindcss module
  webpack: (config, { isServer }) => {
    // Alias tailwindcss to our mock implementation
    config.resolve.alias['tailwindcss'] = path.resolve(__dirname, 'src/mocks/tailwindcss.js');
    
    return config;
  },
  poweredByHeader: false,
}

module.exports = nextConfig; 