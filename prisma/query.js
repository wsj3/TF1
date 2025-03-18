const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Count records in each table
    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const sessionCount = await prisma.session.count();
    const treatmentPlanCount = await prisma.treatmentPlan.count();
    const goalCount = await prisma.goal.count();
    const taskCount = await prisma.task.count();
    const noteCount = await prisma.note.count();
    const diagnosisCount = await prisma.diagnosis.count();
    const billingCount = await prisma.billing.count();

    console.log('\n===== DATABASE RECORD COUNTS =====');
    console.log(`Users: ${userCount}`);
    console.log(`Clients: ${clientCount}`);
    console.log(`Sessions: ${sessionCount}`);
    console.log(`Treatment Plans: ${treatmentPlanCount}`);
    console.log(`Goals: ${goalCount}`);
    console.log(`Tasks: ${taskCount}`);
    console.log(`Notes: ${noteCount}`);
    console.log(`Diagnoses: ${diagnosisCount}`);
    console.log(`Billing Records: ${billingCount}`);

    // Get user details
    const users = await prisma.user.findMany({
      include: {
        Profile: true
      }
    });
    
    console.log('\n===== USER DETAILS =====');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}), Role: ${user.role}`);
      if (user.Profile) {
        console.log(`  Title: ${user.Profile.title}`);
        console.log(`  Specialties: ${user.Profile.specialties ? user.Profile.specialties.join(', ') : 'None'}`);
      }
    });

    // Get clients with basic info
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: {
            Session: true,
            Diagnosis: true,
            TreatmentPlan: true
          }
        }
      }
    });
    
    console.log('\n===== CLIENT SUMMARY =====');
    clients.forEach(client => {
      console.log(`- ${client.firstName} ${client.lastName} (${client.email || 'No email'})`);
      console.log(`  Status: ${client.status}`);
      console.log(`  Sessions: ${client._count.Session}`);
      console.log(`  Diagnoses: ${client._count.Diagnosis}`);
      console.log(`  Treatment Plans: ${client._count.TreatmentPlan}`);
    });

    // Get upcoming sessions for the next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingSessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: today,
          lte: nextWeek
        },
        status: 'SCHEDULED'
      },
      include: {
        Client: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    console.log('\n===== UPCOMING SESSIONS (NEXT 7 DAYS) =====');
    if (upcomingSessions.length === 0) {
      console.log('No upcoming sessions in the next 7 days.');
    } else {
      upcomingSessions.forEach(session => {
        const clientName = `${session.Client.firstName} ${session.Client.lastName}`;
        const date = session.startTime.toLocaleDateString();
        const startTime = session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = session.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        console.log(`- ${date}: ${startTime} - ${endTime} with ${clientName}`);
      });
    }

    // Get some sample diagnoses
    const diagnoses = await prisma.diagnosis.findMany({
      take: 5,
      include: {
        Client: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log('\n===== SAMPLE DIAGNOSES =====');
    diagnoses.forEach(diagnosis => {
      const clientName = `${diagnosis.Client.firstName} ${diagnosis.Client.lastName}`;
      console.log(`- ${clientName}: ${diagnosis.code} - ${diagnosis.name}`);
      console.log(`  Description: ${diagnosis.description.substring(0, 100)}...`);
    });

    // Get treatment plans with goals
    const treatmentPlans = await prisma.treatmentPlan.findMany({
      take: 2,
      include: {
        Client: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        Goal: {
          include: {
            Task: true
          }
        }
      }
    });
    
    console.log('\n===== SAMPLE TREATMENT PLANS WITH GOALS =====');
    treatmentPlans.forEach(plan => {
      const clientName = `${plan.Client.firstName} ${plan.Client.lastName}`;
      console.log(`- ${clientName}: ${plan.title}`);
      console.log(`  Description: ${plan.description}`);
      console.log(`  Start Date: ${plan.startDate.toLocaleDateString()}`);
      
      if (plan.Goal && plan.Goal.length > 0) {
        console.log('  Goals:');
        plan.Goal.forEach(goal => {
          console.log(`   - ${goal.description} (Status: ${goal.status})`);
          
          if (goal.Task && goal.Task.length > 0) {
            console.log('     Tasks:');
            goal.Task.forEach(task => {
              console.log(`      * ${task.title}: ${task.description || 'No description'} (Status: ${task.status})`);
            });
          }
        });
      }
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Database examination complete!'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 