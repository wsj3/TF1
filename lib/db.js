/**
 * Database connection utility - Enhanced with robust connection management
 * Creates a singleton instance of PrismaClient to avoid too many connections
 * Implements automatic reconnection and connection health checking
 */
import { PrismaClient } from '@prisma/client';

let prisma;

// Database connection options
const CONNECTION_SETTINGS = {
  // Log all queries in development for debugging
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['query', 'error', 'warn'],
  
  // Prisma will automatically use a connection pool
};

// Heartbeat interval (15 seconds)
const HEARTBEAT_INTERVAL = 15000;

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 3;

// Track connection state
let isConnected = false;
let heartbeatInterval = null;

// Function to attempt database reconnection
async function reconnectDB(attempts = 0) {
  if (attempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`Failed to reconnect to database after ${attempts} attempts`);
    return false;
  }
  
  console.log(`Attempting to reconnect to database (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  try {
    await prisma.$disconnect();
    await prisma.$connect();
    console.log('Successfully reconnected to database');
    isConnected = true;
    return true;
  } catch (error) {
    console.error(`Reconnection attempt ${attempts + 1} failed:`, error);
    // Exponential backoff
    const backoff = Math.min(100 * Math.pow(2, attempts), 3000);
    await new Promise(resolve => setTimeout(resolve, backoff));
    return reconnectDB(attempts + 1);
  }
}

// Heartbeat function to check if connection is still alive
async function databaseHeartbeat() {
  try {
    // Simple query to check connection health
    await prisma.$queryRaw`SELECT 1`;
    // If we get here, connection is working
    if (!isConnected) {
      console.log('Database connection restored');
      isConnected = true;
    }
  } catch (error) {
    console.error('Database heartbeat failed:', error.message);
    
    if (isConnected) {
      console.log('Database connection lost, attempting to reconnect...');
      isConnected = false;
    }
    
    // Attempt reconnection
    await reconnectDB();
  }
}

// Initialize client with proper error handling
try {
  // Check if we're in production to avoid instantiating PrismaClient multiple times during hot reload
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient(CONNECTION_SETTINGS);
    console.log('Prisma Client initialized in production mode');
  } else {
    // In development, create a global object to maintain a single instance
    if (!global.prisma) {
      global.prisma = new PrismaClient(CONNECTION_SETTINGS);
      console.log('Prisma Client initialized in development mode');
    }
    prisma = global.prisma;
  }

  // Initial connection
  prisma.$connect()
    .then(() => {
      console.log('Database connection established successfully');
      isConnected = true;
      
      // Start heartbeat to keep connection alive and detect disconnects
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(databaseHeartbeat, HEARTBEAT_INTERVAL);
        console.log(`Database heartbeat started (every ${HEARTBEAT_INTERVAL/1000}s)`);
      }
    })
    .catch((e) => {
      console.error('Failed to connect to database:', e);
      isConnected = false;
    });

} catch (e) {
  console.error('Error initializing Prisma Client:', e);
  throw new Error('Database connection failed: ' + e.message);
}

// Add utility methods to prisma object
prisma.reconnect = reconnectDB;
prisma.isConnected = () => isConnected;

// Handle Node.js process termination - clean up connections
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    console.log('Closing database connections before exit...');
    clearInterval(heartbeatInterval);
    await prisma.$disconnect();
  });
}

export default prisma; 