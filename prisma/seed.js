const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// A proper hashing function using bcrypt
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Start seeding...');
  
  // Clear existing data
  await clearDatabase();
  
  // Create demo user account - This is the account you'll log in with
  const demoUser = await prisma.user.create({
    data: {
      id: 'demo-user-id',
      email: 'demo@therapistsfriend.com',
      name: 'Demo Therapist',
      password: await hashPassword('demo123'),
      role: 'THERAPIST',
      updatedAt: new Date(),
      Profile: {
        create: {
          id: 'demo-profile-id',
          title: 'Licensed Clinical Psychologist',
          bio: 'Specializing in cognitive behavioral therapy with 10+ years of experience working with anxiety, depression, and trauma.',
          specialties: ['Anxiety', 'Depression', 'PTSD', 'CBT', 'Mindfulness'],
          phoneNumber: '(555) 123-4567',
          address: '123 Therapy Lane, Mindful City, CA 90210',
          profileImageUrl: 'https://randomuser.me/api/portraits/people/1.jpg',
          updatedAt: new Date()
        },
      },
    },
  });
  
  console.log(`Created demo user: ${demoUser.email}`);
  
  // Create sample clients for the demo user
  const clients = await createSampleClients(demoUser.id);
  console.log(`Created ${clients.length} sample clients`);
  
  // Create sessions for each client
  const sessions = await createSampleSessions(clients, demoUser.id);
  console.log(`Created ${sessions.length} sample sessions`);
  
  // Create treatment plans for each client
  const treatmentPlans = await createSampleTreatmentPlans(clients, demoUser.id);
  console.log(`Created ${treatmentPlans.length} sample treatment plans with goals and tasks`);
  
  // Create notes for each client
  const notes = await createSampleNotes(clients, sessions, demoUser.id);
  console.log(`Created ${notes.length} sample notes`);
  
  // Create diagnoses for each client
  const diagnoses = await createSampleDiagnoses(clients, demoUser.id);
  console.log(`Created ${diagnoses.length} sample diagnoses`);
  
  // Create billing records for sessions
  const billingRecords = await createSampleBillingRecords(clients, sessions, demoUser.id);
  console.log(`Created ${billingRecords.length} sample billing records`);
  
  // Create standalone tasks (not attached to goals)
  const tasks = await createSampleTasks(clients);
  console.log(`Created ${tasks.length} additional standalone tasks`);
  
  console.log('Seeding complete!');
}

async function createSampleClients(therapistId) {
  const clientsData = [
    {
      id: 'client-1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.j@example.com',
      phoneNumber: '(555) 111-2222',
      dateOfBirth: new Date('1985-03-15'),
      address: '789 Patient St, Wellness City, CA 90215',
      emergencyContact: 'Bob Johnson (Husband): (555) 111-3333',
      status: 'ACTIVE',
    },
    {
      id: 'client-2',
      firstName: 'Michael',
      lastName: 'Williams',
      email: 'mwilliams@example.com',
      phoneNumber: '(555) 444-5555',
      dateOfBirth: new Date('1990-07-22'),
      address: '101 Healing Blvd, Wellness City, CA 90217',
      emergencyContact: 'Sarah Williams (Wife): (555) 444-6666',
      status: 'ACTIVE',
    },
    {
      id: 'client-3',
      firstName: 'Emily',
      lastName: 'Brown',
      email: 'emily.b@example.com',
      phoneNumber: '(555) 777-8888',
      dateOfBirth: new Date('1988-11-30'),
      address: '202 Recovery Road, Wellness City, CA 90220',
      emergencyContact: 'James Brown (Brother): (555) 777-9999',
      status: 'ACTIVE',
    },
    {
      id: 'client-4',
      firstName: 'David',
      lastName: 'Garcia',
      email: 'david.g@example.com',
      phoneNumber: '(555) 222-3333',
      dateOfBirth: new Date('1975-05-10'),
      address: '303 Healing Circle, Wellness City, CA 90225',
      emergencyContact: 'Maria Garcia (Wife): (555) 222-4444',
      status: 'INACTIVE',
    },
    {
      id: 'client-5',
      firstName: 'Sophia',
      lastName: 'Lee',
      email: 'sophia.l@example.com',
      phoneNumber: '(555) 666-7777',
      dateOfBirth: new Date('1992-09-05'),
      address: '404 Mindful Street, Wellness City, CA 90230',
      emergencyContact: 'William Lee (Father): (555) 666-8888',
      status: 'ONBOARDING',
    }
  ];
  
  const clients = [];
  
  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: {
        ...clientData,
        therapistId,
        updatedAt: new Date(),
      }
    });
    clients.push(client);
  }
  
  return clients;
}

