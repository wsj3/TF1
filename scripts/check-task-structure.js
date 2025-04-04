const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Check the structure of the Task table
    const taskColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Task'
    `;
    
    console.log('Task table columns:');
    console.log(taskColumns);
    
    // Check if there are any tasks
    const taskCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Task"
    `;
    console.log('Task count:', taskCount);
    
    // Get a sample task if any exist
    if (taskCount[0].count > 0) {
      const sampleTask = await prisma.$queryRaw`
        SELECT * FROM "Task" LIMIT 1
      `;
      console.log('Sample task:', sampleTask);
    }
    
  } catch (error) {
    console.error('Error checking Task structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 