// Custom authentication session API
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Only allow GET for session checks
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables with fallbacks
    const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
    const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
    
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[cookieName];
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify token
    const userData = jwt.verify(token, jwtSecret);
    
    // Return user data without sensitive information
    return res.status(200).json({ 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      } 
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(401).json({ error: 'Invalid session' });
  }
} 