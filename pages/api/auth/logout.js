// Custom authentication logout API
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Only allow POST for logout
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables with fallbacks
    const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Clear the auth cookie by setting an expired cookie
    const cookie = serialize(cookieName, '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: -1, // Expire immediately
      path: '/'
    });

    // Set the cookie header
    res.setHeader('Set-Cookie', cookie);

    // Return success message
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
} 