async function createSampleSessions(clients, therapistId) {
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
          id: `${client.id}-past-session-${i}`,
          clientId: client.id,
          therapistId: therapistId,
          startTime: new Date(new Date(pastDate).setHours(hour, minute, 0, 0)),
          endTime: new Date(new Date(pastDate).setHours(hour + 1, minute, 0, 0)),
          status: 'COMPLETED',
          updatedAt: new Date(),
        }
      });
      
      sessions.push(session);
    }
    
    // Today's or recent sessions (if client is active)
    if (client.status === 'ACTIVE') {
      // 50% chance of today, 50% chance of yesterday or tomorrow
      const dayOffset = Math.random() > 0.5 ? 0 : (Math.random() > 0.5 ? -1 : 1);
      const recentDate = new Date(today);
      recentDate.setDate(today.getDate() + dayOffset);
      
      // Random time for this session
      const { hour, minute } = getRandomTime();
      
      const todaySession = await prisma.session.create({
        data: {
          id: `${client.id}-today-session`,
          clientId: client.id,
          therapistId: therapistId,
          startTime: new Date(new Date(recentDate).setHours(hour, minute, 0, 0)),
          endTime: new Date(new Date(recentDate).setHours(hour + 1, minute, 0, 0)),
          status: Math.random() > 0.5 ? 'COMPLETED' : 'SCHEDULED',
          updatedAt: new Date(),
        }
      });
      
      sessions.push(todaySession);
    }
    
    // Future sessions with varied times and days
    for (let i = 1; i <= 4; i++) {
      const futureDate = new Date(today);
      // Random future days (between 3-40 days in the future)
      const daysAhead = getRandomDayOffset(3 + (i * 2), 7 + (i * 8));
      futureDate.setDate(today.getDate() + daysAhead);
      
      // Random appointment time
      const { hour, minute } = getRandomTime();
      
      const session = await prisma.session.create({
        data: {
          id: `${client.id}-future-session-${i}`,
          clientId: client.id,
          therapistId: therapistId,
          startTime: new Date(new Date(futureDate).setHours(hour, minute, 0, 0)),
          endTime: new Date(new Date(futureDate).setHours(hour + 1, minute, 0, 0)),
          status: 'SCHEDULED',
          updatedAt: new Date(),
        }
      });
      
      sessions.push(session);
    }
  }
  
  return sessions;
}

