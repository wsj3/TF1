import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { textToSpeech, playAudio, googleSpeechToText } from '../utils/googleSpeech';
// Import searchClientsApi from our apiHelpers
import { searchClientsApi, callAssistantApi, callDirectApi } from '../utils/apiHelpers';
import { encryptData, decryptData } from '../utils/encryption';
import { sanitizeMessage, validateHIPAACompliance } from '../utils/hipaaUtils';

/**
 * AI Assistant component that provides text, speech, or avatar interface
 * based on user preferences.
 */
const AIAssistant = forwardRef(({ 
  interfaceType = 'Text Interface', 
  voiceSettings = { voice: 'System Default', rate: 50 },
  temperature = 30,
  humanAvatarEnabled = true,
  humanAvatarStyle = 'Emoji',
  onSpeechResult = () => {},
  initialMessages = [], // Initial messages for persistence
  persistKey = 'default-conversation', // Key for localStorage persistence
  clientId = null, // Add clientId prop for context
  sessionType = 'general' // Add session type for context
}, ref) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [listeningStatus, setListeningStatus] = useState('');
  const [audioElement, setAudioElement] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const stopListeningRef = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  // Track conversation history
  const conversationHistory = useRef(initialMessages);
  
  // Add new state for enhanced features
  const [retryCount, setRetryCount] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [conversationContext, setConversationContext] = useState({
    clientId,
    sessionType,
    lastActivity: Date.now(),
    clinicalContext: null,
    memoryWindow: 10, // Number of messages to keep in context
    relevantHistory: []
  });
  
  // Add session timeout constant
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Add a useEffect to clear problematic data on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if this is the first time loading after fixes
      const sanitizationApplied = localStorage.getItem('sanitization-applied');
      
      if (!sanitizationApplied) {
        console.log('First load after sanitization fix - cleaning all AI message data');
        
        // Clear known problematic keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('message') || key.includes('conversation') || key.startsWith('ai-')) {
            console.log('Clearing potentially unsafe data from:', key);
            localStorage.removeItem(key);
          }
        });
        
        // Mark that we've done the cleanup
        localStorage.setItem('sanitization-applied', 'true');
      }
      
      try {
        const savedMessages = localStorage.getItem(`ai-messages-${persistKey}`);
        if (savedMessages) {
          const decryptedMessages = JSON.parse(decryptData(savedMessages));
          const sanitizedMessages = decryptedMessages.map(msg => ({
            ...msg,
            content: sanitizeMessage(msg.content || '')
          }));
          setMessages(sanitizedMessages);
          conversationHistory.current = sanitizedMessages;
          console.log(`Loaded and sanitized ${sanitizedMessages.length} messages from localStorage for ${persistKey}`);
        }
      } catch (error) {
        console.error('Error loading persisted messages:', error);
        localStorage.removeItem(`ai-messages-${persistKey}`);
      }
    }
  }, [persistKey]);
  
  // Save messages when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const encryptedMessages = encryptData(JSON.stringify(messages));
      localStorage.setItem(`ai-messages-${persistKey}`, encryptedMessages);
      conversationHistory.current = messages;
    }
  }, [messages, persistKey]);
  
  // Immediately after the useEffect hooks add a test function for direct API communication
  useEffect(() => {
    // Test the assistant API directly on component mount
    if (messages.length === 0) {
      console.log('Testing assistant API with direct fetch...');
      testAssistantApi();
    }
  }, []);
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    startListening: () => {
      if (!isListening && !processingVoice) {
        updateLastActivity();
        toggleListening();
      }
    },
    stopListening: () => {
      if (isListening || processingVoice) {
        updateLastActivity();
        toggleListening();
      }
    },
    stopSpeaking,
    speakText,
    // Add methods to access and clear conversation
    getMessages: () => messages,
    clearMessages: () => {
      setMessages([]);
      conversationHistory.current = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`ai-messages-${persistKey}`);
      }
      updateLastActivity();
    },
    onSessionTimeout: () => {
      handleSessionTimeout();
    }
  }));
  
  // Get human avatar settings from localStorage if not provided as props
  const [localHumanAvatarEnabled, setLocalHumanAvatarEnabled] = useState(humanAvatarEnabled);
  const [localHumanAvatarStyle, setLocalHumanAvatarStyle] = useState(humanAvatarStyle);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHumanAvatarEnabled = localStorage.getItem('humanAvatarEnabled');
      const savedHumanAvatarStyle = localStorage.getItem('humanAvatarStyle');
      
      if (savedHumanAvatarEnabled !== null) {
        setLocalHumanAvatarEnabled(savedHumanAvatarEnabled === 'true');
      }
      
      if (savedHumanAvatarStyle) {
        setLocalHumanAvatarStyle(savedHumanAvatarStyle);
      }
    }
  }, []);
  
  // Avatar expressions and states
  const [avatarState, setAvatarState] = useState('neutral');
  const [humanAvatarState, setHumanAvatarState] = useState('neutral');
  
  const avatarStates = {
    listening: '👂',
    thinking: '🤔',
    speaking: '🗣️',
    neutral: '😊',
    error: '😟'
  };
  
  // Human avatar styles
  const humanAvatarStyles = {
    Emoji: {
      speaking: '🙋',
      listening: '👨‍💼',
      neutral: '👤',
      happy: '😃',
      confused: '🤷',
      thinking: '🧐'
    },
    Animated: {
      speaking: '🧑‍💼',
      listening: '👨‍💼',
      neutral: '🧑',
      happy: '😄',
      confused: '😕',
      thinking: '🤔'
    },
    'Photo-Realistic': {
      speaking: '👱',
      listening: '👱‍♂️',
      neutral: '👨',
      happy: '😀',
      confused: '😟',
      thinking: '🤔'
    }
  };
  
  // Get the current human avatar state based on style
  const getHumanAvatarEmoji = (state) => {
    return humanAvatarStyles[localHumanAvatarStyle]?.[state] || humanAvatarStyles.Emoji[state];
  };
  
  useEffect(() => {
    // Scroll to bottom of messages when they change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cleanup speech resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop any active speech
      stopSpeaking();
    };
  }, []);

  // Update the toggleListening function
  const toggleListening = async () => {
    if (isListening) {
      handleStopListening();
    } else {
      handleStartListening();
    }
  };

  const handleStartListening = async () => {
    try {
      setIsListening(true);
      setError(null);
      setHumanAvatarState('speaking');
      setProcessingVoice(false);

      const results = await googleSpeechToText({
        duration: 15000,
        language: 'en-US',
        silenceTimeout: 1500,
        onStatus: (status) => {
          if (status.status === 'listening') {
            setListeningStatus('Listening...');
          } else if (status.status === 'processing') {
            setProcessingVoice(true);
            setHumanAvatarState('thinking');
            if (status.interim) {
              setListeningStatus(`Processing: ${status.interim}`);
            }
          } else if (status.status === 'done') {
            setListeningStatus('Processing complete');
          }
        },
        onGetCancelFn: (cancelFn) => {
          stopListeningRef.current = cancelFn;
        }
      });

      if (results && results[0]?.alternatives[0]?.transcript) {
        const transcript = results[0].alternatives[0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      setError('Speech recognition failed. Please try again or type your message.');
      setHumanAvatarState('confused');
    } finally {
      setIsListening(false);
      setProcessingVoice(false);
      setListeningStatus('');
      setHumanAvatarState('neutral');
    }
  };

  const handleStopListening = () => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
    }
    setIsListening(false);
    setProcessingVoice(false);
    setListeningStatus('');
    setHumanAvatarState('neutral');
  };

  // Replace direct API call with our safe helper
  const searchClients = async (query) => {
    console.log('Using safe API helper to search for clients:', query);
    return searchClientsApi(query);
  };
  
  // Session timeout management
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);

    setSessionTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Update last activity on user interaction
  const updateLastActivity = () => {
    setConversationContext(prev => ({
      ...prev,
      lastActivity: Date.now()
    }));
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      const newTimeout = setTimeout(() => {
        handleSessionTimeout();
      }, SESSION_TIMEOUT);
      setSessionTimeout(newTimeout);
    }
  };

  // Handle session timeout
  const handleSessionTimeout = () => {
    console.log('Session timeout - clearing sensitive data');
    clearMessages();
    // Notify parent component of timeout
    if (ref.current?.onSessionTimeout) {
      ref.current.onSessionTimeout();
    }
  };

  // Add function to load conversation history
  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/ai/conversations?clientId=${clientId}&sessionType=${sessionType}`);
      const data = await response.json();
      
      if (data.conversations && data.conversations.length > 0) {
        const latestConversation = data.conversations[0];
        const recentMessages = latestConversation.messages.slice(-conversationContext.memoryWindow);
        
        setConversationContext(prev => ({
          ...prev,
          relevantHistory: recentMessages
        }));
        
        // Update messages state with recent history
        setMessages(recentMessages);
        conversationHistory.current = recentMessages;
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  // Update useEffect to load history on mount
  useEffect(() => {
    if (clientId && sessionType) {
      loadConversationHistory();
    }
  }, [clientId, sessionType]);

  // Update handleSendMessage to use context
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare context for AI
      const contextData = {
        ...conversationContext,
        currentMessage: message,
        recentMessages: messages.slice(-conversationContext.memoryWindow)
      };
      
      // Call API with context
      const response = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          sessionType,
          message,
          context: contextData
        })
      });
      
      const data = await response.json();
      
      if (data.messages) {
        setMessages(prev => [...prev, ...data.messages]);
        conversationHistory.current = [...conversationHistory.current, ...data.messages];
        
        // Update context with new messages
        setConversationContext(prev => ({
          ...prev,
          lastActivity: Date.now(),
          relevantHistory: data.messages.slice(-prev.memoryWindow)
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add function to update clinical context
  const updateClinicalContext = async (newContext) => {
    try {
      setConversationContext(prev => ({
        ...prev,
        clinicalContext: newContext
      }));
      
      // Save clinical context to database
      await fetch('/api/ai/clinical-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          context: newContext
        })
      });
    } catch (error) {
      console.error('Error updating clinical context:', error);
    }
  };

  // Add function to summarize conversation
  const summarizeConversation = async () => {
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          sessionType,
          messages: conversationHistory.current
        })
      });
      
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return null;
    }
  };
  
  // Helper function to generate fallback responses when API fails
  const generateFallbackResponse = (message) => {
    const lowercaseMessage = message.toLowerCase();
    
    let response = "I'm here to help with appointments, client management, diagnoses, billing, and more. How can I assist you today?";
    
    if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
      response = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (lowercaseMessage.includes('appointment') || lowercaseMessage.includes('schedule')) {
      response = "I'd be happy to help you schedule an appointment. What date and time works for you, and which client is this for?";
    } else if (lowercaseMessage.includes('client') || lowercaseMessage.includes('patient')) {
      response = "I can help you manage client information. Would you like to search for a specific client or create a new record?";
    } else if (lowercaseMessage.includes('diagnos')) {
      response = "I can assist with diagnosis information. Would you like to view existing diagnoses or create a new one?";
    } else if (lowercaseMessage.includes('billing') || lowercaseMessage.includes('payment')) {
      response = "I can help with billing inquiries. Would you like to review recent transactions or create a new invoice?";
    }
    
    return sanitizeMessage(response);
  };
  
  // Make speakText return a promise so we can await it
  const speakText = async (text) => {
    return new Promise((resolve) => {
      try {
        // Stop any current speech
        stopSpeaking();
        
        // Set UI states
        setAvatarState('speaking');
        setSpeaking(true);
        
        // Use Google Cloud Text-to-Speech
        const voiceOptions = {
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-F', // High-quality female voice
            ssmlGender: 'FEMALE'
          },
          rate: voiceSettings.rate // Use the rate from the settings
        };
        
        // Get audio data from Google TTS
        textToSpeech(text, voiceOptions)
          .then(audioBuffer => {
            // Play the audio
            const audio = playAudio(audioBuffer, () => {
              setSpeaking(false);
              setAvatarState('neutral');
              resolve(); // Resolve the promise when speech ends
            });
            
            // Save the audio element reference for stopping later
            setAudioElement(audio);
          })
          .catch(error => {
            console.error('Text-to-speech error:', error);
            
            // Fallback to browser speech synthesis
            if ('speechSynthesis' in window) {
              setAvatarState('speaking');
              setSpeaking(true);
              
              const utterance = new SpeechSynthesisUtterance(text);
              
              // Set voice based on settings
              if (voiceSettings.voice !== 'System Default') {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.name === voiceSettings.voice);
                if (selectedVoice) utterance.voice = selectedVoice;
              }
              
              // Set rate based on settings (1 is normal, range 0.1 to 10)
              utterance.rate = 0.5 + (voiceSettings.rate / 50); // Convert 0-100 to 0.5-2.5 range
              
              utterance.onend = () => {
                setSpeaking(false);
                setAvatarState('neutral');
                resolve(); // Resolve the promise when speech ends
              };
              
              window.speechSynthesis.speak(utterance);
            } else {
              console.warn('Speech synthesis not supported');
              setAvatarState('neutral');
              setSpeaking(false);
              resolve(); // Resolve even without speech
            }
          });
      } catch (error) {
        console.error('Error in speakText:', error);
        setAvatarState('neutral');
        setSpeaking(false);
        resolve(); // Resolve even with errors
      }
    });
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    // Stop Google Cloud TTS audio if playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    
    // Also stop browser speech synthesis if running
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Update states
    setSpeaking(false);
    setAvatarState('neutral');
  };
  
  // Render error message if present
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  };
  
  // Add this test function
  const testAssistantApi = async () => {
    try {
      // Don't run the test if we already have messages
      if (messages.length > 0) {
        console.log('Skipping test, conversation already has messages:', messages.length);
        return;
      }
      
      console.log('🧪 Testing Assistant API connection...');
      
      // First try the new test-assistant endpoint
      try {
        console.log('Testing with /api/test-assistant endpoint...');
        const testResponse = await fetch('/api/test-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Hello, this is a test message' }]
          })
        });
        
        console.log('Test assistant API response status:', testResponse.status);
        const testData = await testResponse.json();
        console.log('Test assistant API data:', testData);
        
        // Use the test endpoint's sample response if available
        if (testData.success && testData.data) {
          const testUserMessage = { role: 'user', content: 'Hello, this is a test message from system startup' };
          const testAssistantResponse = { 
            role: 'assistant', 
            content: testData.data?.content || 'Test message content not found'
          };
          
          console.log('Using test endpoint sample response:', testAssistantResponse.content);
          
          // Only add if no messages exist
          if (messages.length === 0) {
            setMessages([testUserMessage, testAssistantResponse]);
            // Also update conversation history
            conversationHistory.current = [testUserMessage, testAssistantResponse];
            console.log('✅ Test assistant API sample response displayed');
            return; // Success - no need to try the assistant API
          }
        }
      } catch (testError) {
        console.error('Test assistant API error:', testError);
      }
      
      // Try the regular test endpoint as fallback
      try {
        const testResponse = await fetch('/api/test', {
          method: 'GET',
        });
        console.log('Test API response status:', testResponse.status);
        const testData = await testResponse.json();
        console.log('Test API data:', testData);
        
        // Use the test endpoint's sample response if available
        if (testData.success && testData.data) {
          const testUserMessage = { role: 'user', content: 'Hello, this is a test message from system startup' };
          const testAssistantResponse = { 
            role: 'assistant', 
            content: testData.data?.content || 'Test message content not found'
          };
          
          console.log('Using test endpoint sample response:', testAssistantResponse.content);
          
          // Only add if no messages exist
          if (messages.length === 0) {
            setMessages([testUserMessage, testAssistantResponse]);
            // Also update conversation history
            conversationHistory.current = [testUserMessage, testAssistantResponse];
            console.log('✅ Test API sample response displayed');
            return; // Success - no need to try the assistant API
          }
        }
      } catch (testError) {
        console.error('Test API error:', testError);
      }
      
      // Finally, try the actual assistant API as a last resort
      try {
        console.log('Testing with actual /api/assistant endpoint...');
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Hello, this is a test message' }],
            temperature: 0.7,
            conversationId: 'test-conversation'
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Real assistant API test response:', data);
        
        // If successful, add the test message and response to the chat
        if (data.success && data.data) {
          const testUserMessage = { role: 'user', content: 'Hello, this is a test message from system startup' };
          const testAssistantResponse = { 
            role: 'assistant', 
            content: data.data?.content || 'API test succeeded but response format was unexpected'
          };
          
          // Only add if no messages exist
          if (messages.length === 0) {
            setMessages([testUserMessage, testAssistantResponse]);
            // Also update conversation history
            conversationHistory.current = [testUserMessage, testAssistantResponse];
          }
          
          console.log('✅ Assistant API test successful');
        } else {
          console.log('❌ Assistant API test failed with invalid response format');
        }
      } catch (assistantApiError) {
        console.error('Assistant API error:', assistantApiError);
      }
    } catch (error) {
      console.error('Error testing assistant API:', error);
      
      // Use a hardcoded fallback response for the test if all else fails
      if (messages.length === 0) {
        console.log('⚠️ All API tests failed - using hardcoded fallback');
        const fallbackMessages = [
          { role: 'user', content: 'Hello, is the assistant working?' },
          { 
            role: 'assistant', 
            content: 'Hello! I am the AI Assistant. I\'m displaying this fallback message because the API tests failed. This means the component is working but the backend API needs troubleshooting. How can I help you today?' 
          }
        ];
        setMessages(fallbackMessages);
        conversationHistory.current = fallbackMessages;
      }
    }
  };
  
  // Add this safe rendering function
  const safeMsgContent = (msg) => {
    // Skip sanitization if msg is null or undefined
    if (!msg || !msg.content) {
      return "Empty message";
    }
    
    try {
      // Try to sanitize the content first
      const sanitized = sanitizeMessage(msg.content);
      
      // If it contains suspicious patterns after sanitization, replace with a safe message
      const hasSuspiciousContent = (
        sanitized.includes('<') ||
        sanitized.includes('>') ||
        sanitized.includes('script') ||
        sanitized.includes('iframe') ||
        sanitized.includes('onerror') ||
        sanitized.includes('javascript') ||
        sanitized.length > 500 // If extremely long, it might be problematic
      );
      
      if (hasSuspiciousContent) {
        return msg.role === 'user' 
          ? "User message (contains potentially unsafe content)" 
          : "AI response (contains potentially unsafe content)";
      }
      
      return sanitized;
    } catch (error) {
      console.error('Error rendering safe message content:', error);
      return "Error displaying message";
    }
  };
  
  // When the component mounts
  useEffect(() => {
    // Initialize with a test if no messages
    if (!messages.length) {
      console.log('Testing assistant API connection on mount...');
      
      // Define system instructions for the assistant
      const systemInstructions = `
