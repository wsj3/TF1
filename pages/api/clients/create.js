import prisma from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, address, dateOfBirth, notes } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if client with email already exists
    const existingClient = await prisma.client.findFirst({
      where: { email }
    });

    if (existingClient) {
      return res.status(400).json({ error: `A client with email ${email} already exists` });
    }

    // Create new client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || '',
        address: address || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        notes: notes || ''
      }
    });

    return res.status(201).json({ 
      success: true, 
      data: client,
      message: `Added new client: ${name}`
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({ 
      error: 'Failed to create client', 
      details: error.message 
    });
  }
} 