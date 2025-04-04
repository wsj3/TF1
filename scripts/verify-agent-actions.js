const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get a client to work with
    const client = await prisma.client.findFirst();
    
    if (!client) {
      console.error('No client found in database.');
      return;
    }
    
    console.log(`Verifying agent actions for client: ${client.id}`);
    
    // Count all records for this client
    const notes = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Note" WHERE "clientId" = ${client.id}
    `;
    console.log(`Notes for client: ${notes[0].count}`);
    
    const appointments = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Appointment" WHERE "clientId" = ${client.id}
    `;
    console.log(`Appointments for client: ${appointments[0].count}`);
    
    const tasks = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Task" WHERE "clientId" = ${client.id}
    `;
    console.log(`Tasks for client: ${tasks[0].count}`);
    
    const treatmentPlans = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "TreatmentPlan" WHERE "clientId" = ${client.id}
    `;
    console.log(`Treatment plans for client: ${treatmentPlans[0].count}`);
    
    const goals = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Goal" WHERE "clientId" = ${client.id}
    `;
    console.log(`Goals for client: ${goals[0].count}`);
    
    // Get most recent records of each type
    console.log('\nMost recent records:');
    
    const latestNote = await prisma.$queryRaw`
      SELECT * FROM "Note" WHERE "clientId" = ${client.id} ORDER BY "createdAt" DESC LIMIT 1
    `;
    if (latestNote.length > 0) {
      console.log('Latest Note:', {
        id: latestNote[0].id,
        content: latestNote[0].content.substring(0, 50) + '...',
        type: latestNote[0].type,
        createdAt: latestNote[0].createdAt
      });
    }
    
    const latestAppointment = await prisma.$queryRaw`
      SELECT * FROM "Appointment" WHERE "clientId" = ${client.id} ORDER BY "createdAt" DESC LIMIT 1
    `;
    if (latestAppointment.length > 0) {
      console.log('Latest Appointment:', {
        id: latestAppointment[0].id,
        startTime: latestAppointment[0].startTime,
        endTime: latestAppointment[0].endTime,
        type: latestAppointment[0].type,
        status: latestAppointment[0].status
      });
    }
    
    const latestTask = await prisma.$queryRaw`
      SELECT * FROM "Task" WHERE "clientId" = ${client.id} ORDER BY "createdAt" DESC LIMIT 1
    `;
    if (latestTask.length > 0) {
      console.log('Latest Task:', {
        id: latestTask[0].id,
        title: latestTask[0].title,
        status: latestTask[0].status,
        priority: latestTask[0].priority,
        dueDate: latestTask[0].dueDate
      });
    }
    
    console.log('\nVerification complete!');
    
  } catch (error) {
    console.error('Error verifying agent actions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 