async function createSampleTreatmentPlans(clients, therapistId) {
  const treatmentPlans = [];
  const today = new Date();
  
  const treatmentPlanTemplates = [
    {
      title: 'Anxiety Management Plan',
      description: 'Focused on reducing generalized anxiety through CBT techniques and mindfulness practices.',
      goals: [
        {
          description: 'Develop and implement daily mindfulness practice',
          tasks: [
            {
              title: 'Download recommended mindfulness app',
              description: 'Install Calm or Headspace and set up account',
              status: 'COMPLETED',
            },
            {
              title: 'Complete 10-minute mindfulness session 5 days per week',
              status: 'IN_PROGRESS',
            }
          ]
        },
        {
          description: 'Identify and challenge negative thought patterns',
          tasks: [
            {
              title: 'Complete thought record daily',
              description: 'Use CBT worksheet to identify automatic thoughts and challenge them',
              status: 'PENDING',
            }
          ]
        }
      ]
    },
    {
      title: 'Depression Management Plan',
      description: 'Focused on alleviating depressive symptoms through behavioral activation and cognitive restructuring.',
      goals: [
        {
          description: 'Increase daily physical activity',
          tasks: [
            {
              title: 'Take a 15-minute walk each day',
              status: 'IN_PROGRESS',
            },
            {
              title: 'Join a fitness class or group activity',
              status: 'PENDING',
            }
          ]
        },
        {
          description: 'Establish regular sleep schedule',
          tasks: [
            {
              title: 'Go to bed and wake up at consistent times',
              description: 'Aim for bed by 10:30 PM and wake up by 7:00 AM',
              status: 'IN_PROGRESS',
            }
          ]
        }
      ]
    },
    {
      title: 'Stress Management Plan',
      description: 'Focused on developing healthy coping strategies for managing work and life stress.',
      goals: [
        {
          description: 'Improve work-life balance',
          tasks: [
            {
              title: 'Establish firm boundaries around work hours',
              status: 'PENDING',
            },
            {
              title: 'Schedule at least one enjoyable activity each week',
              status: 'IN_PROGRESS',
            }
          ]
        },
        {
          description: 'Develop healthy stress response techniques',
          tasks: [
            {
              title: 'Practice deep breathing exercises when feeling overwhelmed',
              status: 'IN_PROGRESS',
            }
          ]
        }
      ]
    }
  ];
  
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const planTemplate = treatmentPlanTemplates[i % treatmentPlanTemplates.length];
    
    const plan = await prisma.treatmentPlan.create({
      data: {
        id: `plan-${client.id}`,
        title: planTemplate.title,
        description: planTemplate.description,
        clientId: client.id,
        therapistId: therapistId,
        status: 'ACTIVE',
        startDate: new Date(today.setDate(today.getDate() - 30)),
        updatedAt: new Date(),
        Goal: {
          create: planTemplate.goals.map((goal, goalIndex) => {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + (30 * (goalIndex + 1)));
            
            return {
              id: `goal-${client.id}-${goalIndex}`,
              description: goal.description,
              targetDate: targetDate,
              status: goalIndex === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
              updatedAt: new Date(),
              Task: {
                create: goal.tasks.map((task, taskIndex) => ({
                  id: `task-${client.id}-${goalIndex}-${taskIndex}`,
                  title: task.title,
                  description: task.description || '',
                  status: task.status,
                  dueDate: new Date(targetDate.setDate(targetDate.getDate() - 7)),
                  clientId: client.id,
                  updatedAt: new Date(),
                }))
              }
            };
          })
        }
      },
      include: {
        Goal: {
          include: {
            Task: true
          }
        }
      }
    });
    
    treatmentPlans.push(plan);
  }
  
  return treatmentPlans;
}

