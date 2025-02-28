const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// A simple hashing function for demonstration purposes only
// In a real app, use a proper password hashing library like bcrypt
function hashPassword(password) {
  return `hashed_${password}`;
}

async function main() {
  console.log('Start seeding...');
  
  // Clear existing data
  await clearDatabase();
  
  // Create therapist users
  const therapist1 = await prisma.user.create({
    data: {
      email: 'john.doe@therapistsfriend.com',
      name: 'John Doe',
      password: hashPassword('password123'),
      role: 'THERAPIST',
      profile: {
        create: {
          title: 'Licensed Clinical Psychologist',
          bio: 'Specializing in cognitive behavioral therapy with 10+ years of experience.',
          specialties: ['Anxiety', 'Depression', 'PTSD'],
          phoneNumber: '(555) 123-4567',
          address: '123 Therapy Lane, Mindful City, CA 90210',
          profileImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
        },
      },
    },
  });

  const therapist2 = await prisma.user.create({
    data: {
      email: 'jane.smith@therapistsfriend.com',
      name: 'Jane Smith',
      password: hashPassword('password123'),
      role: 'THERAPIST',
      profile: {
        create: {
          title: 'Licensed Marriage and Family Therapist',
          bio: 'Dedicated to helping couples and families improve communication and build stronger relationships.',
          specialties: ['Family Therapy', 'Relationship Counseling', 'Child Therapy'],
          phoneNumber: '(555) 987-6543',
          address: '456 Wellness Ave, Harmony Hills, CA 90211',
          profileImageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
        },
      },
    },
  });

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@therapistsfriend.com',
      name: 'Admin User',
      password: hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  // Create clients for therapist1
  const client1 = await prisma.client.create({
    data: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.j@example.com',
      phoneNumber: '(555) 111-2222',
      dateOfBirth: new Date('1985-03-15'),
      address: '789 Patient St, Wellness City, CA 90215',
      emergencyContact: 'Bob Johnson (Husband): (555) 111-3333',
      therapistId: therapist1.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      firstName: 'Michael',
      lastName: 'Williams',
      email: 'mwilliams@example.com',
      phoneNumber: '(555) 444-5555',
      dateOfBirth: new Date('1990-07-22'),
      address: '101 Healing Blvd, Wellness City, CA 90217',
      emergencyContact: 'Sarah Williams (Wife): (555) 444-6666',
      therapistId: therapist1.id,
    },
  });

  // Create clients for therapist2
  const client3 = await prisma.client.create({
    data: {
      firstName: 'Emily',
      lastName: 'Brown',
      email: 'emily.b@example.com',
      phoneNumber: '(555) 777-8888',
      dateOfBirth: new Date('1988-11-30'),
      address: '202 Recovery Road, Wellness City, CA 90220',
      emergencyContact: 'James Brown (Brother): (555) 777-9999',
      therapistId: therapist2.id,
    },
  });

  // Create sessions
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Session for client1 with therapist1
  const session1 = await prisma.session.create({
    data: {
      clientId: client1.id,
      therapistId: therapist1.id,
      startTime: new Date(today.setHours(10, 0, 0, 0)),
      endTime: new Date(today.setHours(11, 0, 0, 0)),
      status: 'COMPLETED',
    },
  });

  // Future session for client1
  const session2 = await prisma.session.create({
    data: {
      clientId: client1.id,
      therapistId: therapist1.id,
      startTime: new Date(nextWeek.setHours(10, 0, 0, 0)),
      endTime: new Date(nextWeek.setHours(11, 0, 0, 0)),
      status: 'SCHEDULED',
    },
  });

  // Session for client2
  const session3 = await prisma.session.create({
    data: {
      clientId: client2.id,
      therapistId: therapist1.id,
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
      status: 'SCHEDULED',
    },
  });

  // Create notes
  const note1 = await prisma.note.create({
    data: {
      content: 'Client reports reduced anxiety symptoms since our last session. Sleep has improved but still experiencing some morning stress.',
      clientId: client1.id,
      therapistId: therapist1.id,
      sessionId: session1.id,
      noteType: 'SESSION_NOTE',
    },
  });

  const note2 = await prisma.note.create({
    data: {
      content: 'Initial assessment complete. Client presenting with symptoms of moderate depression and relationship difficulties.',
      clientId: client2.id,
      therapistId: therapist1.id,
      noteType: 'INTAKE_NOTE',
    },
  });

  // Create treatment plan for client1
  const treatmentPlan1 = await prisma.treatmentPlan.create({
    data: {
      title: 'Anxiety Management Plan',
      description: 'Focused on reducing generalized anxiety through CBT techniques and mindfulness practices.',
      clientId: client1.id,
      therapistId: therapist1.id,
      status: 'ACTIVE',
      startDate: new Date(today.setDate(today.getDate() - 30)),
      goals: {
        create: [
          {
            description: 'Develop and implement daily mindfulness practice',
            targetDate: new Date(today.setDate(today.getDate() + 30)),
            status: 'IN_PROGRESS',
            tasks: {
              create: [
                {
                  title: 'Download recommended mindfulness app',
                  description: 'Install Calm or Headspace and set up account',
                  status: 'COMPLETED',
                  completedDate: new Date(today.setDate(today.getDate() - 25)),
                  clientId: client1.id,
                },
                {
                  title: 'Complete 10-minute mindfulness session 5 days per week',
                  status: 'IN_PROGRESS',
                  dueDate: new Date(today.setDate(today.getDate() + 7)),
                  clientId: client1.id,
                },
              ],
            },
          },
          {
            description: 'Identify and challenge negative thought patterns',
            targetDate: new Date(today.setDate(today.getDate() + 60)),
            status: 'NOT_STARTED',
            tasks: {
              create: [
                {
                  title: 'Complete thought record daily',
                  description: 'Use CBT worksheet to identify automatic thoughts and challenge them',
                  status: 'PENDING',
                  dueDate: new Date(today.setDate(today.getDate() + 14)),
                  clientId: client1.id,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Seeding complete!');
}

async function clearDatabase() {
  // Delete all records in the correct order to respect foreign key constraints
  await prisma.task.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.treatmentPlan.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 