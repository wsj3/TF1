// Custom authentication session API
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { authConfig, getServerSideSession } from '../../../utils/auth';
import cookie from 'cookie';

/**
 * API endpoint to get the current user session
 * For development, this will provide a mock user if no session exists
 */
export default async function handler(req, res) {
  try {
    // Try to get the real session
    const session = await getServerSideSession(req);
    
    // If we're in development and there's no session, return a mock user
    if (!session && process.env.NODE_ENV === 'development') {
      console.log('[API] Using mock user session for development');
      
      return res.status(200).json({
        success: true,
        user: {
          id: 'dev-user-1',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'admin',
          isAdmin: true
        }
      });
    }
    
    // Return the real session if it exists
    if (session && session.user) {
      return res.status(200).json({
        success: true,
        user: session.user
      });
    }
    
    // No session found
    return res.status(200).json({
      success: false,
      message: 'No active session found'
    });
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get session',
      error: error.message
    });
  }
} 