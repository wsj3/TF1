import { PrismaClient } from '@prisma/client';
import { getIronSession } from 'iron-session';
import { ironOptions } from '../../../lib/config';
import { createSafeApiEndpoint } from '../../../utils/apiHelpers';

// Don't initialize Prisma globally - we'll use the instance passed by createSafeApiEndpoint

// API handler function that handles the Iron Session
async function apiHandler(req, res, prisma) {
  // Get the session using iron-session
  req.session = await getIronSession(req, res, ironOptions);
  const user = req.session?.user;
  
  // Check authentication
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const { method } = req;
  if (method === 'GET') {
    try {
      console.log('Fetching diagnoses with prisma:', !!prisma);
      const diagnoses = await prisma.diagnosis.findMany({
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          dateAssigned: 'desc'
        }
      });
      
      console.log(`Found ${diagnoses.length} diagnoses`);
      return res.status(200).json({
        success: true,
        data: diagnoses
      });
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      throw new Error(`Failed to fetch diagnoses: ${error.message}`);
    }
  } else if (method === 'POST') {
    const { clientId, therapistId, code, description, notes, diagnosisDate } = req.body;
    
    if (!clientId || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client ID and diagnosis code are required' 
      });
    }
    
    try {
      const diagnosis = await prisma.diagnosis.create({
        data: {
          clientId,
          therapistId: therapistId || user.id,
          code,
          description,
          notes,
          diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : new Date(),
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
      
      return res.status(201).json({
        success: true,
        data: diagnosis
      });
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      throw new Error(`Failed to create diagnosis: ${error.message}`);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
  }
}

// Demo data generator function
function generateDemoDiagnoses() {
  const today = new Date();
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(today.getMonth() - 2);
  const fourMonthsAgo = new Date(today);
  fourMonthsAgo.setMonth(today.getMonth() - 4);
  
  return {
    success: true,
    data: [
      {
        id: 'demo-diagnosis-1',
        code: 'F41.1',
        description: 'Generalized Anxiety Disorder',
        notes: 'Persistent and excessive anxiety and worry about various domains, including work and school performance, that the individual finds difficult to control.',
        dateAssigned: twoMonthsAgo.toISOString(),
        status: 'ACTIVE',
        clientId: 'demo-client-1',
        therapistId: 'demo-therapist-1',
        client: {
          id: 'demo-client-1',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com'
        }
      },
      {
        id: 'demo-diagnosis-2',
        code: 'F33.1',
        description: 'Major Depressive Disorder, Recurrent, Moderate',
        notes: 'Depressed mood or loss of interest in activities for most of the day, nearly every day, for at least 2 weeks.',
        dateAssigned: fourMonthsAgo.toISOString(),
        status: 'ACTIVE',
        clientId: 'demo-client-2',
        therapistId: 'demo-therapist-1',
        client: {
          id: 'demo-client-2',
          firstName: 'Michael',
          lastName: 'Williams',
          email: 'michael@example.com'
        }
      },
      {
        id: 'demo-diagnosis-3',
        code: 'F43.10',
        description: 'Post-Traumatic Stress Disorder',
        notes: 'Development of characteristic symptoms following exposure to an extreme traumatic stressor.',
        dateAssigned: today.toISOString(),
        status: 'ACTIVE',
        clientId: 'demo-client-3',
        therapistId: 'demo-therapist-1',
        client: {
          id: 'demo-client-3',
          firstName: 'Emily',
          lastName: 'Brown',
          email: 'emily@example.com'
        }
      }
    ]
  };
}

// Export with safe API endpoint wrapper
export default createSafeApiEndpoint(apiHandler, generateDemoDiagnoses); 