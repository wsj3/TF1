const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // First get a client to associate records with
    const client = await prisma.client.findFirst();
    
    if (!client) {
      console.error('No client found in database. Please add a client first.');
      return;
    }
    
    console.log(`Using client with ID: ${client.id}`);
    
    // Create a test note
    const note = await prisma.note.create({
      data: {
        content: 'Test note content - This is a sample note',
        type: 'session',
        clientId: client.id,
        createdById: 'system-test', // Since we don't have a User table yet
        updatedAt: new Date()
      }
    });
    console.log('Created test note:', note);
    
    // Create a test treatment plan
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        title: 'Sample Treatment Plan',
        description: 'This is a test treatment plan description',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        clientId: client.id,
        createdById: 'system-test',
        updatedAt: new Date()
      }
    });
    console.log('Created test treatment plan:', treatmentPlan);
    
    // Create a test goal
    const goal = await prisma.goal.create({
      data: {
        title: 'Sample Client Goal',
        description: 'This is a test goal to achieve during therapy',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'In Progress',
        clientId: client.id,
        updatedAt: new Date()
      }
    });
    console.log('Created test goal:', goal);
    
    // Count all records in new tables
    const notesCount = await prisma.note.count();
    const treatmentPlansCount = await prisma.treatmentPlan.count();
    const goalsCount = await prisma.goal.count();
    
    console.log('\nCurrent record counts:');
    console.log(`Notes: ${notesCount}`);
    console.log(`Treatment Plans: ${treatmentPlansCount}`);
    console.log(`Goals: ${goalsCount}`);
    
  } catch (error) {
    console.error('Error testing new tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 