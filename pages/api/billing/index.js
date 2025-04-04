import { PrismaClient } from '@prisma/client';
import { createSafeApiEndpoint } from '../../../utils/apiHelpers';

const prisma = new PrismaClient();

// API handler function
async function apiHandler(req, res) {
  const { method } = req;
  const { startDate, endDate } = req.query;
  
  if (method === 'GET') {
    try {
      const billingRecords = await prisma.billing.findMany({
        where: {
          ...(startDate && endDate ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          } : {})
        },
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
          date: 'desc'
        }
      });
      
      return res.status(200).json({
        success: true,
        data: billingRecords
      });
    } catch (error) {
      throw new Error(`Failed to fetch billing records: ${error.message}`);
    }
  } else if (method === 'POST') {
    const { clientId, amount, date, description, status } = req.body;
    
    if (!clientId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client ID and amount are required' 
      });
    }
    
    try {
      const billingRecord = await prisma.billing.create({
        data: {
          clientId,
          amount: parseFloat(amount),
          date: date ? new Date(date) : new Date(),
          description: description || '',
          status: status || 'PENDING'
        }
      });
      
      return res.status(201).json({
        success: true,
        data: billingRecord
      });
    } catch (error) {
      throw new Error(`Failed to create billing record: ${error.message}`);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
  }
}

// Demo data generator function
function generateDemoBillingData() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(today.getMonth() - 2);
  
  return [
    {
      id: 'demo-billing-1',
      amount: 150.00,
      date: today.toISOString(),
      description: 'Therapy session - 60 min',
      status: 'PAID',
      clientId: 'demo-client-1',
      client: {
        id: 'demo-client-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com'
      }
    },
    {
      id: 'demo-billing-2',
      amount: 200.00,
      date: lastMonth.toISOString(),
      description: 'Initial assessment - 90 min',
      status: 'PAID',
      clientId: 'demo-client-2',
      client: {
        id: 'demo-client-2',
        firstName: 'Michael',
        lastName: 'Williams',
        email: 'michael@example.com'
      }
    },
    {
      id: 'demo-billing-3',
      amount: 150.00,
      date: twoMonthsAgo.toISOString(),
      description: 'Therapy session - 60 min',
      status: 'PENDING',
      clientId: 'demo-client-3',
      client: {
        id: 'demo-client-3',
        firstName: 'Emily',
        lastName: 'Brown',
        email: 'emily@example.com'
      }
    }
  ];
}

export default createSafeApiEndpoint(apiHandler, generateDemoBillingData); 