async function createSampleNotes(clients, sessions, therapistId) {
  const notes = [];
  
  // Session notes for each completed session
  for (const session of sessions.filter(s => s.status === 'COMPLETED')) {
    const note = await prisma.note.create({
      data: {
        id: `note-session-${session.id}`,
        content: `Client attended session on ${session.startTime.toLocaleDateString()}. We discussed progress with current goals and coping strategies. Client reported ${Math.random() > 0.5 ? 'improvement in' : 'continued struggles with'} ${Math.random() > 0.5 ? 'anxiety symptoms' : 'sleep patterns'}. Next steps include ${Math.random() > 0.5 ? 'practicing mindfulness exercises daily' : 'completing thought records when feeling overwhelmed'}.`,
        clientId: session.clientId,
        therapistId,
        sessionId: session.id,
        noteType: 'SESSION_NOTE',
        updatedAt: new Date(),
      }
    });
    
    notes.push(note);
  }
  
  // Intake notes for each client
  for (const client of clients) {
    const note = await prisma.note.create({
      data: {
        id: `note-intake-${client.id}`,
        content: `Initial assessment completed for ${client.firstName} ${client.lastName}. Client presents with symptoms of ${Math.random() > 0.5 ? 'anxiety' : 'depression'} that have been present for approximately ${Math.floor(Math.random() * 12) + 1} months. Client reports that symptoms are ${Math.random() > 0.5 ? 'interfering significantly with daily functioning' : 'manageable but concerning'}. We discussed treatment options and decided to begin with ${Math.random() > 0.5 ? 'weekly CBT sessions' : 'biweekly therapy focusing on mindfulness and stress reduction'}.`,
        clientId: client.id,
        therapistId,
        noteType: 'INTAKE_NOTE',
        updatedAt: new Date(),
      }
    });
    
    notes.push(note);
  }
  
  // Progress notes for each client
  for (const client of clients) {
    const note = await prisma.note.create({
      data: {
        id: `note-progress-${client.id}`,
        content: `Progress update for ${client.firstName}: Client has been attending sessions ${Math.random() > 0.5 ? 'consistently' : 'with occasional cancellations'}. Overall, we're seeing ${Math.random() > 0.5 ? 'good progress' : 'slow but steady improvement'} with the current treatment plan. Client reports ${Math.random() > 0.5 ? 'reduced frequency of symptoms' : 'better ability to manage symptoms when they occur'}. We will continue with the current treatment approach and reassess in 30 days.`,
        clientId: client.id,
        therapistId,
        noteType: 'PROGRESS_NOTE',
        updatedAt: new Date(),
      }
    });
    
    notes.push(note);
  }
  
  return notes;
}

async function createSampleDiagnoses(clients, therapistId) {
  const diagnoses = [];
  
  const diagnosisTemplates = [
    {
      code: 'F41.1',
      name: 'Generalized Anxiety Disorder',
      description: 'Excessive anxiety and worry occurring more days than not for at least 6 months.',
    },
    {
      code: 'F32.1',
      name: 'Major Depressive Disorder, Single Episode, Moderate',
      description: 'Depressed mood and/or loss of interest or pleasure in nearly all activities for at least 2 weeks.',
    },
    {
      code: 'F43.10',
      name: 'Post-Traumatic Stress Disorder',
      description: 'Development of characteristic symptoms following exposure to traumatic event(s).',
    },
    {
      code: 'F40.10',
      name: 'Social Anxiety Disorder',
      description: 'Marked fear or anxiety about social situations in which the individual is exposed to possible scrutiny by others.',
    },
    {
      code: 'F51.01',
      name: 'Insomnia Disorder',
      description: 'Dissatisfaction with sleep quantity or quality with complaints of difficulty initiating or maintaining sleep.',
    }
  ];
  
  for (const client of clients) {
    // Assign 1-2 diagnoses to each client
    const numberOfDiagnoses = Math.floor(Math.random() * 2) + 1;
    const clientDiagnosisIndexes = [];
    
    for (let i = 0; i < numberOfDiagnoses; i++) {
      let diagnosisIndex;
      do {
        diagnosisIndex = Math.floor(Math.random() * diagnosisTemplates.length);
      } while (clientDiagnosisIndexes.includes(diagnosisIndex));
      
      clientDiagnosisIndexes.push(diagnosisIndex);
      
      const diagnosisTemplate = diagnosisTemplates[diagnosisIndex];
      const diagnosis = await prisma.diagnosis.create({
        data: {
          clientId: client.id,
          therapistId,
          code: diagnosisTemplate.code,
          name: diagnosisTemplate.name,
          description: diagnosisTemplate.description,
          dateAssigned: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 60))),
          status: 'ACTIVE',
        }
      });
      
      diagnoses.push(diagnosis);
    }
  }
  
  return diagnoses;
}

