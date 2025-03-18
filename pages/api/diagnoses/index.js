import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Add error handling and logging to diagnose issues
  console.log('API route /api/diagnoses called with method:', req.method);
  
  try {
    // For debugging
    const demoMode = req.query.demo === 'true';
    
    // Log environment variables to help debug
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getDiagnoses(req, res, demoMode);
      case 'POST':
        return await createDiagnosis(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in diagnoses API:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Get all diagnoses
async function getDiagnoses(req, res, demoMode) {
  try {
    // Return demo data if in demo mode
    if (demoMode) {
      console.log('Returning demo diagnosis data');
      return res.status(200).json({
        diagnoses: generateDemoDiagnoses(),
        message: 'Demo diagnosis data retrieved successfully',
        demoMode: true
      });
    }
    
    // Skip auth for now to check if API works
    console.log('Fetching diagnoses from database...');
    
    const diagnoses = await prisma.diagnosis.findMany({
      include: {
        Client: {
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
    
    console.log(`Found ${diagnoses.length} diagnoses in the database`);
    
    return res.status(200).json({
      diagnoses,
      message: 'Diagnoses retrieved successfully',
      count: diagnoses.length
    });
  } catch (error) {
    console.error('Error fetching diagnoses:', error);
    throw error;
  }
}

// Create a new diagnosis
async function createDiagnosis(req, res) {
  const { clientId, therapistId, code, description, notes, diagnosisDate } = req.body;
  
  if (!clientId || !code) {
    return res.status(400).json({ error: 'Client ID and diagnosis code are required' });
  }
  
  try {
    const diagnosis = await prisma.diagnosis.create({
      data: {
        clientId,
        therapistId,
        code,
        description,
        notes,
        diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : new Date(),
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });
    
    return res.status(201).json({
      diagnosis,
      message: 'Diagnosis created successfully'
    });
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    throw error;
  }
}

// Generate demo diagnoses if needed
function generateDemoDiagnoses() {
  return [
    {
      id: 'demo-diagnosis-1',
      code: 'F41.1',
      description: 'Generalized Anxiety Disorder',
      notes: 'Persistent and excessive anxiety and worry about various domains, including work and school performance, that the individual finds difficult to control.',
      diagnosisDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      status: 'ACTIVE',
      Client: {
        id: 'client-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.j@example.com'
      }
    },
    {
      id: 'demo-diagnosis-2',
      code: 'F33.1',
      description: 'Major Depressive Disorder, Recurrent, Moderate',
      notes: 'Depressed mood or loss of interest in activities for most of the day, nearly every day, as indicated by subjective report or observation, along with other symptoms.',
      diagnosisDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      status: 'ACTIVE',
      Client: {
        id: 'client-2',
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'mwilliams@example.com'
      }
    },
    {
      id: 'demo-diagnosis-3',
      code: 'F43.10',
      description: 'Post-Traumatic Stress Disorder',
      notes: 'Development of characteristic symptoms following exposure to one or more traumatic events.',
      diagnosisDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      status: 'ACTIVE',
      Client: {
        id: 'client-3',
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily.b@example.com'
      }
    }
  ];
} 