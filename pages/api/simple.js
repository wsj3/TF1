export default function handler(req, res) {
  // Simple endpoint that doesn't try to use Prisma or environment variables
  res.status(200).json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    message: 'Simple endpoint working'
  });
} 