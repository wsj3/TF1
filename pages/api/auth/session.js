// Custom authentication session API
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { authConfig } from '../../../utils/auth';
import cookie from 'cookie';

export default async function handler(req, res) {
  // Only allow GET for session checks
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[authConfig.cookieName];
    
    // Debug info
    console.log('Session check:', {
      hasCookie: !!req.headers.cookie,
      cookieNames: Object.keys(cookies),
      cookieName: authConfig.cookieName,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      host: req.headers.host,
      env: process.env.NODE_ENV
    });
    
    if (!token) {
      // Clear any existing invalid cookies
      res.setHeader('Set-Cookie', [
        cookie.serialize(authConfig.cookieName, '', {
          maxAge: -1,
          path: '/'
        }),
        cookie.serialize('auth', '', {
          maxAge: -1,
          path: '/'
        })
      ]);
      
      return res.status(401).json({ error: 'Not authenticated', details: 'No token found in cookies' });
    }
    
    try {
      // Verify token
      const userData = jwt.verify(token, authConfig.jwtSecret);
      console.log('Token verified successfully for user:', userData.email);
      
      // Return user data without sensitive information
      return res.status(200).json({ 
        user: {
          id: userData.userId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isAdmin: userData.isAdmin
        } 
      });
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      
      // Clear invalid token
      res.setHeader('Set-Cookie', [
        cookie.serialize(authConfig.cookieName, '', {
          maxAge: -1,
          path: '/'
        }),
        cookie.serialize('auth', '', {
          maxAge: -1,
          path: '/'
        })
      ]);
      
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