const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Get current timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Backup data from each table
    const backup = {
      clients: await prisma.client.findMany(),
      tasks: await prisma.task.findMany(),
      billings: await prisma.billing.findMany(),
      sessions: await prisma.session.findMany(),
      appointments: await prisma.appointment.findMany()
    };

    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`Backup created at: ${backupFile}`);

  } catch (error) {
    console.error('Error creating backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 