export default async function handler(req, res) {
  try {
    // Basic environment check
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Present (value hidden)' : 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Present (value hidden)' : 'Missing'
    };

    // Check if we can import PrismaClient
    let prismaStatus = 'Not tested';
    let dbConnectionStatus = 'Not tested';
    let tables = [];

    try {
      // Dynamic import to avoid issues if Prisma is not available
      const { PrismaClient } = await import('@prisma/client');
      prismaStatus = 'Imported successfully';

      // Test database connection with Prisma
      try {
        const prisma = new PrismaClient();
        // Simple query to test connection
        await prisma.$queryRaw`SELECT 1 as connected`;
        dbConnectionStatus = 'Connected successfully';

        // Try to get table information
        const tableInfo = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `;
        
        tables = tableInfo.map(t => t.table_name);
        
        await prisma.$disconnect();
      } catch (dbError) {
        dbConnectionStatus = `Error: ${dbError.message}`;
      }
    } catch (prismaError) {
      prismaStatus = `Error importing Prisma: ${prismaError.message}`;
    }

    // Return diagnostic information
    return res.status(200).json({
      status: 'Success',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      prisma: {
        status: prismaStatus,
        dbConnection: dbConnectionStatus,
        tables: tables
      },
      request: {
        method: req.method,
        url: req.url,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
          'x-vercel-id': req.headers['x-vercel-id']
        }
      },
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      status: 'Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? '(hidden in production)' : error.stack
    });
  }
} 