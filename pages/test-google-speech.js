import { useState, useEffect, useRef } from 'react';
import { textToSpeech, startSpeechToText, playAudio } from '../utils/googleSpeech';
import Head from 'next/head';

export default function TestGoogleSpeech() {
  const [text, setText] = useState("Hello, this is a test of Google's Text-to-Speech API.");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      recognitionRef.current = startSpeechToText({
        continuous: false,
        interimResults: false,
        lang: 'en-US',
        onResult: (event) => {
          const transcript = event.results[0][0].transcript;
          setTranscription(transcript);
        },
        onEnd: () => {
          setIsListening(false);
        },
        onError: (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          setError(`Speech recognition error: ${event.error}`);
        },
        onStart: () => {
          setIsListening(true);
          setError(null);
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Function to handle text-to-speech
  const handleSpeak = async () => {
    if (!text.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const audioBuffer = await textToSpeech(text, {
        rate: 50 // Use a default rate of 50 (middle of the 0-100 range)
      });
      
      // If we're already playing something, stop it
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play the audio
      audioRef.current = playAudio(audioBuffer, () => {
        audioRef.current = null;
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setError(`Error with text-to-speech: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Function to handle speech-to-text
  const toggleListening = () => {
    if (!recognitionRef.current || !recognitionRef.current.recognition) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.abort();
      // The onEnd handler will update state
    } else {
      setTranscription('');
      recognitionRef.current.start();
      // The onStart handler will update state
    }
  };

  // Function to stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsLoading(false);
    }
  };

  // Function to use transcription as input
  const useTranscription = () => {
    if (transcription) {
      setText(transcription);
      setTranscription('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Google Speech API Test</title>
      </Head>
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Google Speech API Test</h1>
        
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Text-to-Speech</h2>
          
          <div className="mb-4">
            <label htmlFor="text-input" className="block mb-2">Text to speak:</label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-md"
              rows={4}
            />
          </div>
          
          <div className="flex space-x-4 mb-8">
            <button
              onClick={handleSpeak}
              disabled={isLoading || !text.trim()}
              className={`px-4 py-2 rounded-md ${isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 'Speaking...' : 'Speak Text'}
            </button>
            
            {isLoading && (
              <button
                onClick={stopAudio}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
              >
                Stop Speaking
              </button>
            )}
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Speech-to-Text</h2>
          
          <div className="mb-4">
            <button
              onClick={toggleListening}
              className={`px-4 py-2 rounded-md ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
          </div>
          
          {isListening && (
            <div className="mb-4 p-3 bg-blue-700 rounded-md animate-pulse">
              Listening... Speak now!
            </div>
          )}
          
          {transcription && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Transcription:</h3>
              <div className="p-3 bg-gray-700 rounded-md mb-2">
                {transcription}
              </div>
              <button
                onClick={useTranscription}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Use This Text
              </button>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-800 text-white rounded-md mt-4">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 