// Server-side proxy for Google Text-to-Speech API
import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice, audioConfig } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google TTS API key is missing' });
    }

    // Default voice and audio settings
    const defaultVoice = {
      languageCode: 'en-US',
      name: 'en-US-Neural2-F',
      ssmlGender: 'FEMALE'
    };

    const defaultAudioConfig = {
      audioEncoding: 'MP3',
      pitch: 0,
      speakingRate: 1.0
    };

    // Send request to Google TTS API
    const response = await axios({
      method: 'POST',
      url: `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        input: { text },
        voice: voice || defaultVoice,
        audioConfig: audioConfig || defaultAudioConfig
      }
    });

    // Return the audio content
    return res.status(200).json({ 
      audioContent: response.data.audioContent
    });
  } catch (error) {
    console.error('Google TTS API error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Error with Google TTS API', 
      details: error.response?.data || error.message 
    });
  }
} 