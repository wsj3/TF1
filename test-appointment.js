/**
 * Test script for appointment creation only
 */
const fetch = require('node-fetch');

async function testAppointmentCreation() {
  console.log('Testing appointment creation endpoint...');
  
  try {
    const appointmentData = {
      clientId: 'demo-1',
      date: '2024-03-25',
      time: '10:00',
      duration: 60,
      notes: 'Test appointment',
      type: 'Regular Session'
    };
    
    console.log('Sending data:', JSON.stringify(appointmentData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/appointments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Appointment creation successful');
      } else {
        console.log('❌ Appointment creation failed');
      }
    } catch (e) {
      console.log('❌ Could not parse response as JSON');
      console.log('Parse error:', e.message);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAppointmentCreation(); 