import { useState, useEffect, useRef } from 'react';

/**
 * AI Assistant component that provides text, speech, or avatar interface
 * based on user preferences.
 */
const AIAssistant = ({ 
  interfaceType = 'Text Interface', 
  voiceSettings = { voice: 'System Default', rate: 50 },
  temperature = 30,
  humanAvatarEnabled = true,
  humanAvatarStyle = 'Emoji'
}) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
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

  // Initialize speech recognition
  useEffect(() => {
    // Check if SpeechRecognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setHumanAvatarState('neutral');
        
        // Auto-submit when using voice input
        setTimeout(() => {
          handleSendMessage(null, transcript);
        }, 500);
      };
      
      recognitionRef.current.onend = () => {
        setListening(false);
        setHumanAvatarState('neutral');
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setListening(false);
        setHumanAvatarState('confused');
      };
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Function to toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (listening) {
      recognitionRef.current.abort();
      setListening(false);
      setHumanAvatarState('neutral');
    } else {
      setListening(true);
      setHumanAvatarState('speaking');
      recognitionRef.current.start();
    }
  };

  // Function to handle AI conversation
  const handleSendMessage = async (e, voiceInput = null) => {
    e?.preventDefault();
    
    let userMessage = voiceInput || input.trim();
    
    if (!userMessage) return;
    
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show thinking state for avatar
    setAvatarState('thinking');
    setHumanAvatarState('listening');
    setLoading(true);
    
    try {
      // In a real implementation, we would use the OpenAI API
      // But for demo purposes, let's simulate an API call
      
      if (apiKey) {
        // We have a real API key, so make a real request
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful therapy assistant.' },
              ...messages.map(msg => ({ role: msg.role, content: msg.content })),
              { role: 'user', content: userMessage }
            ],
            temperature: temperature / 100, // Convert 0-100 to 0-1 range
            max_tokens: 300
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to chat
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        
        // Speak the response if using voice or avatar interface
        if (interfaceType === 'Voice Interface' || interfaceType === 'Avatar Interface' || interfaceType === 'Hybrid Interface') {
          speakText(aiResponse);
        }
      } else {
        // Simulate API response
        setTimeout(() => {
          const responses = [
            "That's an interesting point. Let's explore that further.",
            "I understand how you feel. It's common to experience these emotions.",
            "Have you considered trying some mindfulness exercises for this?",
            "Let's break this down into smaller steps to make it more manageable.",
            "It sounds like you've made good progress since our last session."
          ];
          
          const aiResponse = responses[Math.floor(Math.random() * responses.length)];
          
          // Add AI response to chat
          setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
          
          // Speak the response if using voice or avatar interface
          if (interfaceType === 'Voice Interface' || interfaceType === 'Avatar Interface' || interfaceType === 'Hybrid Interface') {
            speakText(aiResponse);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error communicating with AI:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      }]);
      setAvatarState('error');
    } finally {
      setLoading(false);
      // Reset avatar state if not speaking
      if (interfaceType !== 'Voice Interface' && interfaceType !== 'Avatar Interface' && interfaceType !== 'Hybrid Interface') {
        setAvatarState('neutral');
      }
      // Show human is now waiting for a response
      setHumanAvatarState('neutral');
    }
  };
  
  // Function to handle speech synthesis
  const speakText = (text) => {
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
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
      setAvatarState('neutral');
    }
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setAvatarState('neutral');
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
                {messages.map((message, index) => (
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
                      {message.content}
                    </div>
                  </div>
                ))}
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
                {messages.length === 0 && !loading && (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-400 text-center">Type a message or use voice input to start the conversation</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Text input with microphone button */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || listening}
                placeholder={listening ? "Listening..." : "Type your message..."}
                className="flex-1 bg-gray-700 text-white border-0 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              
              {/* Microphone button for speech input */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                className={`p-2 rounded-md ${
                  listening 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white disabled:opacity-50`}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {listening ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>
              
              {/* Send button */}
              <button
                type="submit"
                disabled={loading || listening || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
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
            {listening && (
              <div className="mt-4 p-2 bg-blue-600 rounded-md text-white text-sm text-center animate-pulse">
                Listening...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 