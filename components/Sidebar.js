import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import AIAssistant from './AIAssistant';

export default function Sidebar() {
  const router = useRouter();
  const [aiInterfaceType, setAiInterfaceType] = useState('Text Interface');
  const [aiVoiceSettings, setAiVoiceSettings] = useState({ voice: 'System Default', rate: 50 });
  const [aiTemperature, setAiTemperature] = useState(30);
  const [aiAssistantExpanded, setAiAssistantExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [humanAvatarState, setHumanAvatarState] = useState('neutral');
  const [aiAvatarState, setAiAvatarState] = useState('neutral');
  const [guidanceTypes, setGuidanceTypes] = useState({
    mentor: true,
    scientist: false,
    friend: false,
    assistant: true,
    peer: false
  });
  
  // Avatar expressions and states
  const humanAvatarStates = {
    speaking: '🙋',
    listening: '👨‍💼',
    neutral: '👤',
    happy: '😃',
    confused: '🤷',
    thinking: '🧐'
  };
  
  const aiAvatarStates = {
    listening: '👂',
    thinking: '🤔',
    speaking: '🗣️',
    neutral: '😊',
    error: '😟'
  };
  
  // Load AI settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInterfaceType = localStorage.getItem('aiInterfaceType');
      const savedVoiceSettings = localStorage.getItem('aiVoiceSettings');
      const savedTemperature = localStorage.getItem('aiTemperature');
      const savedGuidanceTypes = localStorage.getItem('guidanceTypes');
      
      if (savedInterfaceType) setAiInterfaceType(savedInterfaceType);
      if (savedVoiceSettings) setAiVoiceSettings(JSON.parse(savedVoiceSettings));
      if (savedTemperature) setAiTemperature(parseInt(savedTemperature));
      if (savedGuidanceTypes) setGuidanceTypes(JSON.parse(savedGuidanceTypes));
    }
  }, []);
  
  // Save AI settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiInterfaceType', aiInterfaceType);
      localStorage.setItem('aiVoiceSettings', JSON.stringify(aiVoiceSettings));
      localStorage.setItem('aiTemperature', aiTemperature.toString());
      localStorage.setItem('guidanceTypes', JSON.stringify(guidanceTypes));
    }
  }, [aiInterfaceType, aiVoiceSettings, aiTemperature, guidanceTypes]);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if SpeechRecognition is available
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition && !recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setMessage(transcript);
          
          // Auto-submit when using voice input
          setTimeout(() => {
            handleSendMessage(null, transcript);
          }, 500);
        };
        
        recognitionRef.current.onend = () => {
          setListening(false);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setListening(false);
        };
      }
    }
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Get avatar settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHumanAvatarStyle = localStorage.getItem('humanAvatarStyle');
      if (savedHumanAvatarStyle && savedHumanAvatarStyle !== 'Emoji') {
        // If another style is selected, we would load different emoji sets here
      }
    }
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
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Tasks', href: '/tasks', icon: 'task' },
    { name: 'Clients', href: '/clients', icon: 'user' },
    { name: 'Appointments', href: '/appointments', icon: 'calendar' },
    { name: 'Sessions', href: '/sessions', icon: 'chat' },
    { name: 'Diagnoses', href: '/diagnoses', icon: 'diagnosis' },
    { name: 'Billing', href: '/billing', icon: 'billing' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];
  
  // Toggle AI Assistant expansion
  const toggleAiAssistantExpanded = () => {
    setAiAssistantExpanded(!aiAssistantExpanded);
  };

  // Function to handle sending a message
  const handleSendMessage = async (e, voiceInput = null) => {
    e?.preventDefault();
    
    let userMessage = voiceInput || message.trim();
    
    if (!userMessage) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Clear input
    setMessage('');
    
    // Update avatar states
    setHumanAvatarState('listening');
    setAiAvatarState('thinking');
    
    try {
      // Make API call to OpenAI
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          temperature: aiTemperature / 100,
          interfaceType: aiInterfaceType,
          guidanceTypes: guidanceTypes
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI assistant');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => 
        [...prev, { role: 'assistant', content: data.message }]
      );
      
      // Update avatar state to speaking
      setAiAvatarState('speaking');
      
      // After a delay, set back to neutral
      setTimeout(() => {
        setAiAvatarState('neutral');
        setHumanAvatarState('neutral');
      }, 3000);
      
    } catch (error) {
      console.error('Error in AI assistant:', error);
      
      // Add error message to chat
      setMessages(prev => 
        [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]
      );
      
      // Set error state for AI avatar
      setAiAvatarState('error');
      setTimeout(() => setAiAvatarState('neutral'), 3000);
    }
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 mr-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          </div>
          <span className="text-white text-xl font-bold">Therapist's Friend</span>
        </Link>
      </div>
      
      <nav className="mt-5 px-2 space-y-1 flex-grow overflow-y-auto">
        {navigation.map((item) => {
          // Check if the current path matches the navigation item
          const isActive = router.pathname === item.href;
          
          return (
            <Link 
              href={item.href} 
              key={item.name}
              className={`
                group flex items-center px-2 py-2 text-base font-medium rounded-md
                ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <span className="mr-4">{getIcon(item.icon, isActive)}</span>
              {item.name}
              {item.badge && (
                <span className="ml-auto text-xs bg-green-700 text-white px-1 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
        
        {/* AI Assistant Toggle Button - Now part of the navigation */}
        <button 
          onClick={toggleAiAssistantExpanded}
          className="flex items-center justify-between w-full px-2 py-2 text-base font-medium rounded-md text-blue-400 hover:bg-gray-700"
        >
          <div className="flex items-center">
            <span className="mr-4">{getIcon('ai', false)}</span>
            <span className="whitespace-nowrap">AI Assistant</span>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 transition-transform ${aiAssistantExpanded ? 'transform rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* AI Assistant Component - Conditional rendering within navigation */}
        {aiAssistantExpanded && (
          <div className="mt-2 ml-4 mr-2 bg-gray-800 rounded-lg p-3">
            <div className="text-center mb-2 text-sm font-medium text-gray-300">
              <span className="whitespace-nowrap">AI Assistant</span>
            </div>
            
            {/* Interface Mode Toggle Icons */}
            <div className="flex justify-center space-x-3 mb-3">
              {/* Text Mode Icon */}
              <button 
                onClick={() => setAiInterfaceType('Text Interface')}
                className={`p-2 rounded-full ${aiInterfaceType === 'Text Interface' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Text Interface"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
              
              {/* Speech Mode Icon */}
              <button 
                onClick={() => setAiInterfaceType('Voice Interface')}
                className={`p-2 rounded-full ${aiInterfaceType === 'Voice Interface' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Voice Interface"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              {/* Avatar Mode Icon */}
              <button 
                onClick={() => setAiInterfaceType('Avatar Interface')}
                className={`p-2 rounded-full ${aiInterfaceType === 'Avatar Interface' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Avatar Interface"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {/* Hybrid Mode Icon */}
              <button 
                onClick={() => setAiInterfaceType('Hybrid Interface')}
                className={`p-2 rounded-full ${aiInterfaceType === 'Hybrid Interface' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Hybrid Interface"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </button>
            </div>
            
            {/* Current Interface Mode Label */}
            <div className="text-center text-xs text-gray-400 mb-3">
              {aiInterfaceType === 'Text Interface' && "Text mode: Type to chat"}
              {aiInterfaceType === 'Voice Interface' && "Voice mode: Speak to chat"}
              {aiInterfaceType === 'Avatar Interface' && "Avatar mode: Visual interaction"}
              {aiInterfaceType === 'Hybrid Interface' && "Hybrid mode: All features enabled"}
            </div>
            
            {/* Avatar Display Area */}
            {(aiInterfaceType === 'Avatar Interface' || aiInterfaceType === 'Hybrid Interface') && (
              <div className="flex justify-around items-center mb-3 mt-1 bg-gray-700 p-2 rounded-md">
                {/* Human Avatar */}
                <div className="text-center">
                  <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="text-2xl" title="You">{humanAvatarStates[humanAvatarState]}</span>
                  </div>
                  <span className="text-xs text-gray-400">You</span>
                </div>
                
                {/* Dialogue Indicator */}
                <div className="flex-1 px-2 flex justify-center">
                  <svg className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 12L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                {/* AI Avatar */}
                <div className="text-center">
                  <div className="bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="text-2xl" title="AI Assistant">{aiAvatarStates[aiAvatarState]}</span>
                  </div>
                  <span className="text-xs text-gray-400">AI</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-center px-3 py-2 bg-gray-700 rounded-md">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-300 placeholder-gray-500"
                placeholder={listening ? "Listening..." : "Type your message..."}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={listening}
              />
              
              {/* Show microphone button for voice interface */}
              {(aiInterfaceType === 'Voice Interface' || aiInterfaceType === 'Hybrid Interface') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleListening();
                  }}
                  className={`p-1 mr-1 rounded-full ${listening ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                  title={listening ? "Stop listening" : "Start listening"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-white" 
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
              )}
              
              {/* Send button */}
              <button 
                type="submit"
                className="p-1 rounded-full hover:bg-gray-600 focus:outline-none" 
                aria-label="Send message"
                disabled={listening || (!message.trim() && !listening)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
            {/* Display conversation area */}
            <div className="mt-3 max-h-40 overflow-y-auto bg-gray-700 rounded-md p-2">
              {messages.length === 0 ? (
                <div className="text-xs text-gray-400">
                  Assistant is ready to help. Type a message to begin.
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`text-xs ${msg.role === 'user' ? 'text-blue-300 text-right' : 'text-gray-300'}`}
                    >
                      <span className={`inline-block px-2 py-1 rounded-md ${msg.role === 'user' ? 'bg-blue-800' : 'bg-gray-800'}`}>
                        {msg.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

function getIcon(name, isActive) {
  const className = `h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`;
  
  switch (name) {
    case 'home':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'task':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'user':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'diagnosis':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'billing':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'ai':
      return (
        <svg className={`h-6 w-6 ${isActive ? 'text-white' : 'text-blue-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    default:
      return null;
  }
} 