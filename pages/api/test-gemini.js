import { GoogleGenerativeAI } from '@google/generative-ai';

// Test endpoint for directly testing the Gemini API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Log that we're starting the test
    console.log('🧪 Testing Gemini API connection...');
    
    // Get API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ No Gemini API key found in environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Missing API key. Check environment configuration.' 
      });
    }
    
    console.log('🔑 Using API key ending in:', apiKey.substring(apiKey.length - 4));
    
    // Create Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Get a test prompt from the request or use default
    const { prompt } = req.body;
    const testPrompt = prompt || 'Respond with "Hello from Gemini!" if this connection is working.';
    
    console.log('📝 Sending test prompt to Gemini:', testPrompt);
    
    // Generate a response
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Received response from Gemini:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Return success response
    return res.status(200).json({
      success: true,
      model: 'gemini-1.5-flash',
      prompt: testPrompt,
      response: text
    });
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    
    // Return detailed error for debugging
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 