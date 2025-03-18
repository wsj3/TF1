#!/bin/bash

# Stop any running Next.js server
echo "Stopping any running Next.js server..."
pkill -f "node.*next"

# Regenerate Prisma client
echo "Regenerating Prisma client..."
npx prisma generate

# Create a proper .env.local file
echo "Creating .env.local file..."
cat > .env.local << EOL
# Local development environment variables
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development

# Local database connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/therapists_friend"

# Authentication
JWT_SECRET="local-development-jwt-secret-key-for-testing-only"
API_BASE_URL="http://localhost:3000/api"
AUTH_COOKIE_NAME="auth-token"

# Feature flags
ENABLE_DEMO_MODE=true
DEBUG_MODE=true
EOL

# Start the development server
echo "Starting Next.js development server..."
npm run dev 