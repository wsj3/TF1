import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

// Create or get the PrismaClient instance
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req, res) {
  // Basic authentication check
  const jwtSecret = process.env.JWT_SECRET || 'default-development-secret';
  const cookieName = process.env.AUTH_COOKIE_NAME || 'tf-auth-token';
  
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[cookieName];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Verify token
  let therapistId;
  try {
    const userData = jwt.verify(token, jwtSecret);
    therapistId = userData.id;
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Client ID is required' });
  }
  
  console.log(`Processing ${req.method} request for client: ${id}`);

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return await getClient(req, res, id, therapistId);
    case 'PUT':
      return await updateClient(req, res, id, therapistId);
    case 'DELETE':
      return await deleteClient(req, res, id, therapistId);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// Get a client by ID
async function getClient(req, res, id, therapistId) {
  try {
    // Try to fetch the client
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        Note: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 1
        }
      }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Check if the client belongs to the requesting therapist
    if (client.therapistId !== therapistId && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'You do not have permission to view this client' });
    }
    
    return res.status(200).json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ error: 'Failed to fetch client data', details: error.message });
  }
}

// Update a client
async function updateClient(req, res, id, therapistId) {
  try {
    const { firstName, lastName, email, phone, status, notes } = req.body;
    
    console.log('Updating client with data:', {
      id,
      firstName,
      lastName,
      email,
      phone,
      status,
      hasNotes: !!notes
    });
    
    // First check if the client exists and belongs to the therapist
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: { Note: true }
    });
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // In development, allow any therapist to update
    if (existingClient.therapistId !== therapistId && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'You do not have permission to update this client' });
    }
    
    // Update the client data
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        status,
        updatedAt: new Date()
      },
      include: {
        Note: true
      }
    });
    
    // Handle notes separately
    if (notes && notes.trim() !== '') {
      // Check if there are existing notes
      if (existingClient.Note && existingClient.Note.length > 0) {
        // Update the existing note
        await prisma.note.update({
          where: { id: existingClient.Note[0].id },
          data: {
            content: notes,
            updatedAt: new Date()
          }
        });
      } else {
        // Create a new note
        await prisma.note.create({
          data: {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            content: notes,
            clientId: id,
            therapistId: therapistId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }
    
    // Fetch the updated client with notes
    const result = await prisma.client.findUnique({
      where: { id },
      include: {
        Note: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ error: 'Failed to update client', details: error.message });
  }
}

// Delete a client
async function deleteClient(req, res, id, therapistId) {
  try {
    // First check if the client exists and belongs to the therapist
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // In development, allow any therapist to delete
    if (existingClient.therapistId !== therapistId && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'You do not have permission to delete this client' });
    }
    
    // Delete associated notes first (handle cascading manually)
    await prisma.note.deleteMany({
      where: { clientId: id }
    });
    
    // Then delete the client
    await prisma.client.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({ error: 'Failed to delete client', details: error.message });
  }
} 