// Simple logout endpoint
import { serialize } from 'cookie';

export default function handler(req, res) {
  // Clear the auth cookie
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    expires: new Date(0),
    path: '/',
    sameSite: 'lax'
  });
  
  res.setHeader('Set-Cookie', cookie);
  
  // Redirect to home page
  res.redirect('/');
} 