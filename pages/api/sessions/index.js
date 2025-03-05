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
  console.log('*** API SESSIONS HANDLER CALLED ***');
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
  
  // Check authentication using custom auth system
  const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
  const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
  
  // Log environment variables for debugging
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
  console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('- AUTH_COOKIE_NAME:', process.env.AUTH_COOKIE_NAME);
  
  // Parse cookies from request
  const cookies = parse(req.headers.cookie || '');
  const allCookieNames = Object.keys(cookies);
  console.log('Available cookies:', allCookieNames);
  
  // Check if this is a development/demo mode where we should bypass auth
  const isDemoMode = req.headers['x-demo-mode'] === 'true' || req.query.demo === 'true';
  if (isDemoMode) {
    console.log('RUNNING IN DEMO MODE - bypassing authentication');
    // In demo mode, use a fixed therapist ID
    const mappedTherapistId = 'demo-user-id';
    return handleRequest(req, res, mappedTherapistId);
  }
  
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
    
    return handleRequest(req, res, mappedTherapistId);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized - ' + error.message });
  }
}

// Handle the actual request after authentication
async function handleRequest(req, res, therapistId) {
  if (req.method === 'GET') {
    try {
      // Extract query parameters
      const { startDate, endDate, start, end, status, clientId } = req.query;
      
      // Set up filter conditions based on request parameters
      let where = { therapistId: therapistId };
      
      // Add date range filter if provided (support both naming styles)
      const startDateValue = start || startDate;
      const endDateValue = end || endDate;
      
      if (startDateValue && endDateValue) {
        console.log(`Using date range: ${startDateValue} to ${endDateValue}`);
        where.startTime = {
          gte: new Date(startDateValue),
          lte: new Date(endDateValue),
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
      try {
        const allSessions = await prisma.session.findMany({
          take: 5 // Just get a sample for debugging
        });
        console.log('Debug: Found', allSessions.length > 0 ? 'some' : 'no', 'sessions in database (sample)');
        
        if (allSessions.length > 0) {
          console.log('Sample session from database:', JSON.stringify({
            id: allSessions[0].id,
            therapistId: allSessions[0].therapistId,
            startTime: allSessions[0].startTime
          }, null, 2));
        }
      } catch (countError) {
        console.error('Error getting sample sessions:', countError);
      }
      
      // Fetch sessions based on the filter conditions
      try {
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
      } catch (queryError) {
        console.error('Session query error:', queryError);
        return res.status(500).json({ 
          error: 'Failed to fetch sessions', 
          details: queryError.message,
          code: queryError.code,
          stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
    } finally {
      // Clean up Prisma connection in development mode
      if (process.env.NODE_ENV !== 'production') {
        await prisma.$disconnect();
      }
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
          therapistId,
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
    } finally {
      // Clean up Prisma connection in development mode
      if (process.env.NODE_ENV !== 'production') {
        await prisma.$disconnect();
      }
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 