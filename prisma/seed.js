const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// A proper hashing function using bcrypt
async function hashPassword(password) {
  return bcrypt.hash(password, 10); // Use a simple salt round of 10
}

async function main() {
  console.log('Start seeding...');
  
  // Clear existing data
  await clearDatabase();
  
  // Create admin user account
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin-user-id',
      email: 'admin@therapistsfriend.com',
      name: 'System Administrator',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
      isAdmin: true,
      status: 'active',
      updatedAt: new Date()
    },
  });
  
  console.log(`Created admin user: ${adminUser.email}`);
  
  // Create demo user account - This is the account you'll log in with
  const demoUser = await prisma.user.create({
    data: {
      id: 'demo-user-id',
      email: 'demo@therapistsfriend.com',
      name: 'Demo Therapist',
      password: await hashPassword('demo123'),
      role: 'THERAPIST',
      isAdmin: false,
      status: 'active',
      updatedAt: new Date()
    },
  });
  
  console.log(`Created demo user: ${demoUser.email}`);
  
  // Create sample clients for the demo user
  const clients = await createSampleClients(demoUser.id);
  console.log(`Created ${clients.length} sample clients`);
  
  // Create sessions for each client
  const sessions = await createSampleSessions(clients);
  console.log(`Created ${sessions.length} sample sessions`);
  
  // Create treatment plans for each client
  const treatmentPlans = await createSampleTreatmentPlans(clients, demoUser.id);
  console.log(`Created ${treatmentPlans.length} sample treatment plans with goals and tasks`);
  
  // Create notes for each client
  const notes = await createSampleNotes(clients, sessions, demoUser.id);
  console.log(`Created ${notes.length} sample notes`);
  
  // Create billing records for sessions
  const billingRecords = await createSampleBillingRecords(clients, sessions);
  console.log(`Created ${billingRecords.length} sample billing records`);
  
  console.log('Seeding complete!');
}

async function createSampleClients(therapistId) {
  const clientsData = [
    {
      therapistId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      therapistId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      therapistId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const clients = [];
  
  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: clientData
    });
    clients.push(client);
  }
  
  return clients;
}

async function createSampleSessions(clients) {
  const sessions = [];
  const today = new Date();
  
  // Get random hour between 8 AM and 5 PM (8-17)
  const getRandomTime = () => {
    // Random hour between 8 AM and 5 PM
    const hour = 8 + Math.floor(Math.random() * 9);
    // Random minute (0, 15, 30, 45)
    const minute = Math.floor(Math.random() * 4) * 15;
    return { hour, minute };
  };
  
  // Get random day offset within a range
  const getRandomDayOffset = (minDays, maxDays) => {
    return minDays + Math.floor(Math.random() * (maxDays - minDays + 1));
  };
  
  // Create past, present, and future sessions for each client with varied times
  for (const client of clients) {
    // Past sessions (completed) - varied days and times
    for (let i = 1; i <= 3; i++) {
      const pastDate = new Date(today);
      // Random day in the past (between 3-28 days ago)
      const daysAgo = getRandomDayOffset(3 + (i * 5), 10 + (i * 7));
      pastDate.setDate(today.getDate() - daysAgo);
      
      // Random appointment time
      const { hour, minute } = getRandomTime();
      
      const session = await prisma.session.create({
        data: {
          clientId: client.id,
          startTime: new Date(new Date(pastDate).setHours(hour, minute, 0, 0)),
          endTime: new Date(new Date(pastDate).setHours(hour + 1, minute, 0, 0)),
          status: 'COMPLETED',
          updatedAt: new Date(),
          type: 'Regular Session'
        }
      });
      
      sessions.push(session);
    }
  }
  
  return sessions;
}

async function createSampleTreatmentPlans(clients, userId) {
  const plans = [];
  
  for (const client of clients) {
    const plan = await prisma.treatmentPlan.create({
      data: {
        id: `plan-${client.id}`,
        title: 'Initial Treatment Plan',
        description: 'Standard initial treatment plan',
        startDate: new Date(),
        clientId: client.id,
        createdById: userId,
        updatedAt: new Date()
      }
    });
    
    plans.push(plan);
  }
  
  return plans;
}

async function createSampleNotes(clients, sessions, userId) {
  const notes = [];
  
  // Session notes for each completed session
  for (const session of sessions.filter(s => s.status === 'COMPLETED')) {
    const note = await prisma.note.create({
      data: {
        id: `note-session-${session.id}`,
        content: 'Session completed successfully. Client showed good progress.',
        type: 'session',
        clientId: session.clientId,
        createdById: userId,
        updatedAt: new Date()
      }
    });
    
    notes.push(note);
  }
  
  return notes;
}

async function createSampleBillingRecords(clients, sessions) {
  const billingRecords = [];
  
  // Create billing records for completed sessions
  for (const session of sessions.filter(s => s.status === 'COMPLETED')) {
    const amount = 100.00;
    
    const billing = await prisma.billing.create({
      data: {
        id: `billing-session-${session.id}`,
        clientId: session.clientId,
        sessionId: session.id,
        amount: amount,
        description: 'Therapy session',
        date: session.startTime,
        status: 'Pending',
        updatedAt: new Date()
      }
    });
    
    billingRecords.push(billing);
  }
  
  // Create initial assessment billing for each client
  for (const client of clients) {
    const billing = await prisma.billing.create({
      data: {
        id: `billing-assessment-${client.id}`,
        clientId: client.id,
        amount: 75.00,
        description: 'Initial assessment fee',
        date: new Date(),
        status: 'Pending',
        updatedAt: new Date()
      }
    });
    
    billingRecords.push(billing);
  }
  
  return billingRecords;
}

async function clearDatabase() {
  console.log('Clearing existing database records...');
  
  // Delete records in the correct order to respect foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.billing.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.session.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Database cleared successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 