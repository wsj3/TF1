const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Check the structure of the Appointment table
    const appointmentColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Appointment'
    `;
    
    console.log('Appointment table columns:');
    console.log(appointmentColumns);
    
    // Check if there are any appointments
    const appointmentCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Appointment"
    `;
    console.log('Appointment count:', appointmentCount);
    
    // Get a sample appointment if any exist
    if (appointmentCount[0].count > 0) {
      const sampleAppointment = await prisma.$queryRaw`
        SELECT * FROM "Appointment" LIMIT 1
      `;
      console.log('Sample appointment:', sampleAppointment);
    }
    
  } catch (error) {
    console.error('Error checking Appointment structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 