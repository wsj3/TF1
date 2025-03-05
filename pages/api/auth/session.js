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
    
    // Check if JWT_SECRET is properly set
    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set, using default development secret');
    }
    
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[cookieName];
    
    // Debug info
    console.log('Session check:', {
      hasCookie: !!req.headers.cookie,
      cookieNames: Object.keys(cookies),
      cookieName: cookieName,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      host: req.headers.host,
      env: process.env.NODE_ENV,
      jwtSecretLength: jwtSecret ? jwtSecret.length : 0,
      jwtSecretFirstChars: jwtSecret ? jwtSecret.substring(0, 5) + '...' : 'none'
    });
    
    if (!token) {
      // Try alternative cookie names as fallback
      const altToken = cookies['auth_token'] || cookies['tf-auth-token'] || cookies['tf-token'];
      if (altToken) {
        console.log('No token found with configured name, but found alternative token');
      } else {
        console.log('No authentication token found in cookies');
      }
      return res.status(401).json({ error: 'Not authenticated', details: 'No token found in cookies' });
    }
    
    try {
      // Verify token
      const userData = jwt.verify(token, jwtSecret);
      console.log('Token verified successfully for user:', userData.email);
      
      // Return user data without sensitive information
      return res.status(200).json({ 
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        } 
      });
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      // Attempt to decode token without verification to see if structure is valid
      try {
        const decoded = jwt.decode(token);
        console.log('Token structure (unverified):', decoded ? 'Valid JSON structure' : 'Invalid token structure');
      } catch (decodeError) {
        console.error('Token decode failed:', decodeError.message);
      }
      return res.status(401).json({ 
        error: 'Invalid token', 
        details: tokenError.message 
      });
    }
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ 
      error: 'Failed to get session', 
      details: error.message 
    });
  }
} 