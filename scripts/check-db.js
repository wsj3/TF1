const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Check User table
    console.log('\nChecking User table:');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    if (userCount > 0) {
      const user = await prisma.user.findFirst();
      console.log('Sample user:', user);
    }

    // Check Client table
    console.log('\nChecking Client table:');
    const clientCount = await prisma.client.count();
    console.log('Client count:', clientCount);
    if (clientCount > 0) {
      const client = await prisma.client.findFirst();
      console.log('Sample client:', client);
    }

    // Check Task table
    console.log('\nChecking Task table:');
    const taskCount = await prisma.task.count();
    console.log('Task count:', taskCount);
    if (taskCount > 0) {
      const task = await prisma.task.findFirst();
      console.log('Sample task:', task);
    }

    // Check Billing table
    console.log('\nChecking Billing table:');
    const billingCount = await prisma.billing.count();
    console.log('Billing count:', billingCount);
    if (billingCount > 0) {
      const billing = await prisma.billing.findFirst();
      console.log('Sample billing:', billing);
    }

    // Check Session table
    console.log('\nChecking Session table:');
    const sessionCount = await prisma.session.count();
    console.log('Session count:', sessionCount);
    if (sessionCount > 0) {
      const session = await prisma.session.findFirst();
      console.log('Sample session:', session);
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 