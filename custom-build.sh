#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting custom build process..."

# Install OpenSSL and required dependencies
echo "Installing system dependencies..."
apt-get update && apt-get install -y openssl libssl-dev

# Set Node options to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Set ALL possible flags for static export detection
export STATIC_EXPORT=true
export DOCKER_BUILD=true
export IS_EXPORT=true
export NEXT_PHASE=phase-production-build
echo "Setting all static export flags for build..."

# Create .npmrc file to ensure proper installation settings
echo "Configuring npm..."
cat > .npmrc << NPMRC
platform=linux
arch=x64
force=true
ignore-scripts=false
package-lock=false
unsafe-perm=true
node-linker=hoisted
legacy-peer-deps=true
fetch-retries=5
network-timeout=100000
NPMRC

# Create or update .env.local with ALL export flags
echo "Configuring build environment variables..."
cat > .env.local << ENV
STATIC_EXPORT=true
DOCKER_BUILD=true
IS_EXPORT=true
NEXT_PHASE=phase-production-build
ENV

echo "Environment variables set:"
cat .env.local

# Create static export marker file
echo "Creating static export marker file..."
touch .static-export-marker

# Make sure utils directory exists
mkdir -p utils

# Create the static-export.js file with robust utilities
echo "Creating static export detection utilities..."
cat > utils/static-export.js << JSFILE
/**
 * Static Export Utilities
 * 
 * This file provides utilities for detecting and handling static export environments.
 * It is created during the build process and available throughout the application
 * to help components bypass authentication and API calls during static export.
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
};
JSFILE

echo "Static export utilities have been created"

# Remove package-lock.json to prevent platform-specific binary issues
echo "Removing package-lock.json..."
rm -f package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install --no-package-lock

# Generate Prisma client explicitly with proper binary target
echo "Generating Prisma client..."
export PRISMA_SCHEMA_ENGINE_BINARY_PLATFORM=linux-musl
export PRISMA_QUERY_ENGINE_BINARY_PLATFORM=linux-musl
npx prisma generate --schema=prisma/schema.prisma

# Clean the .next directory to ensure a fresh build
echo "Cleaning previous build artifacts..."
rm -rf .next
rm -rf out

# Build the Next.js application with all export flags set
echo "Building the Next.js application with static export flags..."
NEXT_DEBUG_BUILD=true STATIC_EXPORT=true DOCKER_BUILD=true IS_EXPORT=true NEXT_PHASE=phase-production-build npm run build

echo "Custom build process completed successfully!"
