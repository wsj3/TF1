const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get detailed column information for Appointment table
    const appointmentColumns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        ordinal_position
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'Appointment'
      ORDER BY
        ordinal_position
    `;
    
    console.log('Appointment table columns (detailed):');
    console.log(appointmentColumns);
    
    // Check if there are any foreign keys
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'Appointment'
    `;
    
    console.log('Foreign keys:');
    console.log(foreignKeys);
    
  } catch (error) {
    console.error('Error checking Appointment structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 