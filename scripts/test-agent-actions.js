const { PrismaClient } = require('@prisma/client');

// Simulate an agent creating appointments and tasks
async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting agentic functionality test...');
    
    // Get a client to work with
    const client = await prisma.client.findFirst();
    
    if (!client) {
      console.error('No client found in database. Please add a client first.');
      return;
    }
    
    console.log(`Agent working with client: ${client.id}`);
    
    // Simulate agent adding a note about the client
    const clientNote = await prisma.note.create({
      data: {
        content: 'Client expressed interest in weekly sessions focusing on anxiety management. Agent recommends scheduling a regular Thursday appointment.',
        type: 'agent_recommendation',
        clientId: client.id,
        createdById: 'therapy-agent',
        updatedAt: new Date()
      }
    });
    console.log('Agent created client note:', clientNote.id);
    
    // Simulate agent creating an appointment using direct SQL to match the actual table structure
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + ((11 - startTime.getDay()) % 7)); // Next Thursday
    startTime.setHours(15, 0, 0, 0); // 3:00 PM
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1); // 1 hour appointment
    
    // Create appointment using raw SQL to match the actual database structure with the correct column order
    await prisma.$executeRaw`
      INSERT INTO "Appointment" (
        "id", 
        "startTime", 
        "endTime", 
        "duration", 
        "notes", 
        "type", 
        "status", 
        "createdAt", 
        "updatedAt", 
        "clientId"
      )
      VALUES (
        ${`appt-${Date.now()}`}, 
        ${startTime}, 
        ${endTime}, 
        ${60}, 
        ${'Weekly anxiety management session. Scheduled automatically by Therapy Assistant.'}, 
        ${'Therapy'}, 
        ${'Scheduled'}, 
        ${new Date()}, 
        ${new Date()}, 
        ${client.id}
      )
    `;
    console.log('Agent created appointment with SQL');
    
    // Simulate agent creating a task for therapist
    const taskDueDate = new Date();
    taskDueDate.setDate(taskDueDate.getDate() + 2); // Due in 2 days
    
    // Create task using raw SQL to match the actual database structure
    await prisma.$executeRaw`
      INSERT INTO "Task" (
        "id", 
        "clientId", 
        "title", 
        "description", 
        "dueDate", 
        "status", 
        "priority", 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        ${`task-${Date.now()}`}, 
        ${client.id}, 
        ${'Prepare anxiety management resources'}, 
        ${'Client will need anxiety management worksheets and breathing exercise guides for their upcoming appointment.'}, 
        ${taskDueDate}, 
        ${'Pending'}, 
        ${'High'}, 
        ${new Date()}, 
        ${new Date()}
      )
    `;
    console.log('Agent created task with SQL');
    
    // Create a treatment plan suggestion
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        title: 'Anxiety Management Program',
        description: 'A 12-week program focusing on cognitive behavioral techniques for anxiety management.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000), // 84 days (12 weeks)
        clientId: client.id,
        createdById: 'therapy-agent',
        updatedAt: new Date()
      }
    });
    console.log('Agent created treatment plan:', treatmentPlan.id);
    
    // Add goals related to the treatment plan
    const goal = await prisma.goal.create({
      data: {
        title: 'Develop 3 anxiety coping mechanisms',
        description: 'Client should identify and regularly practice at least 3 effective anxiety coping mechanisms.',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'In Progress',
        clientId: client.id,
        updatedAt: new Date()
      }
    });
    console.log('Agent created goal:', goal.id);
    
    console.log('\nAgentic functionality test completed successfully!');
    
  } catch (error) {
    console.error('Error testing agentic functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 