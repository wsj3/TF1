// Server-side proxy for Google Speech-to-Text API
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    const { audioContent, config = {} } = req.body;
    
    if (!audioContent) {
      return res.status(400).json({ error: 'Missing audio content' });
    }
    
    // Get the API key from environment variables
    const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Google API key');
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }
    
    // Default configuration
    const defaultConfig = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      maxAlternatives: 1
    };
    
    // Merge provided config with defaults
    const speechConfig = { ...defaultConfig, ...config };
    
    // Call the Google Cloud Speech-to-Text API
    const endpoint = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: speechConfig,
        audio: {
          content: audioContent
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Speech API error:', errorData);
      return res.status(response.status).json({ 
        error: `Google Speech API error: ${errorData.error?.message || 'Unknown error'}` 
      });
    }
    
    const data = await response.json();
    
    // Format the response for the client
    if (data.results && data.results.length > 0) {
      return res.status(200).json({ 
        results: data.results.map(result => ({
          alternatives: result.alternatives.map(alt => ({
            transcript: alt.transcript,
            confidence: alt.confidence || 0
          }))
        }))
      });
    } else {
      // No speech detected
      return res.status(200).json({ results: [] });
    }
  } catch (error) {
    console.error('Error in Speech-to-Text API:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
} 