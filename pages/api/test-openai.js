import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  // Simple OpenAI test endpoint
  try {
    // Log OpenAI configuration details
    console.log('Testing OpenAI API connection');
    console.log('API Key available:', !!process.env.OPENAI_API_KEY);
    console.log('Model being used:', process.env.OPENAI_MODEL || 'gpt-3.5-turbo');
    
    // Initialize OpenAI API with proper error handling
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    
    // Make a simple completion request
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const completion = await openai.createChatCompletion({
      model: model,
      messages: [{ role: 'user', content: 'Hello, is the API working?' }],
      max_tokens: 50
    });
    
    // Return success response
    return res.status(200).json({
      status: 'success',
      model: model,
      message: completion.data.choices[0].message.content,
      usage: completion.data.usage
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return detailed error information
    return res.status(500).json({
      status: 'error',
      message: 'OpenAI API error',
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
  }
} 