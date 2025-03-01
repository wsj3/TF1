// No imports at all
export default function handler(req, res) {
  res.status(200).json({
    message: 'This is a bare endpoint with absolutely no imports or dependencies',
    timestamp: Date.now(),
    query: req.query
  });
} 