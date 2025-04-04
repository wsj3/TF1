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

# Run our static export preparation script
echo "Running static export preparation script..."
node next-static-export.js

# Build the Next.js application with all export flags set
echo "Building the Next.js application with static export flags..."
NEXT_DEBUG_BUILD=true STATIC_EXPORT=true DOCKER_BUILD=true IS_EXPORT=true NEXT_PHASE=phase-production-build npm run build

echo "Custom build process completed successfully!"
