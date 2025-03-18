// Mock endpoint for chat completions - use for testing without API key
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get the last user message to generate a relevant response
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content.toLowerCase() || '';
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a relevant response based on the input
    let response;
    if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
      response = "Hello! How can I help you today?";
    } else if (lastUserMessage.includes('how are you')) {
      response = "I'm functioning well, thank you for asking! How are you doing?";
    } else if (lastUserMessage.includes('voice') || lastUserMessage.includes('speech')) {
      response = "Yes, I can communicate using voice. I can listen to you speak and respond with speech as well. This is a two-way voice conversation.";
    } else if (lastUserMessage.includes('help') || lastUserMessage.includes('can you')) {
      response = "I'm here to help! I can answer questions, provide information, assist with tasks, or just chat. What would you like to talk about?";
    } else if (lastUserMessage.includes('thank')) {
      response = "You're welcome! Is there anything else I can help you with?";
    } else {
      // Default responses for generic inputs
      const responses = [
        "That's an interesting point. Let's explore that further.",
        "I understand what you're saying. Could you tell me more about that?",
        "I'm here to assist with that. What specific aspects would you like to focus on?",
        "That's a good question. From my perspective, there are several ways to approach this.",
        "I appreciate you sharing that. Would you like some suggestions related to this topic?"
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    return res.status(200).json({ 
      message: response,
      usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }
    });
  } catch (error) {
    console.error('Error in mock chat completion:', error);
    return res.status(500).json({ 
      error: 'Error with chat completion', 
      details: error.message 
    });
  }
} 