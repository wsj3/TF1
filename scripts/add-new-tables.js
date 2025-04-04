const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating new tables using direct SQL...');
    
    // Check if tables already exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
    
    // Add Note table if it doesn't exist
    if (!tables.some(t => t.table_name === 'Note')) {
      console.log('Creating Note table...');
      await prisma.$executeRaw`
        CREATE TABLE "Note" (
          "id" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "type" TEXT DEFAULT 'general',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "clientId" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Add foreign key
      await prisma.$executeRaw`
        ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      console.log('Note table created successfully');
    } else {
      console.log('Note table already exists');
    }
    
    // Add TreatmentPlan table if it doesn't exist
    if (!tables.some(t => t.table_name === 'TreatmentPlan')) {
      console.log('Creating TreatmentPlan table...');
      await prisma.$executeRaw`
        CREATE TABLE "TreatmentPlan" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "startDate" TIMESTAMP(3) NOT NULL,
          "endDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "clientId" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Add foreign key
      await prisma.$executeRaw`
        ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      console.log('TreatmentPlan table created successfully');
    } else {
      console.log('TreatmentPlan table already exists');
    }
    
    // Add Goal table if it doesn't exist
    if (!tables.some(t => t.table_name === 'Goal')) {
      console.log('Creating Goal table...');
      await prisma.$executeRaw`
        CREATE TABLE "Goal" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "targetDate" TIMESTAMP(3),
          "status" TEXT NOT NULL DEFAULT 'In Progress',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "clientId" TEXT NOT NULL,
          CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Add foreign key
      await prisma.$executeRaw`
        ALTER TABLE "Goal" ADD CONSTRAINT "Goal_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      console.log('Goal table created successfully');
    } else {
      console.log('Goal table already exists');
    }
    
    console.log('All new tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 