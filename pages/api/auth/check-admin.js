import prisma from '../../../lib/prisma';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get environment variables with fallbacks
    const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
    const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
    
    // Parse cookies from request
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[cookieName];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Verify token
    const userData = jwt.verify(token, jwtSecret);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
      select: {
        id: true,
        email: true,
        role: true,
        isAdmin: true,
        status: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      message: 'User status retrieved successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Check admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 