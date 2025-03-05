import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

// Use a singleton pattern to avoid multiple connections in development
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use global object to maintain connection between HMR
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

export default async function handler(req, res) {
  console.log('*** API SESSION DETAIL HANDLER CALLED ***');
  console.log('Request method:', req.method);
  console.log('Request query params:', req.query);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Check for cookies directly
  const rawCookies = req.headers.cookie;
  console.log('Raw cookie header:', rawCookies);
  
  // Check environment and connection
  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
  } catch (dbError) {
    console.error('DATABASE CONNECTION ERROR:', dbError);
    return res.status(500).json({ 
      error: 'Database connection failed', 
      details: dbError.message,
      stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined 
    });
  }
  
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  // Log environment variables for debugging
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
  console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('- AUTH_COOKIE_NAME:', process.env.AUTH_COOKIE_NAME);
  
  // Check authentication using custom auth system
  const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
  const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
  
  // Parse cookies from request
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const allCookieNames = Object.keys(cookies);
  console.log('Available cookies:', allCookieNames);
  
  // Check if this is a development/demo mode
  const isDemoMode = req.headers['x-demo-mode'] === 'true' || req.query.demo === 'true';
  if (isDemoMode) {
    console.log('RUNNING IN DEMO MODE - bypassing authentication');
    // In demo mode, use a fixed therapist ID
    const mappedTherapistId = 'demo-user-id';
    return handleRequest(req, res, id, mappedTherapistId);
  }
  
  // Try different cookie names for auth token
  let token = cookies[cookieName] || cookies['auth_token'] || cookies['tf-auth-token'];
  
  if (!token) {
    console.log('No auth token found in cookies');
    return res.status(401).json({ error: 'Unauthorized - No valid auth token found' });
  }
  
  // Verify token
  let therapistId;
  let mappedTherapistId; // Declare outside try block
  
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
    // For base64 token format (legacy)
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
    
    // Map user ID '1' to 'demo-user-id' if needed
    mappedTherapistId = therapistId === '1' ? 'demo-user-id' : therapistId;
    console.log('Mapped therapistId for database query:', mappedTherapistId);
    
    return handleRequest(req, res, id, mappedTherapistId);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized - ' + error.message });
  }
}

// Handle the actual request after authentication
async function handleRequest(req, res, sessionId, therapistId) {
  try {
    // First check if session exists at all
    console.log(`Looking for session with ID: ${sessionId}`);
    const sessionExists = await prisma.session.findFirst({
      where: { id: sessionId },
      select: { id: true, therapistId: true }
    });
    
    if (!sessionExists) {
      console.log(`Session with ID ${sessionId} not found`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log('Session belongs to therapist:', sessionExists.therapistId);
    
    // For security, only allow access to sessions that belong to the authenticated therapist
    // Unless we're in admin or demo mode
    const isAdmin = false; // Implement admin role check if needed
    const isAuthorized = isAdmin || sessionExists.therapistId === therapistId;
    
    if (!isAuthorized) {
      console.log('Unauthorized access attempt - session belongs to different therapist');
      return res.status(403).json({ 
        error: 'Not authorized to access this session',
        requestedBy: therapistId,
        belongsTo: sessionExists.therapistId
      });
    }
    
    if (req.method === 'GET') {
      // Retrieve session with client info
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          Client: true,
        },
      });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      return res.status(200).json(session);
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const { clientId, startTime, endTime, status, notes } = req.body;
      
      // Prepare update data (only include fields that are provided)
      const updateData = {};
      if (clientId !== undefined) updateData.clientId = clientId;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      
      updateData.updatedAt = new Date();
      
      // Update session
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });
      
      return res.status(200).json(updatedSession);
    } else if (req.method === 'DELETE') {
      // Delete session
      await prisma.session.delete({
        where: { id: sessionId },
      });
      
      return res.status(204).send();
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling session:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up Prisma connection in development mode
    if (process.env.NODE_ENV !== 'production') {
      await prisma.$disconnect();
    }
  }
} 