import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const prisma = new PrismaClient();
  
  try {
    // Get list of tables using Prisma's queryRaw
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    // Get schema for Appointment table if it exists
    const appointmentSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Appointment'
      ORDER BY ordinal_position;
    `;
    
    // Count appointments
    let appointmentCount = 0;
    let appointments = [];
    try {
      // Try to count appointments if the table exists
      appointmentCount = await prisma.appointment.count();
      
      // Get a sample of appointments if any exist
      if (appointmentCount > 0) {
        appointments = await prisma.appointment.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        });
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
    
    return res.status(200).json({
      tables,
      appointmentSchema,
      appointmentCount,
      appointments,
      prismaModelExists: 'appointment' in prisma,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') // Hide password
    });
  } catch (error) {
    console.error('Database debug error:', error);
    return res.status(500).json({ 
      error: 'Database debug error', 
      message: error.message,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
} 