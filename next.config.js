/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable image optimization
  images: {
    domains: ['localhost'],
  },
  // Environment variables accessible on the client
  env: {
    APP_NAME: 'Therapists Friend',
    APP_VERSION: '0.1.0',
  },
}

module.exports = nextConfig 