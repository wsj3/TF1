// Test endpoint for Google TTS
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ 
        status: 'unavailable',
        error: 'Google TTS API key is not configured' 
      });
    }

    // For test purposes, we'll just return success without actually calling the API
    return res.status(200).json({ 
      status: 'available',
      message: 'Google TTS API is configured' 
    });
  } catch (error) {
    console.error('Error testing Google TTS API:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'Error testing Google TTS API' 
    });
  }
} 