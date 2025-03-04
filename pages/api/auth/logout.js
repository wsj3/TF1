// Logout API endpoint
import { serialize } from 'cookie';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get environment variables with fallbacks
    const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Determine if we're on Vercel based on headers or environment
    const isVercel = req.headers.host?.includes('vercel.app') || 
                    process.env.VERCEL === '1' ||
                    !!process.env.VERCEL_URL;
    
    // Clear the auth cookie by setting an expired cookie
    const cookie = serialize(cookieName, '', {
      httpOnly: true,
      secure: isProduction || isVercel,
      sameSite: isVercel ? 'none' : (isProduction ? 'strict' : 'lax'),
      maxAge: -1, // Expire immediately
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
} 