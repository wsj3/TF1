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
export const googleSpeechToText = async (options = {}) => {
  // Default options with increased duration
  const defaultOptions = {
    duration: 20000, // Increased from 10000 to 20000 (20 seconds)
    language: 'en-US',
    interimResults: false,
    silenceThreshold: -50, // dB threshold for silence detection
    silenceTimeout: 2000,  // End recording after 2 seconds of silence
    onStatus: () => {},
    onGetCancelFn: () => {}
  };
  
  const config = { ...defaultOptions, ...options };
  
  // Make sure we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return Promise.reject(new Error('Speech recognition requires a browser environment'));
  }
  
  // Check for required browser features
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return Promise.reject(new Error('Browser does not support mediaDevices.getUserMedia'));
  }
  
  // Check for AudioContext
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return Promise.reject(new Error('Browser does not support AudioContext'));
  }
  
  return new Promise(async (resolve, reject) => {
    let audioContext;
    let mediaStream;
    let mediaRecorder;
    let analyzer;
    let audioChunks = [];
    let isRecording = false;
    let isCancelled = false;
    let silenceStartTime = null;
    let recordingStartTime = Date.now();
    let silenceDetectionInterval;
    
    // Create a cancel function that can be called to stop recording
    const cancel = () => {
      if (!isRecording) return;
      
      console.log('Cancelling speech recognition');
      isCancelled = true;
      cleanup();
      resolve('');
    };
    
    // Pass the cancel function back through the callback
    config.onGetCancelFn(cancel);
    
    // Setup cleanup function
    const cleanup = () => {
      console.log('Cleaning up speech recognition resources');
      isRecording = false;
      
      if (silenceDetectionInterval) {
        clearInterval(silenceDetectionInterval);
        silenceDetectionInterval = null;
      }
      
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }
      
      if (audioContext) {
        if (audioContext.state !== 'closed') {
          try {
            audioContext.close().catch(e => console.error('Error closing audio context:', e));
          } catch (e) {
            console.error('Error closing audio context:', e);
          }
        }
        audioContext = null;
      }
    };
    
    try {
      // Request microphone access
      console.log('Requesting microphone access');
      config.onStatus({ status: 'requesting_microphone' });
      
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }});
      
      // Create audio context and analyzer node for silence detection
      audioContext = new AudioContext();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.5;
      microphone.connect(analyzer);
      
      // Setup media recorder
      const options = { mimeType: 'audio/webm' };
      mediaRecorder = new MediaRecorder(mediaStream, options);
      
      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      // Setup silence detection
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      silenceDetectionInterval = setInterval(() => {
        if (!isRecording || !analyzer) return;
        
        // Get audio data
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Convert to dB (rough approximation)
        const volume = 20 * Math.log10(average / 255);
        
        // Calculate remaining time
        const elapsedTime = Date.now() - recordingStartTime;
        const remainingTime = Math.max(0, Math.floor((config.duration - elapsedTime) / 1000));
        
        // Update status with current volume and time left
        config.onStatus({ 
          status: 'recording', 
          volume, 
          timeLeft: remainingTime,
          silenceDetected: volume < config.silenceThreshold
        });
        
        // Check for silence
        if (volume < config.silenceThreshold) {
          if (silenceStartTime === null) {
            silenceStartTime = Date.now();
          } else if (Date.now() - silenceStartTime > config.silenceTimeout) {
            console.log(`Silence detected for ${config.silenceTimeout}ms, stopping recording`);
            config.onStatus({ status: 'silence_detected' });
            
            // Stop recording due to silence
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }
        } else {
          // Reset silence timer if sound is detected
          silenceStartTime = null;
        }
        
        // Check if we've reached the maximum duration
        if (elapsedTime >= config.duration && mediaRecorder.state === 'recording') {
          console.log('Maximum recording duration reached');
          config.onStatus({ status: 'max_duration_reached' });
          mediaRecorder.stop();
        }
      }, 100);
      
      // Handle completion
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        config.onStatus({ status: 'processing' });
        
        // Clear the interval
        if (silenceDetectionInterval) {
          clearInterval(silenceDetectionInterval);
          silenceDetectionInterval = null;
        }
        
        // If cancelled, resolve with empty string
        if (isCancelled) {
          cleanup();
          return resolve('');
        }
        
        // Combine audio chunks
        if (audioChunks.length === 0) {
          console.log('No audio recorded');
          cleanup();
          return resolve('');
        }
        
        try {
          // Create blob and convert to base64
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            if (!e.target || !e.target.result) {
              throw new Error('Failed to read audio data');
            }
            
            // Get base64 data
            const audioBytes = e.target.result;
            const base64Audio = arrayBufferToBase64(audioBytes);
            
            try {
              // Send to Google Speech-to-Text API endpoint
              const response = await fetch('/api/google-speech/speech-to-text', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  audioContent: base64Audio,
                  config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 48000,
                    languageCode: config.language,
                    enableAutomaticPunctuation: true,
                    model: 'latest_long', // Use long-form model for better results
                  }
                }),
              });
              
              if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
              }
              
              const data = await response.json();
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              // Clean up resources
              cleanup();
              
              // Return the transcription
              if (data.results && data.results.length > 0) {
                console.log('Transcription successful:', data.results);
                resolve(data.results);
              } else {
                console.log('No speech detected');
                resolve('');
              }
            } catch (error) {
              console.error('Speech-to-text API error:', error);
              cleanup();
              reject(error);
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error reading audio blob:', error);
            cleanup();
            reject(error);
          };
          
          // Read the blob as ArrayBuffer
          reader.readAsArrayBuffer(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          cleanup();
          reject(error);
        }
      };
      
      // Start recording
      console.log('Starting recording for up to', config.duration, 'ms');
      config.onStatus({ status: 'recording', timeLeft: Math.floor(config.duration / 1000) });
      mediaRecorder.start();
      isRecording = true;
      recordingStartTime = Date.now();
      
    } catch (error) {
      console.error('Error in speech recognition:', error);
      cleanup();
      reject(error);
    }
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