#!/bin/bash

# Install Prisma dependencies
npm install @prisma/client
npm install prisma --save-dev

# Generate Prisma client
npx prisma generate

# Create a .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/therapistfriend?schema=public\"" > .env
  echo "Created .env file with default DATABASE_URL. Please update with your actual database credentials."
fi

echo "Prisma setup complete. Please update your .env file with the correct DATABASE_URL if you haven't already." 