/**
 * API Endpoint Tester
 * 
 * This script tests various API endpoints to ensure they're functioning correctly.
 * It's useful for diagnosing issues with the appointment creation process.
 */

require('dotenv').config({ path: './.env.local' });
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('=== API ENDPOINT TESTER ===\n');
  
  try {
    // Test 1: Check server status
    console.log('Test 1: Checking server status...');
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      console.log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', data);
        console.log('  ✅ Server is running');
      } else {
        console.log('  ❌ Server error:', await response.text());
      }
    } catch (error) {
      console.log('  ❌ Server not running or not accessible');
      console.log('  Error:', error.message);
    }
    
    // Test 2: Client search
    console.log('\nTest 2: Testing client search...');
    try {
      const response = await fetch(`${BASE_URL}/api/clients/search?name=Jane`);
      console.log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('  Response:', data);
        console.log('  ✅ Client search successful');
      } else {
        console.log('  ❌ Client search failed:', await response.text());
      }
    } catch (error) {
      console.log('  ❌ Client search failed');
      console.log('  Error:', error.message);
    }
    
    // Test 3: Appointment creation (with demo client)
    console.log('\nTest 3: Testing appointment creation...');
    try {
      const appointmentData = {
        clientId: 'demo-1',
        date: '2024-03-25',
        time: '10:00',
        duration: 60,
        notes: 'Test appointment',
        type: 'Regular Session'
      };
      
      console.log('  Sending data:', appointmentData);
      
      const response = await fetch(`${BASE_URL}/api/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      console.log(`  Status: ${response.status}`);
      
      try {
        const data = await response.json();
        console.log('  Response:', data);
        if (response.ok) {
          console.log('  ✅ Appointment creation successful');
        } else {
          console.log('  ❌ Appointment creation failed');
        }
      } catch (e) {
        console.log('  ❌ Could not parse response as JSON');
        console.log('  Raw response:', await response.text());
      }
    } catch (error) {
      console.log('  ❌ Appointment creation request failed');
      console.log('  Error:', error.message);
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('Make sure your local server is running (npm run dev)');
    console.log('Check the database connection using node check-db-connection.js');
    console.log('Review logs above for specific error details');
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

testEndpoints(); 