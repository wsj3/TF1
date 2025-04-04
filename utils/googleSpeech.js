// Google Speech API utilities for text-to-speech and speech-to-text
import axios from 'axios';

/**
 * Convert text to speech using Google TTS API via server-side proxy
 * @param {string} text - The text to convert to speech
 * @param {object} options - Options for the speech synthesis
 * @returns {Promise<ArrayBuffer>} - The audio data as an ArrayBuffer
 */
export async function textToSpeech(text, options = {}) {
  try {
    const defaultOptions = {
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F', // A high-quality female voice
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0, // Default pitch (range: -20.0 to 20.0)
        speakingRate: 1.0, // Default rate (range: 0.25 to 4.0)
      }
    };

    // Merge default options with user-provided options
    const mergedOptions = {
      voice: { ...defaultOptions.voice, ...(options.voice || {}) },
      audioConfig: { ...defaultOptions.audioConfig, ...(options.audioConfig || {}) }
    };

    // If rate is provided in a 0-100 range, convert it to the Google TTS range
    if (options.rate !== undefined) {
      // Convert from 0-100 range to 0.25-2.0 range
      mergedOptions.audioConfig.speakingRate = 0.25 + (options.rate / 100) * 1.75;
    }

    try {
      // Call our server-side proxy endpoint
      const response = await axios({
        method: 'POST',
        url: '/api/google-speech/text-to-speech',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          text,
          voice: mergedOptions.voice,
          audioConfig: mergedOptions.audioConfig
        },
        timeout: 10000 // 10 second timeout
      });

      // The response contains a base64-encoded audio content
      const audioContent = response.data.audioContent;
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(audioContent);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.warn('Google TTS API error, falling back to browser speech synthesis:', error);
      throw error; // Throw to trigger the fallback
    }
  } catch (error) {
    // Use a simpler fallback that works in more browsers
    console.warn('Using simplified speech synthesis fallback');
    return useBrowserSpeechSynthesis(text, options);
  }
}

/**
 * Fallback function that uses the browser's built-in speech synthesis
 * @param {string} text - The text to convert to speech
 * @param {object} options - Options for the speech synthesis
 * @returns {Promise<ArrayBuffer|null>} - Either null (for direct playback) or an ArrayBuffer
 */
function useBrowserSpeechSynthesis(text, options = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.error('Browser speech synthesis is not available');
      // Return an empty buffer so playback can continue
      resolve(new ArrayBuffer(0));
      return;
    }
    
    // Create an audio element that will signal when speech is done
    const audioElement = document.createElement('audio');
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice and rate from options if available
    if (options.voice && options.voice !== 'System Default') {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === options.voice);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    if (options.rate !== undefined) {
      // Convert from 0-100 range to browser's 0.1-10 range
      utterance.rate = 0.5 + (options.rate / 50);
    }
    
    // Signal that we're using browser synthesis directly
    utterance.onend = () => {
      document.body.removeChild(audioElement);
      // Return an empty buffer but with a special flag
      const buffer = new ArrayBuffer(0);
      // @ts-ignore
      buffer._directSynthesis = true;
      resolve(buffer);
    };
    
    utterance.onerror = () => {
      document.body.removeChild(audioElement);
      // Return an empty buffer
      resolve(new ArrayBuffer(0));
    };
    
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Convert speech to text using Google Speech-to-Text API via a client-side wrapper
 * This function returns a controller to manage the recognition process
 * @param {object} options - Options for the speech recognition
 * @returns {object} - A controller object for the recognition process
 */
