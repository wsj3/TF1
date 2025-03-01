// A diagnostic endpoint to test database connectivity
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const connectionInfo = {
    success: false,
    error: null,
    prismaVersion: null,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/(:.+?@)/g, ':****@') : 'not set', // Hide password
    timestamp: new Date().toISOString(),
  };

  try {
    // Check Prisma version
    connectionInfo.prismaVersion = require('@prisma/client/package.json').version;
    
    // Test database connection
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Attempt a simple query
    console.log('Attempting to connect to database...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    
    connectionInfo.success = true;
    connectionInfo.testQuery = result;
    
    res.status(200).json(connectionInfo);
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    connectionInfo.error = {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    };
    
    res.status(500).json(connectionInfo);
  }
} 