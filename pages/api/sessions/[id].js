import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log('*** API INDIVIDUAL SESSION HANDLER CALLED ***');
  console.log('Request method:', req.method);
  console.log('Request query params:', req.query);
  console.log('Session ID requested:', req.query.id);
  
  // Check authentication using custom auth system
  const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
  const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
  
  // Parse cookies from request
  const cookies = parse(req.headers.cookie || '');
  const allCookieNames = Object.keys(cookies);
  console.log('Available cookies:', allCookieNames);
  
  // Try different cookie names for auth token
  let token = cookies[cookieName] || cookies['auth_token'] || cookies['tf-auth-token'];
  
  if (!token) {
    console.log('No auth token found in cookies');
    return res.status(401).json({ error: 'Unauthorized - No valid auth token found' });
  }
  
  // Verify token
  let therapistId;
  let mappedTherapistId; // Declare outside try block so it's available in the entire handler function
  
  try {
    // For JWT token format
    if (token.includes('.')) {
      console.log('Using JWT token format');
      try {
        const userData = jwt.verify(token, jwtSecret);
        console.log('JWT token data:', userData);
        therapistId = userData.id;
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        return res.status(401).json({ error: 'Invalid JWT token', details: jwtError.message });
      }
    } 
    // For custom base64 token format (legacy)
    else {
      console.log('Using base64 token format');
      try {
        const userData = JSON.parse(Buffer.from(token, 'base64').toString());
        console.log('Base64 token data:', userData);
        therapistId = userData.id;
      } catch (base64Error) {
        console.error('Base64 token parsing error:', base64Error);
        return res.status(401).json({ error: 'Invalid token format', details: base64Error.message });
      }
    }
    
    if (!therapistId) {
      throw new Error('No therapist ID in token');
    }
    
    console.log('Using therapistId:', therapistId);

    // Map user ID '1' to 'demo-user-id' (to match database records)
    mappedTherapistId = therapistId === '1' ? 'demo-user-id' : therapistId;
    console.log('Mapped therapistId for database query:', mappedTherapistId);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized - ' + error.message });
  }

  const { id } = req.query;

  // Find the session by ID
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      Client: true,
    },
  });
  
  // Check if the session exists and belongs to the authenticated therapist
  if (!session || session.therapistId !== mappedTherapistId) {
    return res.status(403).json({ error: 'Unauthorized access to this session' });
  }

  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      const sessionData = await prisma.session.findUnique({
        where: { id },
        include: {
          Client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          Note: {
            where: {
              noteType: 'SESSION_NOTE',
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return res.status(200).json(sessionData);
    } catch (error) {
      console.error('Error fetching session:', error);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { startTime, endTime, status } = req.body;
      
      // Update session
      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          ...(startTime && { startTime: new Date(startTime) }),
          ...(endTime && { endTime: new Date(endTime) }),
          ...(status && { status }),
          updatedAt: new Date(),
        },
      });
      
      return res.status(200).json(updatedSession);
    } catch (error) {
      console.error('Error updating session:', error);
      return res.status(500).json({ error: 'Failed to update session' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if session has associated notes
      const sessionWithNotes = await prisma.session.findUnique({
        where: { id },
        include: {
          Note: true,
        },
      });

      if (sessionWithNotes.Note.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete session with existing notes. Update the status to CANCELLED instead.' 
        });
      }

      // Delete session if no notes
      await prisma.session.delete({
        where: { id },
      });
      
      return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({ error: 'Failed to delete session' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 