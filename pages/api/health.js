import { PrismaClient } from '@prisma/client';
import { createSafeApiEndpoint } from '../../utils/apiHelpers';

async function handler(req, res, prisma) {
  try {
    // Basic server health check
    const serverStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    };

    // Check database connection if prisma is available
    if (prisma) {
      try {
        // Simple query to check DB connection
        const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
        serverStatus.database = {
          connected: true,
          message: 'Database connection successful'
        };
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        serverStatus.database = {
          connected: false,
          message: `Database connection failed: ${dbError.message}`,
          error: dbError.message
        };
      }
    } else {
      serverStatus.database = {
        connected: false,
        message: 'Prisma client not available'
      };
    }

    // Return the health status
    return res.status(200).json({
      success: true,
      data: serverStatus,
      message: 'Health check completed'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
}

// Export the handler with our safe API endpoint wrapper
export default createSafeApiEndpoint(handler, () => ({
  success: true,
  data: {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'demo',
    database: {
      connected: true,
      message: 'Demo mode - no database connection required'
    }
  },
  message: 'Health check completed (demo mode)'
})); 