// Custom authentication login API
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import cookie from 'cookie';
import { authConfig } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email }); // Debug log

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isAdmin: true,
        role: true,
        status: true,
        name: true
      }
    });

    console.log('User found:', { exists: !!user }); // Debug log

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    console.log('Password verification:', { isValid }); // Debug log

    if (!isValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('Login failed: Account not active');
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Create session token
    const token = sign(
      { 
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
        name: user.name
      },
      authConfig.jwtSecret,
      { expiresIn: '24h' }
    );

    // Set cookie
    const cookieOptions = {
      ...authConfig.cookieOptions,
      maxAge: 24 * 60 * 60 * 1000 // Convert to milliseconds
    };

    res.setHeader('Set-Cookie', cookie.serialize(authConfig.cookieName, token, cookieOptions));

    console.log('Login successful, setting cookie:', { 
      cookieName: authConfig.cookieName,
      email: user.email,
      options: cookieOptions
    });

    // Remove sensitive data
    const { password: _, ...userData } = user;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
} 