// Simple custom authentication API endpoint
import { serialize } from 'cookie';

// Demo users (same as in NextAuth config)
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'demo@therapistsfriend.com',
    password: 'demo123',
    role: 'therapist'
  },
  {
    id: 2,
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password',
    role: 'therapist'
  }
];

export default function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get credentials from request body
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => 
      user.email === email && 
      user.password === password
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create a simple session token (in a real app, use JWT or proper session management)
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    })).toString('base64');
    
    // Set cookie
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      sameSite: 'lax'
    });
    
    res.setHeader('Set-Cookie', cookie);
    
    // Return success with user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 