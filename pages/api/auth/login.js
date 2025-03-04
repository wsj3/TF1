// Custom authentication login API
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

// Mock user database - In production, use your actual database
const users = [
  { id: '1', email: 'demo@therapistsfriend.com', password: 'demo123', name: 'Demo User', role: 'therapist' }
];

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Find user with matching email and password
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get environment variables with fallbacks
    const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
    const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    console.log('Auth environment:', { 
      env: process.env.NODE_ENV,
      cookieName,
      hasJwtSecret: !!process.env.JWT_SECRET,
      isProduction,
      isDevelopment
    });

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '1d' }
    );

    // Set cookie options based on environment
    const cookieOptions = {
      httpOnly: true,
      // Only use secure=true in production or if explicitly enabled for development
      secure: isProduction, 
      sameSite: isProduction ? 'strict' : 'lax', // Less strict for development
      maxAge: 86400, // 1 day in seconds
      path: '/'
    };

    // Set HTTP cookie
    const cookie = serialize(cookieName, token, cookieOptions);

    // Set cookie header
    res.setHeader('Set-Cookie', cookie);

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
} 