// Custom authentication logout API
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Only allow POST for logout
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear the auth cookie by setting an expired cookie
    const cookie = serialize(
      process.env.AUTH_COOKIE_NAME || 'tf-auth-token',
      '',
      {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: -1, // Expire immediately
        path: '/',
        sameSite: 'strict'
      }
    );

    // Set the cookie header
    res.setHeader('Set-Cookie', cookie);

    // Return success message
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
} 