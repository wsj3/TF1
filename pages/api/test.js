/**
 * Test API Endpoint
 * 
 * Simple endpoint to verify API connectivity and server functionality.
 * This endpoint always responds with a success message and doesn't require
 * authentication or database access. It also provides a response in the exact
 * format expected by the AIAssistant component.
 */

export default function handler(req, res) {
  // Log the request for debugging
  console.log('Test API called with method:', req.method);
  console.log('Headers:', req.headers);
  
  // Create a direct AI assistant response format
  const directTestResponse = {
    success: true,
    data: {
      content: "This is a test response from the /api/test endpoint. The AI API is functioning correctly if you can see this message formatted properly."
    },
    message: 'Test endpoint response successful'
  };
  
  // Log the response format
  console.log('Test API returning response:', JSON.stringify(directTestResponse, null, 2));
  
  // Return a success response in the exact format needed
  return res.status(200).json(directTestResponse);
} 