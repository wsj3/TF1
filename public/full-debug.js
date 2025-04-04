/**
 * Comprehensive debugging script for appointment creation
 * Run in browser console to diagnose issues
 */

async function debugFullAppointmentFlow() {
  console.log('🔍 COMPREHENSIVE APPOINTMENT DEBUGGING');
  console.log('=====================================');
  
  // 1. Test client search directly
  try {
    console.log('1️⃣ Testing Client Search API:');
    const clientName = 'Jane Smith';
    const searchUrl = `/api/clients/search?name=${encodeURIComponent(clientName)}`;
    console.log(`   URL: ${searchUrl}`);
    
    const clientResponse = await fetch(searchUrl);
    console.log(`   Status: ${clientResponse.status}`);
    
    const clientData = await clientResponse.json();
    console.log(`   Found ${clientData.length} clients:`, clientData);
    
    if (!clientData || clientData.length === 0) {
      throw new Error('No clients found - search API is not returning results');
    }
    
    // Validate client data structure
    const client = clientData[0];
    console.log('   Client data structure check:');
    console.log(`   • ID: ${client.id ? '✅' : '❌'} (${client.id || 'missing'})`);
    console.log(`   • Name: ${client.name ? '✅' : '❌'} (${client.name || 'missing'})`);
    console.log(`   • firstName: ${client.firstName ? '✅' : '❌'} (${client.firstName || 'missing'})`);
    console.log(`   • lastName: ${client.lastName ? '✅' : '❌'} (${client.lastName || 'missing'})`);
    
    // 2. Test appointment creation directly via API
    console.log('\n2️⃣ Testing Appointment Creation API directly:');
    const appointmentData = {
      clientId: client.id,
      date: '2024-03-27',
      time: '8:00',
      duration: 60,
      notes: 'Created via debug script',
      type: 'Regular Session'
    };
    console.log('   Appointment data:', appointmentData);
    
    try {
      console.log('   Sending request to /api/appointments/create...');
      const appointmentResponse = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      
      console.log(`   API Response Status: ${appointmentResponse.status}`);
      
      // Get raw text first for debugging
      const responseText = await appointmentResponse.text();
      console.log('   Raw response:', responseText);
      
      try {
        // Try parsing JSON
        const appointmentResult = JSON.parse(responseText);
        console.log('   Parsed response:', appointmentResult);
        
        if (appointmentResult.success) {
          console.log('   ✅ Direct API call SUCCESS');
          console.log(`   Appointment ID: ${appointmentResult.data?.id}`);
          console.log(`   Demo mode: ${appointmentResult.demoMode ? 'Yes' : 'No'}`);
        } else {
          console.log('   ❌ Direct API call FAILED');
          console.log(`   Error: ${appointmentResult.error || 'Unknown error'}`);
        }
      } catch (parseError) {
        console.error('   ❌ Failed to parse JSON response:', parseError);
      }
    } catch (apiError) {
      console.error('   ❌ API request failed:', apiError);
    }
    
    // 3. Test the createAppointment function from Sidebar.js directly
    console.log('\n3️⃣ Testing createAppointment function from Sidebar component:');
    
    // Find or approximate the createAppointment function from the sidebar
    let createAppointmentFn = null;
    
    // Check if we can access the function from React component
    if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
      console.log('   React DevTools detected, attempting to find Sidebar component...');
      // This is just informational - we'll use our own implementation
    }
    
    // Implement a version of createAppointment for testing
    const testCreateAppointment = async (clientName, date, time) => {
      console.log(`   Creating appointment for ${clientName} on ${date} at ${time}`);
      
      try {
        // 1. Search for client
        console.log(`   Searching for client: ${clientName}`);
        const searchUrl = `/api/clients/search?name=${encodeURIComponent(clientName)}`;
        const clientResponse = await fetch(searchUrl);
        
        if (!clientResponse.ok) {
          throw new Error(`Client search failed: ${clientResponse.status}`);
        }
        
        const clientData = await clientResponse.json();
        if (!clientData || !Array.isArray(clientData) || clientData.length === 0) {
          throw new Error(`No client found with name: ${clientName}`);
        }
        
        const client = clientData[0];
        console.log(`   Found client: ${client.id}`);
        
        // 2. Create appointment
        const formattedTime = time.includes(':') ? time : `${time}:00`;
        
        console.log(`   Sending appointment creation request for ${client.id}`);
        const response = await fetch('/api/appointments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: client.id,
            date,
            time: formattedTime,
            duration: 60,
            notes: 'Created via debug script',
            type: 'Regular Session'
          }),
        });
        
        console.log(`   Response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`   Raw response: ${responseText}`);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('   Parsed response:', data);
        } catch (err) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || `Failed to create appointment: ${response.status}`);
        }
        
        return {
          success: true,
          appointmentId: data.data?.id,
          message: data.message,
          demoMode: data.demoMode
        };
      } catch (error) {
        console.error(`   ❌ Error in test function: ${error.message}`);
        return {
          success: false,
          message: `Failed to create appointment: ${error.message}`
        };
      }
    };
    
    // Test the function
    console.log('   Calling test appointment creation function...');
    const result = await testCreateAppointment('Jane Smith', '2024-03-27', '8:00 AM');
    
    if (result.success) {
      console.log(`   ✅ SUCCESS: ${result.message}`);
      console.log(`   Appointment ID: ${result.appointmentId}`);
      console.log(`   Demo mode: ${result.demoMode ? 'Yes' : 'No'}`);
    } else {
      console.log(`   ❌ FAILED: ${result.message}`);
    }
    
    // 4. Network request analysis
    console.log('\n4️⃣ Network Request Analysis:');
    console.log('   Check Network tab in DevTools for:');
    console.log('   • Request to /api/clients/search - Should return 200');
    console.log('   • Request to /api/appointments/create - Check status and response');
    console.log('   • Look for any CORS, CSP, or authentication errors');
    
    // 5. Test demo mode
    console.log('\n5️⃣ Testing Demo Mode:');
    const demoAppointmentData = {
      clientId: 'demo-1',
      date: '2024-03-27',
      time: '9:00 AM',
      duration: 60,
      notes: 'Demo test appointment',
      type: 'Regular Session' 
    };
    
    console.log('   Creating demo appointment...');
    try {
      const demoResponse = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoAppointmentData),
      });
      
      const demoText = await demoResponse.text();
      console.log(`   Status: ${demoResponse.status}`);
      console.log(`   Raw response: ${demoText}`);
      
      try {
        const demoResult = JSON.parse(demoText);
        console.log('   Parsed response:', demoResult);
        
        if (demoResult.success) {
          console.log('   ✅ Demo mode appointment creation SUCCESS');
        } else {
          console.log('   ❌ Demo mode appointment creation FAILED');
        }
      } catch (parseError) {
        console.error('   ❌ Failed to parse demo response:', parseError);
      }
    } catch (demoError) {
      console.error('   ❌ Demo request failed:', demoError);
    }
    
    // Summary
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('=====================================');
    console.log('1. Client search API: Working correctly');
    console.log(`2. Direct appointment creation API: ${appointmentResult?.success ? 'Working' : 'Failed'}`);
    console.log(`3. Sidebar createAppointment function: ${result.success ? 'Working' : 'Failed'}`);
    console.log(`4. Demo mode: ${demoResult?.success ? 'Working' : 'Failed'}`);
    console.log('\nRECOMMENDED FIXES:');
    
    if (!appointmentResult?.success && demoResult?.success) {
      console.log('• Database might be unavailable - demo mode works but real data fails');
      console.log('• Check server logs for database connection errors');
    } else if (!result.success && appointmentResult?.success) {
      console.log('• UI integration issue - direct API calls work but UI flow fails');
      console.log('• Check browser console for JavaScript errors');
    } else if (!appointmentResult?.success && !demoResult?.success) {
      console.log('• API endpoint might be broken or network issue');
      console.log('• Check server logs and restart the server');
    }
    
    console.log('\nTo fix, try:');
    console.log('1. Restart the server: npx kill-port 3000 && npm run dev');
    console.log('2. Clear browser cache and reload the page');
    console.log('3. Check network tab for detailed error information');
    
  } catch (error) {
    console.error('❌ DEBUG SCRIPT ERROR:', error);
  }
}

// Run the debug function
console.log('Run debugFullAppointmentFlow() to start debugging'); 