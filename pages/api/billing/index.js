import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Add error handling and logging to diagnose issues
  console.log('API route /api/billing called with method:', req.method);
  
  try {
    // For debugging
    const demoMode = req.query.demo === 'true';
    
    // Log environment variables to help debug
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getBillingRecords(req, res, demoMode);
      case 'POST':
        return await createBillingRecord(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in billing API:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Get all billing records
async function getBillingRecords(req, res, demoMode) {
  try {
    // Return demo data if in demo mode
    if (demoMode) {
      console.log('Returning demo billing data');
      return res.status(200).json({
        billingRecords: generateDemoBillingRecords(),
        message: 'Demo billing data retrieved successfully',
        demoMode: true
      });
    }
    
    // Skip auth for now to check if API works
    console.log('Fetching billing records from database...');
    
    const billingRecords = await prisma.billing.findMany({
      include: {
        Client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        Session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log(`Found ${billingRecords.length} billing records in the database`);
    
    return res.status(200).json({
      billingRecords,
      message: 'Billing records retrieved successfully',
      count: billingRecords.length
    });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    throw error;
  }
}

// Create a new billing record
async function createBillingRecord(req, res) {
  const { clientId, therapistId, sessionId, amount, status, dateBilled, datePaid, insuranceClaimId, notes } = req.body;
  
  if (!clientId || !amount) {
    return res.status(400).json({ error: 'Client ID and amount are required' });
  }
  
  try {
    const billingRecord = await prisma.billing.create({
      data: {
        clientId,
        therapistId,
        sessionId,
        amount: parseFloat(amount),
        status: status || 'PENDING',
        dateBilled: dateBilled ? new Date(dateBilled) : new Date(),
        datePaid: datePaid ? new Date(datePaid) : null,
        insuranceClaimId,
        notes,
        updatedAt: new Date()
      }
    });
    
    return res.status(201).json({
      billingRecord,
      message: 'Billing record created successfully'
    });
  } catch (error) {
    console.error('Error creating billing record:', error);
    throw error;
  }
}

// Generate demo billing records if needed
function generateDemoBillingRecords() {
  return [
    {
      id: 'demo-billing-1',
      amount: 150.00,
      status: 'PAID',
      dateBilled: new Date(new Date().setDate(new Date().getDate() - 7)),
      datePaid: new Date(new Date().setDate(new Date().getDate() - 5)),
      insuranceClaimId: '12345',
      notes: 'Insurance payment received in full',
      Client: {
        id: 'client-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.j@example.com'
      },
      Session: {
        id: 'session-1',
        startTime: new Date(new Date().setDate(new Date().getDate() - 7)),
        endTime: new Date(new Date().setDate(new Date().getDate() - 7).setHours(new Date().getHours() + 1)),
        status: 'COMPLETED'
      }
    },
    {
      id: 'demo-billing-2',
      amount: 150.00,
      status: 'SUBMITTED',
      dateBilled: new Date(new Date().setDate(new Date().getDate() - 14)),
      datePaid: null,
      insuranceClaimId: '12346',
      notes: 'Submitted to insurance, awaiting response',
      Client: {
        id: 'client-2',
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'mwilliams@example.com'
      },
      Session: {
        id: 'session-2',
        startTime: new Date(new Date().setDate(new Date().getDate() - 14)),
        endTime: new Date(new Date().setDate(new Date().getDate() - 14).setHours(new Date().getHours() + 1)),
        status: 'COMPLETED'
      }
    },
    {
      id: 'demo-billing-3',
      amount: 200.00,
      status: 'PENDING',
      dateBilled: new Date(new Date().setDate(new Date().getDate() - 21)),
      datePaid: null,
      insuranceClaimId: null,
      notes: 'Initial assessment, to be submitted to insurance',
      Client: {
        id: 'client-3',
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily.b@example.com'
      },
      Session: {
        id: 'session-3',
        startTime: new Date(new Date().setDate(new Date().getDate() - 21)),
        endTime: new Date(new Date().setDate(new Date().getDate() - 21).setHours(new Date().getHours() + 1.5)),
        status: 'COMPLETED'
      }
    }
  ];
} 