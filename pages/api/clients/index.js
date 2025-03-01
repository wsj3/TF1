import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          status: true,
          therapist: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          lastName: 'asc',
        },
      });
      
      // Map the clients to match our frontend expectations
      const mappedClients = clients.map(client => ({
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email || '',
        phone: client.phoneNumber || '',
        status: client.status,
        therapist: client.therapist?.name || ''
      }));
      
      res.status(200).json(mappedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const data = req.body;
      
      const client = await prisma.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phone,
          status: data.status || 'ACTIVE',
          therapistId: data.therapistId,
        },
      });
      
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ error: 'Failed to create client', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 