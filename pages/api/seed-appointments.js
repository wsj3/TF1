import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const prisma = new PrismaClient();
  
  try {
    // First, get some client IDs to use for appointments
    const clients = await prisma.client.findMany({
      take: 5
    });
    
    if (clients.length === 0) {
      return res.status(400).json({ 
        error: 'No clients found',
        message: 'Please create some clients first'
      });
    }
    
    // Sample appointment data
    const appointmentData = [
      {
        clientId: clients[0].id,
        startTime: new Date('2024-03-23T10:00:00Z'),
        endTime: new Date('2024-03-23T11:00:00Z'),
        duration: 60,
        notes: 'Initial consultation',
        type: 'Regular Session',
        status: 'Scheduled'
      },
      {
        clientId: clients[0].id,
        startTime: new Date('2024-03-25T14:30:00Z'),
        endTime: new Date('2024-03-25T15:30:00Z'),
        duration: 60,
        notes: 'Follow-up session',
        type: 'Regular Session',
        status: 'Scheduled'
      },
      {
        clientId: clients[1].id,
        startTime: new Date('2024-03-24T09:00:00Z'),
        endTime: new Date('2024-03-24T10:00:00Z'),
        duration: 60,
        notes: 'Initial consultation',
        type: 'Regular Session',
        status: 'Scheduled'
      }
    ];
    
    // Create the appointments
    const createdAppointments = [];
    for (const appointment of appointmentData) {
      try {
        const created = await prisma.appointment.create({
          data: appointment
        });
        createdAppointments.push(created);
      } catch (err) {
        console.error('Error creating appointment:', err);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Created ${createdAppointments.length} appointments`,
      appointments: createdAppointments
    });
  } catch (error) {
    console.error('Error seeding appointments:', error);
    return res.status(500).json({ 
      error: 'Failed to seed appointments',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
} 