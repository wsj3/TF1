// Simple session verification endpoint
import { parse } from 'cookie';

export default function handler(req, res) {
  try {
    // Get the auth token from cookies
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Decode the token
    const userData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired
    if (userData.exp < Date.now()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Return the user data
    return res.status(200).json({ 
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(401).json({ error: 'Invalid session' });
  }
} 