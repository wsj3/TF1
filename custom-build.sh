#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting custom build process..."

# Install OpenSSL and required dependencies
echo "Installing system dependencies..."
apt-get update && apt-get install -y openssl libssl-dev

# Set Node options to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Set STATIC_EXPORT flag for build process
export STATIC_EXPORT=true
echo "Setting STATIC_EXPORT=true for build..."

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

# Remove package-lock.json to prevent platform-specific binary issues
echo "Removing package-lock.json..."
rm -f package-lock.json

# Install dependencies
echo "Installing dependencies..."
npm install --no-package-lock

# Generate Prisma client explicitly
echo "Generating Prisma client..."
npx prisma generate

# Build the Next.js application
echo "Building the Next.js application..."
npm run build

echo "Custom build process completed successfully!"
