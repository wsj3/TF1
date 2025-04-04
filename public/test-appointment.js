/**
 * Test script for appointment creation
 * Run this in the browser console to test the appointment creation flow
 */

async function testAppointmentCreation() {
  try {
    console.log('=== APPOINTMENT CREATION TEST SCRIPT ===');
    
    // 1. Search for client with name
    const clientName = 'Jane Smith';
    console.log(`1. Searching for client: ${clientName}`);
    
    const searchUrl = `/api/clients/search?name=${encodeURIComponent(clientName)}`;
    console.log(`   Request URL: ${searchUrl}`);
    
    const clientResponse = await fetch(searchUrl);
    console.log(`   Client search response status: ${clientResponse.status}`);
    console.log(`   Client search response headers:`, Object.fromEntries([...clientResponse.headers.entries()]));
    
    if (!clientResponse.ok) {
      const errorText = await clientResponse.text();
      console.error('   Client search failed:', errorText);
      throw new Error('Failed to find client by name - API error');
    }
    
    const clientData = await clientResponse.json();
    console.log('   Client search results:', clientData);
    
    if (!clientData || !Array.isArray(clientData) || clientData.length === 0) {
      throw new Error(`No client found with name: ${clientName}`);
    }
    
    const client = clientData[0];
    console.log('   Selected client:', client);
    
    const clientId = client.id;
    console.log(`   Using client ID: ${clientId}`);
    
    const fullClientName = client.firstName && client.lastName 
      ? `${client.firstName} ${client.lastName}`.trim()
      : (client.name || clientName);
    console.log(`   Using client name: ${fullClientName}`);
    
    // 2. Create the appointment
    console.log('\n2. Creating appointment');
    
    const date = '2024-03-27';
    const time = '8:00';
    const formattedTime = time.includes(':') ? time : `${time}:00`;
    
    console.log(`   Date: ${date}, Time: ${formattedTime}`);
    
    const appointmentData = {
      clientId,
      date,
      time: formattedTime,
      duration: 60,
      notes: 'Created via test script',
      type: 'Regular Session'
    };
    
    console.log('   Sending API request with data:', appointmentData);
    
    const response = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    // Detailed logging of response
    console.log(`   Appointment API response status: ${response.status}`);
    console.log('   Appointment API response headers:', Object.fromEntries([...response.headers.entries()]));
    
    // Get the response body as text first for debugging
    const responseText = await response.text();
    console.log('   Raw response text:', responseText);
    
    // Try to parse the JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('   Parsed appointment creation response:', data);
    } catch (err) {
      console.error('   Failed to parse API response as JSON:', err);
      throw new Error('Invalid JSON response from server');
    }
    
    if (!response.ok) {
      throw new Error(data.error || `Failed to create appointment: ${response.status} - ${data.message || 'Unknown error'}`);
    }
    
    if (data.success) {
      console.log('✅ Appointment created successfully!');
      console.log('   Appointment ID:', data.data?.id);
      console.log('   Message:', data.message);
      console.log('   Demo mode:', data.demoMode ? 'Yes' : 'No');
    } else {
      console.log('❌ Appointment creation failed');
      console.log('   Error:', data.error);
    }
    
    return {
      success: data.success,
      appointmentId: data.data?.id,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Error in test script:', error);
    console.error('   Error details:', error.stack);
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  }
}

// Run the test
console.log('Run testAppointmentCreation() to test appointment creation'); 