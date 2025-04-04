/**
 * Simple API endpoint to check server status
 */
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    prismaConnected: !!global.prisma || process.env.NODE_ENV === 'production'
  });
} 