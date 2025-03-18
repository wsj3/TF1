// Test Neon database connection
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function testNeonConnection() {
  console.log('Testing connection to Neon database...');
  console.log('Connection string:', process.env.DATABASE_URL.replace(/(:.+?@)/, ':****@')); // Hide password
  
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Successfully connected to Neon database!');
    
    // Test a simple query
    console.log('Fetching user count...');
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database.`);
    
    // Test fetching sessions
    console.log('Fetching session count...');
    const sessionCount = await prisma.session.count();
    console.log(`Found ${sessionCount} sessions in the database.`);
    
    // Get session distribution
    if (sessionCount > 0) {
      console.log('Sample session data:');
      const sessions = await prisma.session.findMany({
        take: 3,
        include: {
          Client: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      sessions.forEach(session => {
        console.log(`- ${session.id.substring(0, 8)}: ${session.Client.firstName} ${session.Client.lastName}, ${new Date(session.startTime).toLocaleString()} (${session.status})`);
      });
    }
    
    return 'SUCCESS';
  } catch (error) {
    console.error('Failed to connect to Neon database:', error);
    return 'FAILED';
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Run the test
testNeonConnection()
  .then(result => {
    console.log(`Test ${result}`);
    if (result === 'FAILED') {
      console.log('\nTroubleshooting tips:');
      console.log('1. Make sure your IP is allowed in Neon\'s connection settings');
      console.log('2. Verify your database credentials are correct');
      console.log('3. Check if your Neon database is running');
      console.log('4. Try configuring SSL settings in the connection string');
    }
  })
  .catch(e => {
    console.error('Unexpected error:', e);
  }); 