export function startSpeechToText(options = {}) {
  // Create a controller object
  const controller = {
    isListening: false,
    recognition: null,
    start: () => {},
    stop: () => {},
    abort: () => {}
  };

  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("Speech recognition is not supported in this browser");
    return controller;
  }

  const defaultOptions = {
    continuous: false,
    interimResults: false,
    lang: 'en-US',
  };

  // Merge default options with user-provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Initialize speech recognition
  const recognition = new SpeechRecognition();
  recognition.continuous = mergedOptions.continuous;
  recognition.interimResults = mergedOptions.interimResults;
  recognition.lang = mergedOptions.lang;
  
  // Set up recognition events
  if (options.onStart) recognition.onstart = options.onStart;
  if (options.onEnd) recognition.onend = options.onEnd;
  if (options.onResult) recognition.onresult = options.onResult;
  if (options.onError) recognition.onerror = options.onError;
  
  // Set up controller methods
  controller.recognition = recognition;
  controller.start = () => {
    if (!controller.isListening) {
      recognition.start();
      controller.isListening = true;
    }
  };
  controller.stop = () => {
    if (controller.isListening) {
      recognition.stop();
      controller.isListening = false;
    }
  };
  controller.abort = () => {
    if (controller.isListening) {
      recognition.abort();
      controller.isListening = false;
    }
  };
  
  return controller;
}

/**
 * Play audio from ArrayBuffer
 * @param {ArrayBuffer} audioBuffer - The audio data as an ArrayBuffer
 * @param {function} onEnded - Callback function to execute when audio playback ends
 * @returns {HTMLAudioElement|null} - The audio element playing the sound or null if using direct synthesis
 */
export function playAudio(audioBuffer, onEnded = null) {
  // Check for direct browser synthesis flag
  // @ts-ignore
  if (audioBuffer._directSynthesis) {
    // Direct synthesis is already happening, just set a timeout for the end callback
    if (onEnded) {
      setTimeout(() => {
        onEnded();
      }, 100); // Call after a short delay
    }
    return null;
  }
  
  // Skip playback for empty buffers
  if (audioBuffer.byteLength === 0) {
    if (onEnded) {
      setTimeout(() => {
        onEnded();
      }, 100);
    }
    return null;
  }
  
  // Convert ArrayBuffer to Blob
  const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create audio element
  const audio = new Audio(url);
  
  // Set up ended event handler
  if (onEnded) {
    audio.onended = () => {
      URL.revokeObjectURL(url); // Clean up
      onEnded();
    };
  } else {
    audio.onended = () => URL.revokeObjectURL(url); // Clean up
  }
  
  // Play the audio
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
    URL.revokeObjectURL(url);
    if (onEnded) {
      onEnded();
    }
  });
  
  return audio;
}

/**
 * Record audio from the microphone and convert to Google Cloud Speech-to-Text compatible format
 * @param {object} options - Options for recording and recognition
 * @returns {Promise<string>} - The transcribed text
 */
export const googleSpeechToText = async ({ 
  duration = 15000,
  language = 'en-US',
  silenceThreshold = -50,
  silenceTimeout = 1500,
  onStatus = () => {},
  onGetCancelFn = () => {}
}) => {
  return new Promise((resolve, reject) => {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition is not supported in this browser'));
      return;
    }

    // Use Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = '';
    let timeoutId = null;

    recognition.onstart = () => {
      onStatus({ status: 'listening' });
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Reset silence timeout on new speech
      if (interimTranscript) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          recognition.stop();
        }, silenceTimeout);
      }

      onStatus({ 
        status: 'processing',
        interim: interimTranscript,
        final: finalTranscript
      });
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      reject(event.error);
    };

    recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      onStatus({ status: 'done' });
      
      // Return results in a format similar to Google Cloud Speech-to-Text
      resolve([{
        alternatives: [{
          transcript: finalTranscript,
          confidence: 0.9
        }]
      }]);
    };

    // Start recognition
    recognition.start();

    // Provide cancel function
    onGetCancelFn(() => {
      if (timeoutId) clearTimeout(timeoutId);
      recognition.stop();
    });

    // Stop after duration
    setTimeout(() => {
      if (timeoutId) clearTimeout(timeoutId);
      recognition.stop();
    }, duration);
  });
};

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
} 