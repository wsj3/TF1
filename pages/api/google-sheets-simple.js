/**
 * Simple Google Sheets API endpoint that just returns the data with different content for each sheet
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get spreadsheet ID from environment variable or request query
    const spreadsheetId = req.query.id || process.env.GOOGLE_SHEET_ID || '16BxY67QqOE-CDOhF9GiUkESRuAyYt4TI641Zpu32qIc';
    
    console.log(`API CALL: Simplified endpoint for Google Sheet with ID: ${spreadsheetId}`);
    
    // Create four example sheets with clearly different content
    const sheetNames = [
      "Client Guidelines", 
      "Features Status", 
      "Resources", 
      "Settings"
    ];
    
    // Create sheet list
    const sheetList = sheetNames.map((name, index) => ({
      id: index,
      title: name,
      index: index
    }));
    
    // Create different data for each sheet
    const sheetsData = {};
    
    // Sheet 1: Client Guidelines
    sheetsData[sheetNames[0]] = {
      headers: ['Guideline', 'Description', 'Priority'],
      data: [
        { 'Guideline': 'Client Confidentiality', 'Description': 'Ensure all AI interactions comply with privacy laws', 'Priority': 'Critical' },
        { 'Guideline': 'Ethical Guidelines', 'Description': 'Align with professional ethical standards', 'Priority': 'High' },
        { 'Guideline': 'Service Accessibility', 'Description': 'Offer tools across various devices and platforms', 'Priority': 'Medium' },
        { 'Guideline': 'Data Security', 'Description': 'Implement strict encryption for all client data', 'Priority': 'Critical' }
      ],
      rowCount: 4
    };
    
    // Sheet 2: Features Status
    sheetsData[sheetNames[1]] = {
      headers: ['Feature', 'Status', 'Priority', 'Target Date'],
      data: [
        { 'Feature': 'AI Response Accuracy', 'Status': 'Active', 'Priority': 'High', 'Target Date': '2023-06-30' },
        { 'Feature': 'Session Recording', 'Status': 'In Development', 'Priority': 'Medium', 'Target Date': '2023-07-15' },
        { 'Feature': 'Client Portal', 'Status': 'Planned', 'Priority': 'Low', 'Target Date': '2023-09-01' },
        { 'Feature': 'Mobile App', 'Status': 'In Review', 'Priority': 'Medium', 'Target Date': '2023-08-15' }
      ],
      rowCount: 4
    };
    
    // Sheet 3: Resources
    sheetsData[sheetNames[2]] = {
      headers: ['Resource Type', 'URL', 'Notes', 'Added Date'],
      data: [
        { 'Resource Type': 'Documentation', 'URL': 'https://docs.example.com', 'Notes': 'Official documentation', 'Added Date': '2023-01-15' },
        { 'Resource Type': 'Training Videos', 'URL': 'https://training.example.com', 'Notes': 'Video tutorials', 'Added Date': '2023-02-20' },
        { 'Resource Type': 'Support', 'URL': 'https://support.example.com', 'Notes': '24/7 support portal', 'Added Date': '2023-01-10' },
        { 'Resource Type': 'API Reference', 'URL': 'https://api.example.com', 'Notes': 'For developers', 'Added Date': '2023-03-05' }
      ],
      rowCount: 4
    };
    
    // Sheet 4: Settings
    sheetsData[sheetNames[3]] = {
      headers: ['Setting', 'Value', 'Description', 'Modified By'],
      data: [
        { 'Setting': 'Default Theme', 'Value': 'Dark', 'Description': 'Default UI theme for all users', 'Modified By': 'Admin' },
        { 'Setting': 'Session Timeout', 'Value': '60 minutes', 'Description': 'Auto-logout timeout period', 'Modified By': 'Admin' },
        { 'Setting': 'Data Retention', 'Value': '90 days', 'Description': 'How long to keep session data', 'Modified By': 'System' },
        { 'Setting': 'API Timeout', 'Value': '30 seconds', 'Description': 'Maximum API request timeout', 'Modified By': 'Dev Team' }
      ],
      rowCount: 4
    };
    
    // Return the results
    return res.status(200).json({
      success: true,
      spreadsheetId,
      sheets: sheetList,
      data: sheetsData,
      isDummy: true,
      message: 'Using simplified data with different content for each sheet for testing'
    });
    
  } catch (error) {
    console.error('Error in simplified Google Sheets endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message
    });
  }
} 