// Custom authentication session API
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Only allow GET for session checks
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get cookie from request
    const cookies = parse(req.headers.cookie || '');
    const authToken = cookies[process.env.AUTH_COOKIE_NAME || 'tf-auth-token'];

    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'default-development-secret');
      
      // Return user session data
      return res.status(200).json({
        user: {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        }
      });
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
} 