#!/bin/bash
# Special PaaS build hook to override default behavior

set -e
echo "Running custom build process from bin/build.sh"

# Remove package-lock.json
rm -f package-lock.json

# Install dependencies with npm install
echo "Installing dependencies with npm install..."
npm install --no-package-lock

# Build the Next.js application
echo "Building the application..."
npm run build

echo "Build completed successfully" 