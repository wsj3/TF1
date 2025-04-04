/**
 * Simple test endpoint for the AI Assistant
 * This will help us verify that the basic API functionality works
 */

export default async function handler(req, res) {
  try {
    // Log that this test endpoint was called
    console.log('🧪 Test assistant API called with method:', req.method);
    
    if (req.method === 'GET') {
      // Return a simple success response for GET requests
      return res.status(200).json({
        success: true,
        data: {
          content: "This is a test response from the AI Assistant API. The API endpoint is functioning correctly."
        },
        message: 'Test response generated successfully'
      });
    }
    
    // For POST requests, echo back the message with a test response
    if (req.method === 'POST') {
      const { messages } = req.body;
      
      // Log the incoming messages
      console.log('📝 Received test messages:', messages);
      
      // Check if we have messages
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No messages provided in request body'
        });
      }
      
      // Get the last message
      const lastMessage = messages[messages.length - 1];
      
      // Generate a response based on the last message
      const testResponse = `This is a test response to your message: "${lastMessage.content}". The test endpoint is functioning correctly.`;
      
      return res.status(200).json({
        success: true,
        data: {
          content: testResponse
        },
        message: 'Test POST response generated successfully'
      });
    }
    
    // Method not allowed for other methods
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Error in test assistant API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
} 