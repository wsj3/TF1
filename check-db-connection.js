/**
 * Database Connection Checker and Fixer
 * 
 * Use this script to verify and repair database connections:
 * - Checks if the DATABASE_URL environment variable is correctly set
 * - Tests connection to the database
 * - Provides detailed error information if connection fails
 * - Offers suggestions to fix common issues
 * 
 * Run with: node check-db-connection.js
 */

require('dotenv').config({ path: './.env.local' });
const { PrismaClient } = require('@prisma/client');

// ANSI color codes for nice output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkDatabaseConnection() {
  console.log(`\n${colors.bright}${colors.blue}=== DATABASE CONNECTION CHECKER ===${colors.reset}\n`);
  
  // 1. Check if DATABASE_URL is set
  console.log(`${colors.cyan}Checking DATABASE_URL environment variable...${colors.reset}`);
  if (!process.env.DATABASE_URL) {
    console.log(`${colors.red}✘ DATABASE_URL is not set in .env.local${colors.reset}`);
    console.log(`${colors.yellow}Please add DATABASE_URL to your .env.local file.${colors.reset}`);
    return false;
  } else {
    // Mask the URL for security while displaying it
    const masked = maskConnectionString(process.env.DATABASE_URL);
    console.log(`${colors.green}✓ DATABASE_URL is set: ${masked}${colors.reset}`);
  }
  
  // 2. Attempt to connect to the database
  console.log(`\n${colors.cyan}Attempting to connect to database...${colors.reset}`);
  
  const prisma = new PrismaClient();
  let connected = false;
  
  try {
    await prisma.$connect();
    connected = true;
    console.log(`${colors.green}✓ Successfully connected to database${colors.reset}`);
    
    // Test basic query to verify full access
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log(`${colors.green}✓ Database query successful${colors.reset}`);
    } catch (queryError) {
      console.log(`${colors.red}✘ Database query failed: ${queryError.message}${colors.reset}`);
    }
    
    // Check for specific tables
    console.log(`\n${colors.cyan}Checking database tables...${colors.reset}`);
    try {
      // Test existence of tables by counting records
      const tables = [
        { name: 'Client', count: await prisma.client.count() },
        { name: 'Appointment', count: await prisma.appointment.count() },
        { name: 'Task', count: await prisma.task.count() },
        { name: 'Session', count: await prisma.session.count() }
      ];
      
      tables.forEach(table => {
        console.log(`${colors.green}✓ Table ${table.name}: ${table.count} records${colors.reset}`);
      });
    } catch (tablesError) {
      console.log(`${colors.red}✘ Error checking tables: ${tablesError.message}${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✘ Failed to connect to database: ${error.message}${colors.reset}`);
    
    // Analyze error type and provide helpful suggestions
    if (error.message.includes('timeout')) {
      console.log(`${colors.yellow}• Connection timed out. This may indicate network issues or incorrect hostname.${colors.reset}`);
    } else if (error.message.includes('authentication')) {
      console.log(`${colors.yellow}• Authentication failed. Please check username and password in your DATABASE_URL.${colors.reset}`);
    } else if (error.message.includes('does not exist')) {
      console.log(`${colors.yellow}• Database does not exist. Make sure you've created the database.${colors.reset}`);
    } else if (error.message.includes('ENOTFOUND')) {
      console.log(`${colors.yellow}• Host not found. Check if the server address in DATABASE_URL is correct.${colors.reset}`);
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}• Connection refused. The database server may be down or not accepting connections.${colors.reset}`);
    }
  } finally {
    // Always disconnect
    await prisma.$disconnect();
  }
  
  // 3. Provide recommendations to fix issues
  if (!connected) {
    console.log(`\n${colors.cyan}Recommendations to fix connection issues:${colors.reset}`);
    console.log(`
${colors.bright}1. Check your DATABASE_URL format:${colors.reset}
   For PostgreSQL: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE

${colors.bright}2. Verify credentials:${colors.reset}
   • Ensure username and password are correct
   • Check if the database exists
   • Verify that your IP is allowed to connect to the database

${colors.bright}3. If using Neon, Supabase, or another cloud database:${colors.reset}
   • Confirm that you're using the correct connection string from the dashboard
   • Check if you need to enable "Trusted IPs" or disable "IP Restrictions"
   • Verify your subscription is active

${colors.bright}4. Test connection using a different tool:${colors.reset}
   • Try connecting with pgAdmin, DBeaver, or another database client
   • Use the same connection parameters as in your DATABASE_URL
    `);
  }
  
  return connected;
}

// Utility to mask sensitive information in connection string
function maskConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    // Mask password if present
    if (url.password) {
      url.password = '****';
    }
    return url.toString();
  } catch (error) {
    // If URL parsing fails, try to mask manually
    return connectionString
      .replace(/\/\/[^:]+:([^@]+)@/, '//****:****@')
      .substring(0, 30) + '...';
  }
}

// Run the check
checkDatabaseConnection()
  .then(connected => {
    console.log(`\n${colors.bright}${colors.blue}=== DATABASE CHECK COMPLETE ===${colors.reset}`);
    if (!connected) {
      console.log(`${colors.yellow}Once issues are fixed, run this script again to verify.${colors.reset}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running connection check:', error);
    process.exit(1);
  }); 