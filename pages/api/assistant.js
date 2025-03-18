import { Configuration, OpenAIApi } from 'openai';

// Initialize OpenAI configuration
const getOpenAIConfig = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not found. Using demo mode.');
    return null;
  }

  return new Configuration({
    apiKey: apiKey,
  });
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt, temperature = 0.7, interfaceType = 'Text Interface', guidanceTypes = null } = req.body;

    // Check if prompt is provided
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Configure system message based on interface type
    let systemMessage = 'You are an AI assistant helping a therapist with their practice.';
    
    if (interfaceType === 'Voice Interface') {
      systemMessage += ' Respond in a way that sounds natural when spoken aloud.';
    } else if (interfaceType === 'Avatar Interface') {
      systemMessage += ' Keep responses brief and conversational.';
    }
    
    // Add guidance types to the system message if provided
    if (guidanceTypes) {
      const activeRoles = [];
      
      if (guidanceTypes.mentor) {
        activeRoles.push('a mentor who provides wisdom and guidance');
        systemMessage += ' Focus on providing wise guidance and thoughtful advice based on your knowledge.';
      }
      
      if (guidanceTypes.scientist) {
        activeRoles.push('a scientist focused on evidence and research');
        systemMessage += ' Ground your responses in empirical evidence and clinical research when available.';
      }
      
      if (guidanceTypes.friend) {
        activeRoles.push('a supportive friend');
        systemMessage += ' Be warm, empathetic, and supportive in your interactions.';
      }
      
      if (guidanceTypes.assistant) {
        activeRoles.push('a task-oriented assistant');
        systemMessage += ' Be direct, efficient, and practical in helping with tasks.';
      }
      
      if (guidanceTypes.peer) {
        activeRoles.push('a professional peer');
        systemMessage += ' Interact as a professional equal, focusing on collaboration and shared expertise.';
      }
      
      if (activeRoles.length > 0) {
        systemMessage = `You are an AI assistant helping a therapist with their practice. Act as ${activeRoles.join(' and ')}.`;
      }
    }

    // Check if demo mode is needed (no API key)
    const configuration = getOpenAIConfig();
    if (!configuration) {
      // Return a demo response
      return res.status(200).json({
        message: 'This is a demo response because the OpenAI API key is not configured. In production, this would be a real response from the AI model.',
      });
    }

    // Initialize OpenAI
    const openai = new OpenAIApi(configuration);

    // Call OpenAI API
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: temperature,
      max_tokens: 300,
    });

    // Extract the response text
    const message = response.data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    // Return the response
    return res.status(200).json({ message });
  } catch (error) {
    console.error('Error in AI assistant API:', error);
    return res.status(500).json({ message: 'Error processing your request', error: error.message });
  }
} 