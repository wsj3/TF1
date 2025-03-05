// Simple test endpoint to verify API routing
export default function handler(req, res) {
  console.log('Test API endpoint called');
  res.status(200).json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    query: req.query,
    method: req.method,
    cookies: req.headers.cookie ? 'Present' : 'None'
  });
} 