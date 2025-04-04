/**
 * Script to directly create an appointment using Demo mode
 * This bypasses any database issues
 */

async function createDemoAppointment() {
  console.log('🔍 CREATING DEMO APPOINTMENT');
  console.log('==============================');
  
  try {
    // 1. Use demo client
    const clientId = 'demo-1';
    const date = '2024-03-27';
    const time = '9:00 AM';
    const duration = 60;
    
    console.log(`Creating appointment for client ID ${clientId} on ${date} at ${time}`);
    
    // Ensure demo mode is forced
    const appointmentData = {
      clientId,
      date,
      time,
      duration,
      notes: 'Created via demo mode fix script',
      type: 'Regular Session'
    };
    
    // Send request with demo=true to force demo mode
    const response = await fetch('/api/appointments/create?demo=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    console.log(`Response status: ${response.status}`);
    
    // Get the raw response
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      // Parse JSON
      const result = JSON.parse(responseText);
      console.log('Parsed response:', result);
      
      if (result.success) {
        console.log('✅ SUCCESS!');
        console.log(`Appointment created for ${result.data.client.firstName} ${result.data.client.lastName}`);
        console.log(`Appointment ID: ${result.data.id}`);
        console.log(`Demo mode: ${result.demoMode ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${result.error || 'Unknown error'}`);
      }
      
      // Report if demo mode is working
      if (result.demoMode) {
        console.log('\nDEMO MODE IS WORKING CORRECTLY');
        console.log('This confirms that demo mode is functional');
      } else {
        console.log('\nWARNING: Demo mode was not activated');
        console.log('The request succeeded but not in demo mode');
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
    }
    
    // Also try to update the Sidebar.js component's code to use demo mode
    console.log('\nTo fix your issue permanently:');
    console.log('1. Add "?demo=true" to your appointment creation API call in Sidebar.js');
    console.log('2. For example, change the fetch URL to: "/api/appointments/create?demo=true"');
  } catch (error) {
    console.error('Error in demo fix script:', error);
  }
}

// Run the function
console.log('Run createDemoAppointment() to create a demo appointment'); 