async function createSampleBillingRecords(clients, sessions, therapistId) {
  const billingRecords = [];
  
  // Create billing records for each completed session
  for (const session of sessions.filter(s => s.status === 'COMPLETED')) {
    const amount = 100 + Math.floor(Math.random() * 50); // Random amount between $100-$150
    const isPaid = Math.random() > 0.3; // 70% of completed sessions are paid
    
    const billing = await prisma.billing.create({
      data: {
        clientId: session.clientId,
        therapistId,
        sessionId: session.id,
        amount,
        description: `Therapy session on ${session.startTime.toLocaleDateString()}`,
        date: new Date(session.endTime),
        status: isPaid ? 'PAID' : Math.random() > 0.5 ? 'PENDING' : 'INSURANCE_SUBMITTED',
        paidDate: isPaid ? new Date(new Date(session.endTime).setDate(session.endTime.getDate() + Math.floor(Math.random() * 10))) : null,
        insuranceInfo: Math.random() > 0.5 ? 'Blue Cross PPO #12345678' : 'Aetna HMO #87654321',
      }
    });
    
    billingRecords.push(billing);
  }
  
  // Add a few standalone billing records (not tied to sessions)
  for (const client of clients) {
    if (Math.random() > 0.5) { // 50% chance to add standalone billing
      const billing = await prisma.billing.create({
        data: {
          clientId: client.id,
          therapistId,
          amount: 75.00,
          description: 'Initial assessment fee',
          date: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))),
          status: Math.random() > 0.5 ? 'PAID' : 'PENDING',
          paidDate: Math.random() > 0.5 ? new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 20))) : null,
        }
      });
      
      billingRecords.push(billing);
    }
  }
  
  return billingRecords;
}

async function createSampleTasks(clients) {
  const tasks = [];
  
  // Add standalone tasks (not tied to goals) for active clients
  for (const client of clients.filter(c => c.status === 'ACTIVE')) {
    const taskTemplates = [
      {
        title: `Contact insurance provider about ${client.firstName}'s coverage`,
        description: 'Verify session limits and co-pay amounts for the current year',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        status: 'PENDING'
      },
      {
        title: `Prepare assessment report for ${client.firstName}`,
        description: 'Complete initial assessment documentation and recommendations',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        status: 'IN_PROGRESS'
      },
      {
        title: `Send resource materials to ${client.firstName}`,
        description: 'Email the anxiety workbook PDF and mindfulness resources',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        status: Math.random() > 0.5 ? 'COMPLETED' : 'PENDING',
        completedDate: Math.random() > 0.5 ? new Date(new Date().setDate(new Date().getDate() - 1)) : null
      }
    ];
    
    // Add 1-2 standalone tasks for each client
    const numberOfTasks = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numberOfTasks; i++) {
      const taskTemplate = taskTemplates[i % taskTemplates.length];
      
      const task = await prisma.task.create({
        data: {
          id: `standalone-task-${client.id}-${i}`,
          title: taskTemplate.title,
          description: taskTemplate.description,
          dueDate: taskTemplate.dueDate,
          status: taskTemplate.status,
          completedDate: taskTemplate.completedDate || null,
          clientId: client.id,
          updatedAt: new Date(),
        }
      });
      
      tasks.push(task);
    }
  }
  
  return tasks;
}

async function clearDatabase() {
  // Delete all records in the correct order to respect foreign key constraints
  await prisma.Billing.deleteMany({});
  await prisma.Diagnosis.deleteMany({});
  await prisma.Task.deleteMany({});
  await prisma.Goal.deleteMany({});
  await prisma.TreatmentPlan.deleteMany({});
  await prisma.Note.deleteMany({});
  await prisma.Session.deleteMany({});
  await prisma.Client.deleteMany({});
  await prisma.Profile.deleteMany({});
  await prisma.User.deleteMany({});
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 