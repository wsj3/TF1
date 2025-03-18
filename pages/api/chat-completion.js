// Server-side proxy for OpenAI Chat API
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 300 } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
    });

    return res.status(200).json({ 
      message: completion.data.choices[0].message.content,
      usage: completion.data.usage
    });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Error with OpenAI API', 
      details: error.response?.data || error.message 
    });
  }
} 