// API endpoint to diagnose data loading issues
import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    console.log('Diagnosing database access...');
    
    // Counters to track record types
    const counts = {};
    const errors = {};
    
    // Check User records
    try {
      counts.users = await prisma.user.count();
    } catch (error) {
      errors.users = error.message;
    }
    
    // Check Client records
    try {
      counts.clients = await prisma.client.count();
    } catch (error) {
      errors.clients = error.message;
    }
    
    // Check Session records
    try {
      counts.sessions = await prisma.session.count();
    } catch (error) {
      errors.sessions = error.message;
    }
    
    // Check Task records
    try {
      counts.tasks = await prisma.task.count();
    } catch (error) {
      errors.tasks = error.message;
    }
    
    // Check Diagnosis records
    try {
      counts.diagnoses = await prisma.diagnosis.count();
    } catch (error) {
      errors.diagnoses = error.message;
    }
    
    // Check Billing records
    try {
      counts.billing = await prisma.billing.count();
    } catch (error) {
      errors.billing = error.message;
    }
    
    // Check Treatment Plan records
    try {
      counts.treatmentPlans = await prisma.treatmentPlan.count();
    } catch (error) {
      errors.treatmentPlans = error.message;
    }
    
    // Check Goal records
    try {
      counts.goals = await prisma.goal.count();
    } catch (error) {
      errors.goals = error.message;
    }
    
    // Check Note records
    try {
      counts.notes = await prisma.note.count();
    } catch (error) {
      errors.notes = error.message;
    }
    
    // Get sample records if available
    const samples = {};
    
    if (counts.sessions > 0) {
      samples.sessions = await prisma.session.findMany({
        take: 2,
        include: { Client: true }
      });
    }
    
    if (counts.tasks > 0) {
      samples.tasks = await prisma.task.findMany({
        take: 2,
        include: { Client: true }
      });
    }
    
    if (counts.diagnoses > 0) {
      samples.diagnoses = await prisma.diagnosis.findMany({
        take: 2,
        include: { Client: true }
      });
    }
    
    if (counts.billing > 0) {
      samples.billing = await prisma.billing.findMany({
        take: 2,
        include: { Client: true }
      });
    }
    
    // Check database schema
    const dbSchema = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableNames = dbSchema.map(table => table.table_name);
    
    // Return diagnostic results
    res.status(200).json({
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tables: tableNames
      },
      counts,
      errors: Object.keys(errors).length > 0 ? errors : null,
      samples: samples,
      message: 'Diagnostic completed successfully'
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Failed to run diagnostics'
    });
  } finally {
    await prisma.$disconnect();
  }
} 