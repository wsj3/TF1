FROM node:18-alpine

WORKDIR /app

# Copy package.json only first
COPY package.json ./

# Install dependencies without using package-lock.json
# This avoids platform-specific binary issues
RUN npm install

# Copy the rest of the application
COPY . .

# Explicitly verify that public directory with assets is present
RUN ls -la public && echo "Public directory with assets is present"
RUN test -f public/logo.png && echo "Logo file exists"

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 