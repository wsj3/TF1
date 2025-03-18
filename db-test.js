const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Create a new Prisma client
    const prisma = new PrismaClient();
    
    // Try to connect and perform a simple query
    console.log('Attempting to connect to the database...');
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users in the database.`);
    
    // Check if we can retrieve sessions
    const sessionCount = await prisma.session.count();
    console.log(`Found ${sessionCount} sessions in the database.`);
    
    // Disconnect from the database
    await prisma.$disconnect();
    console.log('Successfully disconnected from the database.');
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('Database connection test completed successfully.');
    } else {
      console.log('Database connection test failed.');
    }
  })
  .catch(error => {
    console.error('Unexpected error during database test:', error);
  }); 