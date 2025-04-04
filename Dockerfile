FROM node:18-alpine AS builder

# Install OpenSSL for Prisma in Alpine
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy package.json only first
COPY package.json ./

# Install dependencies without using package-lock.json
# This avoids platform-specific binary issues
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables for build
ENV STATIC_EXPORT=true
ENV DOCKER_BUILD=true
ENV IS_EXPORT=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PHASE=phase-production-build

# Create .env.local with ALL export flags
RUN echo "STATIC_EXPORT=true" > .env.local && \
    echo "DOCKER_BUILD=true" >> .env.local && \
    echo "IS_EXPORT=true" >> .env.local && \
    echo "NEXT_PHASE=phase-production-build" >> .env.local

# Set binaryTargets explicitly for Prisma
ENV PRISMA_SCHEMA_ENGINE_BINARY_PLATFORM=linux-musl
ENV PRISMA_QUERY_ENGINE_BINARY_PLATFORM=linux-musl

# Explicitly verify that public directory with assets is present
RUN ls -la public && echo "Public directory with assets is present"
RUN test -f public/logo.png && echo "Logo file exists"

# Generate Prisma client with explicit binary target for Alpine Linux
RUN npx prisma generate --schema=prisma/schema.prisma

# Run static export preparation script
RUN node next-static-export.js

# Build the Next.js application with all environment variables set
RUN NEXT_DEBUG_BUILD=true STATIC_EXPORT=true DOCKER_BUILD=true IS_EXPORT=true NEXT_PHASE=phase-production-build npm run build

# Production stage
FROM node:18-alpine

# Install OpenSSL for Prisma in Alpine
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.local ./.env.local
COPY --from=builder /app/.static-export-marker ./.static-export-marker
COPY --from=builder /app/utils/static-export.js ./utils/static-export.js

# Set runtime environment variables
ENV STATIC_EXPORT=true
ENV DOCKER_BUILD=true
ENV IS_EXPORT=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PHASE=phase-production-build

# Set Prisma binary targets for runtime
ENV PRISMA_SCHEMA_ENGINE_BINARY_PLATFORM=linux-musl
ENV PRISMA_QUERY_ENGINE_BINARY_PLATFORM=linux-musl

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 