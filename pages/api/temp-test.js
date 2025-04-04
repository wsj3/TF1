/**
 * Simple test API endpoint that always returns a meaningful response
 * This is a temporary solution to bypass the page refresh issues
 */

import { createResponseBasedOnQuery } from '../../utils/assistantUtils';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Temp-test API called with payload size:', JSON.stringify(req.body).length);
    
    // Extract the message from the request
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message format'
      });
    }
    
    // Get the last message (the user's query)
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Generate a response based on the user's query
    const assistantResponse = createResponseBasedOnQuery(userMessage);
    
    console.log('📝 Generated temp response:', assistantResponse.substring(0, 100) + '...');
    
    // Return a successful response with the generated message
    return res.status(200).json({
      success: true,
      data: {
        content: assistantResponse
      }
    });
  } catch (error) {
    console.error('❌ Error in temp-test endpoint:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
} 