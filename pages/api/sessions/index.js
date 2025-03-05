import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Check authentication using custom auth system
  const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
  const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
  
  // Parse cookies from request
  const cookies = parse(req.headers.cookie || '');
  const allCookieNames = Object.keys(cookies);
  console.log('Available cookies:', allCookieNames);
  
  // Try different cookie names for auth token
  let token = cookies[cookieName] || cookies['auth_token'];
  
  if (!token) {
    console.log('No auth token found in cookies');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Verify token
  let therapistId;
  let mappedTherapistId; // Declare outside try block so it's available in the entire handler function
  
  try {
    // For JWT token format
    if (token.includes('.')) {
      console.log('Using JWT token format');
      const userData = jwt.verify(token, jwtSecret);
      console.log('JWT token data:', userData);
      therapistId = userData.id;
    } 
    // For custom base64 token format (legacy)
    else {
      console.log('Using base64 token format');
      const userData = JSON.parse(Buffer.from(token, 'base64').toString());
      console.log('Base64 token data:', userData);
      therapistId = userData.id;
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
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Extract query parameters
      const { startDate, endDate, status, clientId } = req.query;
      
      // Set up filter conditions based on request parameters
      let where = { therapistId: mappedTherapistId };
      
      // Add date range filter if provided
      if (startDate && endDate) {
        where.startTime = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }
      
      // Add status filter if provided
      if (status) {
        where.status = status;
      }
      
      // Add client filter if provided
      if (clientId) {
        where.clientId = clientId;
      }
      
      console.log('Fetching sessions with filter:', JSON.stringify(where, null, 2));
      
      // Count total sessions for debugging
      const allSessions = await prisma.session.findMany();
      console.log('Debug: Found', allSessions.length, 'sessions total in database');
      
      if (allSessions.length > 0) {
        console.log('Sample session from database:', JSON.stringify(allSessions[0], null, 2));
      }
      
      // Fetch sessions based on the filter conditions
      const sessions = await prisma.session.findMany({
        where,
        include: {
          Client: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      });
      
      console.log(`Found ${sessions.length} sessions matching filter`);
      
      // Log a sample of the filtered sessions if available
      if (sessions.length > 0) {
        console.log('Sample filtered session:', JSON.stringify({
          id: sessions[0].id,
          startTime: sessions[0].startTime,
          endTime: sessions[0].endTime,
          status: sessions[0].status,
          clientId: sessions[0].clientId,
          therapistId: sessions[0].therapistId,
          hasClient: !!sessions[0].Client
        }, null, 2));
      }
      
      // Return sessions directly as an array for consistency
      return res.status(200).json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { clientId, startTime, endTime, status = 'SCHEDULED' } = req.body;
      
      // Validate required fields
      if (!clientId || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create new session
      const newSession = await prisma.session.create({
        data: {
          clientId,
          therapistId: mappedTherapistId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          status,
          updatedAt: new Date(),
        },
      });
      
      return res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Failed to create session', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 