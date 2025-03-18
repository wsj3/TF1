const { Client } = require('pg');
const { exec } = require('child_process');

async function checkDatabase() {
  console.log('Checking local PostgreSQL database...');
  
  try {
    // Connect to the default postgres database to check if our target DB exists
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres', // Default password, change if needed
      database: 'postgres'
    });
    
    await client.connect();
    console.log('Connected to PostgreSQL server successfully.');
    
    // Check if the therapists_friend database exists
    const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'therapists_friend'");
    
    if (res.rows.length === 0) {
      console.log('The database "therapists_friend" does not exist. Creating it now...');
      
      // Create the database
      await client.query('CREATE DATABASE therapists_friend');
      console.log('Database "therapists_friend" created successfully.');
      
      // Disconnect from postgres database
      await client.end();
      
      // Now we'll need to seed the database
      console.log('Running Prisma migrations and seed...');
      
      // Run prisma migrate and seed 
      exec('npx prisma migrate dev --name init && npx prisma db seed', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running migrations: ${error}`);
          return;
        }
        
        console.log(stdout);
        console.log('Database setup completed successfully!');
      });
    } else {
      console.log('Database "therapists_friend" already exists.');
      await client.end();
      
      // Check if we need to seed the database
      checkDatabaseContent();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('\nTry the following:');
    console.log('1. Verify PostgreSQL is running');
    console.log('2. Check your postgres user password (default used: "postgres")');
    console.log('3. Update the connection string in .env.local');
    console.log('4. Make sure PostgreSQL is installed correctly');
  }
}

async function checkDatabaseContent() {
  try {
    // Connect to the therapists_friend database to check if it has data
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres', // Default password, change if needed
      database: 'therapists_friend'
    });
    
    await client.connect();
    
    // Check if the users table exists and has data
    const res = await client.query("SELECT to_regclass('public.\"User\"') IS NOT NULL AS exists");
    
    if (!res.rows[0].exists) {
      console.log('The database appears to be empty. Running migrations and seed...');
      
      await client.end();
      
      // Run prisma migrate and seed
      exec('npx prisma migrate dev --name init && npx prisma db seed', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running migrations: ${error}`);
          return;
        }
        
        console.log(stdout);
        console.log('Database setup completed successfully!');
      });
    } else {
      // Check if there's any data
      const dataRes = await client.query("SELECT COUNT(*) FROM public.\"User\"");
      
      if (parseInt(dataRes.rows[0].count) === 0) {
        console.log('The database has tables but is empty. Running seed data...');
        
        await client.end();
        
        // Run just the seed
        exec('npx prisma db seed', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error running seed: ${error}`);
            return;
          }
          
          console.log(stdout);
          console.log('Database seeded successfully!');
        });
      } else {
        console.log(`Database has data: Found ${dataRes.rows[0].count} users.`);
        await client.end();
        console.log('Database setup looks good!');
      }
    }
  } catch (error) {
    console.error('Error checking database content:', error);
  }
}

checkDatabase(); 