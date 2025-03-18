const { Client } = require('pg');

async function testConnection() {
  // Use the DATABASE_URL from .env.staging
  const connectionString = "postgresql://neondb_owner:npg_aWtsM2eOUf7x@ep-damp-snowflake-a8exwuo9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
  
  console.log("Testing connection to database...");
  console.log("Connection string:", connectionString);
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // May be needed for some cloud environments
    }
  });
  
  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("Connection established successfully!");
    
    console.log("Executing test query...");
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Database time:', result.rows[0].current_time);
    
    console.log("Listing available tables...");
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tables.rows.length === 0) {
      console.log("No tables found in the public schema.");
    } else {
      console.log("Tables in database:");
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    await client.end();
    console.log("Connection closed.");
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    try {
      // Make sure to close the client even if there was an error
      await client.end();
    } catch (e) {
      // Ignore error on closing
    }
  }
}

testConnection(); 