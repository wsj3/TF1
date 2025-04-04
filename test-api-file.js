/**
 * API Endpoint Tester with file output
 */

require('dotenv').config({ path: './.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
let output = [];

function log(message) {
  output.push(message);
  console.log(message);
}

async function testEndpoints() {
  log('=== API ENDPOINT TESTER ===\n');
  
  try {
    // Test 1: Check server status
    log('Test 1: Checking server status...');
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        log('  Response: ' + JSON.stringify(data, null, 2));
        log('  ✅ Server is running');
      } else {
        log('  ❌ Server error: ' + await response.text());
      }
    } catch (error) {
      log('  ❌ Server not running or not accessible');
      log('  Error: ' + error.message);
    }
    
    // Test 2: Client search
    log('\nTest 2: Testing client search...');
    try {
      const response = await fetch(`${BASE_URL}/api/clients/search?name=Jane`);
      log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        log('  Response: ' + JSON.stringify(data, null, 2));
        log('  ✅ Client search successful');
      } else {
        log('  ❌ Client search failed: ' + await response.text());
      }
    } catch (error) {
      log('  ❌ Client search failed');
      log('  Error: ' + error.message);
    }
    
    // Test 3: Appointment creation (with demo client)
    log('\nTest 3: Testing appointment creation...');
    try {
      const appointmentData = {
        clientId: 'demo-1',
        date: '2024-03-25',
        time: '10:00',
        duration: 60,
        notes: 'Test appointment',
        type: 'Regular Session'
      };
      
      log('  Sending data: ' + JSON.stringify(appointmentData, null, 2));
      
      const response = await fetch(`${BASE_URL}/api/appointments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      log(`  Status: ${response.status}`);
      
      const responseText = await response.text();
      log(`  Raw response: ${responseText}`);
      
      try {
        const data = JSON.parse(responseText);
        log('  Response: ' + JSON.stringify(data, null, 2));
        if (response.ok) {
          log('  ✅ Appointment creation successful');
        } else {
          log('  ❌ Appointment creation failed');
        }
      } catch (e) {
        log('  ❌ Could not parse response as JSON');
        log('  Parse error: ' + e.message);
      }
    } catch (error) {
      log('  ❌ Appointment creation request failed');
      log('  Error: ' + error.message);
    }
    
    log('\n=== TEST SUMMARY ===');
    log('Make sure your local server is running (npm run dev)');
    log('Check the database connection using node check-db-connection.js');
    log('Review logs above for specific error details');
    
    // Write results to file
    fs.writeFileSync('api-test-results.txt', output.join('\n'), 'utf8');
    log('\nResults written to api-test-results.txt');
    
  } catch (error) {
    log('Error running tests: ' + error.message);
    fs.writeFileSync('api-test-results.txt', output.join('\n'), 'utf8');
  }
}

testEndpoints(); 