You are an AI assistant for a therapy practice management application. Your role includes:

1. Creating and managing appointments for clients
2. Creating and tracking tasks for therapists
3. Creating billing records for sessions
4. Creating and saving session notes and summaries
5. Creating clinical diagnoses based on session notes and research
6. Searching for client information
7. Providing helpful responses about therapy practice management

When a user asks you to perform actions like scheduling appointments, creating tasks, recording billing, or creating diagnoses, use the appropriate function calls rather than just responding with text. For example:
- If asked to "schedule an appointment for Jane Smith on Friday at 2pm", use the createAppointment function.
- If asked to "create a diagnosis for John based on his depression symptoms", use the createDiagnosis function.

For diagnoses, be thorough in collecting symptoms and information before creating a diagnosis. Consider session history, reported symptoms, and relevant clinical guidelines when formulating a diagnosis. Ask follow-up questions when needed to gather sufficient information.

If you don't have enough information to complete a request, ask follow-up questions to gather the necessary details.

Always be professional, empathetic, and mindful of patient confidentiality. The information you handle is sensitive healthcare data.
      `.trim();
      
      // Test the connection
      callAssistantApi(
        "Hi there! I just need to make sure the connection is working.",
        "initial-test",
        true,
        systemInstructions
      )
      .then((response) => {
        console.log('Assistant API test response:', response);
      })
      .catch((error) => {
        console.error('Error testing assistant API:', error);
      });
    }
  }, [messages]);
  
  // Add a function to call the test endpoint directly
  const callTestAssistantApi = async (message) => {
    try {
      console.log('📢 Calling test-assistant API with message:', message.substring(0, 50) + '...');
      
      const response = await fetch('/api/test-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Test assistant API response:', data);
      
      return {
        success: true,
        data: {
          message: data.data?.content || 'No content found in test response'
        }
      };
    } catch (error) {
      console.error('❌ Error calling test-assistant API:', error);
      return {
        success: false,
        error: error.message,
        data: {
          message: `Error: ${error.message}`
        }
      };
    }
  };
  
  // Add a direct API call method for the temporary test endpoint
  const callDirectApi = async (message) => {
    try {
      console.log('🔄 Calling direct temp-test API with message:', message.substring(0, 50) + '...');
      
      // Create a message payload with history and current message
      const apiMessages = messages.slice(-5).concat({role: 'user', content: message});
      
      const response = await fetch('/api/temp-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Direct API response:', data);
      
      if (data.success && data.data && data.data.content) {
        return {
          success: true,
          data: {
            message: data.data.content
          }
        };
      } else {
        throw new Error('Invalid response format from direct API');
      }
    } catch (error) {
      console.error('❌ Error calling direct API:', error);
      return {
        success: false,
        error: error.message,
        data: {
          message: `Error: ${error.message}`
        }
      };
    }
  };
  
  // Enhanced error handling with retry mechanism
  const handleApiCall = async (apiCall, retryCount = 0) => {
    try {
      const result = await apiCall();
      setRetryCount(0);
      return result;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying API call (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return handleApiCall(apiCall, retryCount + 1);
      }
      throw error;
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Main interface */}
          <div className="flex-1">
            {/* Chat messages area */}
            <div className="bg-gray-750 rounded-lg p-3 h-64 overflow-y-auto mb-4">
              <div className="space-y-3">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-200'
                        }`}
                      >
                        {message.content || "Empty message"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-400 text-center">Type a message or use voice input to start the conversation</p>
                  </div>
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-gray-200 max-w-[80%] rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Text input with send button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && input.trim()) {
                    e.preventDefault();
                    handleSendMessage(null);
                    return false;
                  }
                }}
                disabled={loading || isListening || processingVoice}
                placeholder={
                  isListening 
                    ? listeningStatus || "Listening..." 
                    : processingVoice 
                    ? "Processing voice..." 
                    : "Type your message..."
                }
                className="flex-1 bg-gray-700 text-white border-0 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              
              {/* Microphone button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading || processingVoice}
                className={`p-2 rounded-md ${
                  isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <svg 
                  className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              
              {/* Send button */}
              <button
                type="button"
                onClick={() => {
                  if (input.trim()) {
                    handleSendMessage(null);
                  }
                }}
                disabled={loading || isListening || processingVoice || !(input && input.trim())}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Avatar / Interface Controls */}
          <div className="w-full md:w-64 bg-gray-750 rounded-lg p-4">
            {/* Human and AI Avatar displays */}
            {(interfaceType === 'Avatar Interface' || interfaceType === 'Hybrid Interface') && (
              <div className="flex justify-between mb-4">
                {/* Human Avatar - only show if enabled */}
                {localHumanAvatarEnabled && (
                  <div className="text-center">
                    <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <span className="text-3xl">{getHumanAvatarEmoji(humanAvatarState)}</span>
                    </div>
                    <p className="text-gray-300 text-xs">You</p>
                  </div>
                )}
                
                {/* AI Avatar */}
                <div className="text-center">
                  <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                    <span className="text-3xl">{avatarStates[avatarState]}</span>
                  </div>
                  <p className="text-gray-300 text-xs">Assistant</p>
                </div>
              </div>
            )}
            
            {/* Interface type indicator */}
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Interface Type</h3>
              <div className="bg-gray-700 px-3 py-2 rounded text-gray-300 text-sm">
                {interfaceType}
              </div>
            </div>
            
            {/* Voice controls - only show if using voice/avatar */}
            {(interfaceType === 'Voice Interface' || interfaceType === 'Avatar Interface' || interfaceType === 'Hybrid Interface') && (
              <div className="mb-4">
                <h3 className="text-white font-medium mb-2">Voice Controls</h3>
                {speaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Stop Speaking
                  </button>
                ) : (
                  <div className="bg-gray-700 px-3 py-2 rounded text-gray-300 text-sm text-center">
                    Voice: {voiceSettings.voice}
                  </div>
                )}
              </div>
            )}
            
            {/* Temperature indicator */}
            <div>
              <h3 className="text-white font-medium mb-2">Accuracy Temperature</h3>
              <div className="bg-gray-700 rounded-md w-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${temperature}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            
            {/* Speech recognition status */}
            {(isListening || processingVoice) && (
              <div className="mt-4 p-2 bg-blue-600 rounded-md text-white text-sm text-center animate-pulse">
                {isListening ? "Listening..." : "Processing voice..."}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Display error message if present */}
      {renderError()}
    </div>
  );
});

export default AIAssistant; 