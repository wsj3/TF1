import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import AIAssistant from './AIAssistant';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faMicrophone, faMicrophoneSlash, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../utils/auth';
import { sanitizeMessage } from '../utils/hipaaUtils';
import EnhancedAIAssistant from './EnhancedAIAssistant';
import Script from 'next/script';

// ElevenLabs configuration
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

// Default navigation items
const defaultNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'home' },
  { name: 'Tasks', href: '/tasks', icon: 'task' },
  { name: 'Clients', href: '/clients', icon: 'user' },
  { name: 'Appointments', href: '/appointments', icon: 'calendar' },
  { name: 'Sessions', href: '/sessions', icon: 'chat' },
  { name: 'Treatment Plans', href: '/treatment-plans', icon: 'treatment' },
  { name: 'Diagnoses', href: '/diagnoses', icon: 'diagnosis' },
  { name: 'Billing', href: '/billing', icon: 'billing' },
  { name: 'Settings', href: '/settings', icon: 'settings' }
];

export default function Sidebar({ modules = defaultNavigation, selectedModuleIndex = 0, onModuleChange = () => {}, onLogout = () => {} }) {
  const router = useRouter();
  const { user } = useAuth(); // Get user directly from auth context
  
  // Define navigation with admin check
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home' },
    { name: 'Tasks', href: '/tasks', icon: 'task' },
    { name: 'Clients', href: '/clients', icon: 'user' },
    { name: 'Appointments', href: '/appointments', icon: 'calendar' },
    { name: 'Sessions', href: '/sessions', icon: 'chat' },
    { name: 'Treatment Plans', href: '/treatment-plans', icon: 'treatment' },
    { name: 'Diagnoses', href: '/diagnoses', icon: 'diagnosis' },
    { name: 'Billing', href: '/billing', icon: 'billing' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];

  // Add admin link if user is admin
  useEffect(() => {
    if (user?.isAdmin) {
      console.log('User is admin, adding admin console link');
    }
  }, [user]);

  // Get the final navigation items
  const getNavigationItems = () => {
    if (user?.isAdmin) {
      return [...navigation, { name: 'Admin Console', href: '/admin', icon: 'settings' }];
    }
    return navigation;
  };

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
  const aiAssistantRef = useRef(null);
  const [guidanceTypes, setGuidanceTypes] = useState({
    mentor: true,
    scientist: false,
    friend: false,
    assistant: true,
    peer: false
  });
  const [isAiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [error, setError] = useState(null);
  
  // New state for ElevenLabs integration
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const audioRef = useRef(new Audio());
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  
  // Add new state for ElevenLabs avatar
  const [avatarStream, setAvatarStream] = useState(null);
  const avatarVideoRef = useRef(null);
  
  // Add state for default voice ID
  const [defaultVoiceId, setDefaultVoiceId] = useState(null);
  
  // Save messages to localStorage
  const saveMessagesToLocalStorage = (messages) => {
    if (typeof window !== 'undefined') {
      try {
        // Make sure messages are in the right format before saving
        const formattedMessages = messages.map(msg => {
          // If old format (sender/text), convert to new format (role/content)
          if (msg.sender && msg.text) {
            return {
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: sanitizeMessage(msg.text)
            };
          }
          // If already in new format, just sanitize the content
          return {
            role: msg.role || 'assistant',
            content: sanitizeMessage(msg.content || '')
          };
        });
        
        localStorage.setItem('aiConversationHistory', JSON.stringify(formattedMessages));
        console.log(`Saved ${formattedMessages.length} messages to localStorage in standardized format`);
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  };
  
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
  
  // Load AI settings and conversation history from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInterfaceType = localStorage.getItem('aiInterfaceType');
      const savedVoiceSettings = localStorage.getItem('aiVoiceSettings');
      const savedTemperature = localStorage.getItem('aiTemperature');
      const savedGuidanceTypes = localStorage.getItem('guidanceTypes');
      const savedMessages = localStorage.getItem('aiConversationHistory');
      const storedVisible = localStorage.getItem('ai-assistant-visible');
      const storedExpanded = localStorage.getItem('ai-assistant-expanded');
      
      if (savedInterfaceType) setAiInterfaceType(savedInterfaceType);
      if (savedVoiceSettings) setAiVoiceSettings(JSON.parse(savedVoiceSettings));
      if (savedTemperature) setAiTemperature(parseInt(savedTemperature));
      if (savedGuidanceTypes) setGuidanceTypes(JSON.parse(savedGuidanceTypes));
      
      // Sanitize saved messages when loading from localStorage
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Apply sanitization to each message and standardize format
          const sanitizedMessages = parsedMessages.map(msg => {
            // Convert from old format (sender/text) to new format (role/content) if needed
            if (msg.sender && msg.text) {
              return {
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: sanitizeMessage(msg.text)
              };
            }
            
            // If already in new format, just sanitize the content
            return {
              role: msg.role || 'assistant',
              content: sanitizeMessage(msg.content || '')
            };
          });
          
          setMessages(sanitizedMessages);
          console.log(`Loaded and converted ${sanitizedMessages.length} messages from localStorage`);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          // If there's an error, clear the saved messages
          localStorage.removeItem('aiConversationHistory');
          setMessages([]);
        }
      }
      
      if (storedVisible !== null) {
        setAiAssistantVisible(storedVisible === 'true');
      }
      if (storedExpanded !== null) {
        setAiAssistantExpanded(storedExpanded === 'true');
      }
    }
  }, []);
  
  // Save AI settings and conversation history to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiInterfaceType', aiInterfaceType);
      localStorage.setItem('aiVoiceSettings', JSON.stringify(aiVoiceSettings));
      localStorage.setItem('aiTemperature', aiTemperature.toString());
      localStorage.setItem('guidanceTypes', JSON.stringify(guidanceTypes));
      localStorage.setItem('aiAssistantExpanded', aiAssistantExpanded.toString());
    }
  }, [aiInterfaceType, aiVoiceSettings, aiTemperature, guidanceTypes, aiAssistantExpanded]);
  
  // Save conversation history to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('aiConversationHistory', JSON.stringify(messages));
    }
  }, [messages]);
  
  // Modified function to handle user interaction
  const handleUserInteraction = async () => {
    try {
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key is required');
      }

      // Ensure AI Assistant is disabled
      if (aiAssistantRef.current) {
        aiAssistantRef.current.stopListening();
        aiAssistantRef.current.disableVoiceResponse();
        setAiAssistant(false); // Disable AI Assistant state
      }

      // First, get available voices
      const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });

      if (!voicesResponse.ok) {
        throw new Error(`Failed to fetch voices: ${voicesResponse.status}`);
      }

      const voicesData = await voicesResponse.json();
      const defaultVoice = voicesData.voices[0]?.voice_id;

      if (!defaultVoice) {
        throw new Error('No voices available');
      }

      // Store the default voice ID
      setDefaultVoiceId(defaultVoice);

      // Initialize text-to-speech stream
      const streamResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoice}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: "Hello, I'm your AI assistant. You can start speaking now.",
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }),
      });

      if (!streamResponse.ok) {
        throw new Error(`Failed to initialize stream: ${streamResponse.status}`);
      }

      const audioBlob = await streamResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Start speech recognition before playing audio
      await startListening();
      
      // Play the greeting
      audio.onended = () => {
        console.log('Greeting ended, ready for input');
        // Clean up the audio URL
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      console.log('Audio playback started');

    } catch (error) {
      console.error('Error in handleUserInteraction:', error);
      setError(`Failed to initialize: ${error.message}`);
      setListening(false);
    }
  };

  // Updated startListening function
  const startListening = async () => {
    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setListening(true);
        setError(null);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          // Process the transcript
          processUserInput(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setListening(false);
      };

      recognition.onend = () => {
        // Only restart if we're supposed to be listening
        if (listening) {
          recognition.start();
        }
      };

      recognition.start();
      recognitionRef.current = recognition;

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError(`Failed to start speech recognition: ${error.message}`);
      setListening(false);
    }
  };

  // Modified function to process user input
  const processUserInput = async (transcript) => {
    try {
      console.log('Processing user input:', transcript);
      
      // Add user message to conversation
      const userMessage = { role: 'user', content: transcript };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response using the AI Assistant's logic but not its voice
      let aiResponse;
      if (aiAssistantRef.current) {
        // Use the AI Assistant's processing without voice
        aiResponse = await aiAssistantRef.current.getResponseWithoutVoice(transcript);
      } else {
        aiResponse = `I heard you say: ${transcript}. How can I help you with that?`;
      }

      // Get voice response using ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/stream', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: aiResponse,
          voice_id: defaultVoiceId,
          model_id: 'eleven_monolingual_v1',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);

      // Play the AI response
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('Error processing user input:', error);
      setError(`Failed to process input: ${error.message}`);
    }
  };

  // Modified toggleListening function
  const toggleListening = () => {
    if (listening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setListening(false);
      
      // Also stop the AI Assistant if it's active
      if (aiAssistantRef.current) {
        aiAssistantRef.current.stopListening();
        setAiAssistant(false); // Disable AI Assistant state
      }
    } else {
      // Disable AI Assistant before starting our voice interaction
      if (aiAssistantRef.current) {
        aiAssistantRef.current.stopListening();
        setAiAssistant(false); // Disable AI Assistant state
      }
      // Start the interaction process
      handleUserInteraction();
    }
  };
  
  // Auto-activate microphone when switching to voice modes
  useEffect(() => {
    if (aiAssistantRef.current && 
        (aiInterfaceType === 'Voice Interface' || aiInterfaceType === 'Hybrid Interface') && 
        !listening) {
      // Short delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        if (aiAssistantRef.current) {
          aiAssistantRef.current.startListening();
          setListening(true);
          setHumanAvatarState('speaking');
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (aiAssistantRef.current && 
              aiInterfaceType !== 'Voice Interface' && 
              aiInterfaceType !== 'Hybrid Interface' && 
              listening) {
      // Turn off microphone when switching out of voice modes
      if (aiAssistantRef.current) {
        aiAssistantRef.current.stopListening();
        setListening(false);
        setHumanAvatarState('neutral');
      }
    }
  }, [aiInterfaceType, listening]);
  
  // Get avatar settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHumanAvatarStyle = localStorage.getItem('humanAvatarStyle');
      if (savedHumanAvatarStyle && savedHumanAvatarStyle !== 'Emoji') {
        // If another style is selected, we would load different emoji sets here
      }
    }
  }, []);
  
  // Toggle AI Assistant visibility
  const toggleAiAssistant = () => {
    setAiAssistantVisible(!isAiAssistantVisible);
  };
  
  // Toggle AI Assistant expanded state
  const toggleAiAssistantExpanded = () => {
    const newExpandedState = !aiAssistantExpanded;
    setAiAssistantExpanded(newExpandedState);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-assistant-expanded', String(newExpandedState));
      
      // Dispatch event to notify Layout component
      const event = new CustomEvent('aiAssistantStateChange', {
        detail: {
          enabled: newExpandedState,
          settings: {
            interfaceType: aiInterfaceType,
            voiceSettings: aiVoiceSettings,
            temperature: aiTemperature,
            guidanceTypes: guidanceTypes
          }
        }
      });
      window.dispatchEvent(event);
    }
  };
  
  // Handle module change with AI assistant persistence
  const handleModuleChange = (index) => {
    // Only create a new conversation if specifically changing to a different module
    if (index !== selectedModuleIndex) {
      onModuleChange(index);
    }
  };
  
  // Use a persistent key for the AI Assistant based on user ID
  const persistenceKey = user?.id ? `user-${user.id}` : 'guest-user';
  
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
  
  // Function to display external database links
  const formatExternalLinks = (msg) => {
    // Check if the message has externalLinks property
    if (msg && msg.externalLinks && Array.isArray(msg.externalLinks) && msg.externalLinks.length > 0) {
      return (
        <>
          {safeMsgContent(msg)}
          <div className="mt-1 text-xs">
            <div className="text-gray-400">External References:</div>
            <ul className="list-disc pl-4 text-blue-300">
              {msg.externalLinks.map((link, i) => (
                <li key={i}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline"
                  >
                    {link.title || link.source}
                  </a>
                  {link.description && <span className="text-gray-400 ml-1">- {link.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        </>
      );
    }
    
    // If no external links, just return the message content
    return safeMsgContent(msg);
  };
  
  // Initialize ElevenLabs avatar stream
  const initializeAvatarStream = async () => {
    try {
      console.log('Initializing avatar with API key:', !!ELEVENLABS_API_KEY);

      // Validate configuration
      if (!ELEVENLABS_API_KEY) {
        throw new Error('Missing ElevenLabs API key. Please check your environment variables.');
      }

      // First, get available voices
      const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });

      if (!voicesResponse.ok) {
        throw new Error(`Failed to fetch voices: ${voicesResponse.status}`);
      }

      const voicesData = await voicesResponse.json();
      const defaultVoice = voicesData.voices[0]?.voice_id;

      if (!defaultVoice) {
        throw new Error('No voices available');
      }

      // Store the voice ID for later use
      setDefaultVoiceId(defaultVoice);

      // Set up video element with a placeholder
      if (avatarVideoRef.current) {
        avatarVideoRef.current.srcObject = new MediaStream();
        console.log('Video element initialized');
      } else {
        console.error('Video element reference not found');
      }

      // Show initialization success message
      setError(null);
      console.log('Avatar initialized successfully. Click the microphone button to start interaction.');

    } catch (error) {
      console.error('Avatar initialization error:', error);
      setError(`Failed to initialize AI avatar: ${error.message}`);
    }
  };

  // Clean up avatar stream
  useEffect(() => {
    return () => {
      if (avatarStream) {
        avatarStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [avatarStream]);

  // Handle playing audio queue
  useEffect(() => {
    if (audioQueue.length > 0 && !isPlaying) {
      const playNext = async () => {
        setIsPlaying(true);
        setAvatarSpeaking(true);
        
        const currentAudio = audioQueue[0];
        audioRef.current.src = currentAudio;
        
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Error playing audio:', error);
          setError('Failed to play audio');
        }
      };

      playNext();
    }
  }, [audioQueue, isPlaying]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      setIsPlaying(false);
      setAvatarSpeaking(false);
      setAudioQueue(prev => prev.slice(1));
      URL.revokeObjectURL(audio.src);
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  // Modified handleSendMessage to include voice response
  const handleSendMessage = async (message) => {
    try {
      // Add user message to the conversation
      const newMessages = [...messages, { role: 'user', content: message }];
      setMessages(newMessages);
      saveMessagesToLocalStorage(newMessages);

      // Get AI response
      const response = await aiAssistantRef.current?.sendMessage(message);
      if (response) {
        // Add AI response to the conversation
        const updatedMessages = [...newMessages, { role: 'assistant', content: response }];
        setMessages(updatedMessages);
        saveMessagesToLocalStorage(updatedMessages);

        // Convert AI response to speech
        const audioUrl = await textToSpeech(response);
        if (audioUrl) {
          setAudioQueue(prev => [...prev, audioUrl]);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      handleAIError(error);
    }
  };

  // Handle AI errors
  const handleAIError = (error) => {
    console.error('AI Assistant error:', error);
    setError(error.message || 'An error occurred with the AI Assistant');
    setListening(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (aiAssistantRef.current) {
        aiAssistantRef.current.stopListening();
      }
    };
  }, []);

  const isActive = (path) => {
    return router.pathname === path;
  };

  // Modified renderAIAvatar function
  const renderAIAvatar = () => {
    return (
      <div className="fixed bottom-0 left-0 w-64 bg-gray-900 p-4 rounded-tr-lg shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          {/* ElevenLabs Avatar Video */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-800">
            <video
              ref={avatarVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted={false}
            />
            {!avatarStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse text-gray-400 mb-2">
                    {error ? 'Click microphone to start' : 'Loading Avatar...'}
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm px-4">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between w-full">
            <span className="text-white text-sm font-medium">AI Assistant</span>
            <button
              onClick={() => {
                handleUserInteraction();
                toggleListening();
              }}
              className={`p-2 rounded-full ${listening ? 'bg-red-600' : 'bg-blue-600'} text-white`}
              title={listening ? 'Stop Listening' : 'Start Listening'}
            >
              <FontAwesomeIcon icon={listening ? faMicrophoneSlash : faMicrophone} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Initialize avatar when component mounts
  useEffect(() => {
    initializeAvatarStream();
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 w-64 fixed left-0 top-0">
      {/* Main sidebar content */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-xl font-semibold text-white">Therapist's Friend</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {modules.map((module, index) => (
              <button
                key={module.name}
                onClick={() => onModuleChange(index)}
                className={`${
                  selectedModuleIndex === index
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
              >
                {getIcon(module.icon, selectedModuleIndex === index)}
                <span className="ml-3">{module.name}</span>
              </button>
            ))}

            {/* ElevenLabs Widget */}
            <div className="mt-2">
              <style jsx global>{`
                elevenlabs-convai {
                  --background-color: #111827;
                  --text-color: #000000;
                  --button-color: #000000;
                  --button-text-color: #ffffff;
                  --border-color: #e1e1e1;
                  --focus-outline-color: #000000;
                  --card-radius: 20px;
                  --button-radius: 32px;
                  --avatar-first-color: #EDB035;
                  --avatar-second-color: #F5CAB8;
                  position: relative !important;
                  right: auto !important;
                  bottom: auto !important;
                  width: 100% !important;
                }
              `}</style>
              <elevenlabs-convai agent-id="JpEws8YUu0EDKkpvZPOt"></elevenlabs-convai>
              <Script src="https://elevenlabs.io/convai-widget/index.js" strategy="lazyOnload" />
            </div>
          </nav>
        </div>
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
        >
          <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

// Icon rendering function
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
    case 'treatment':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
    default:
      return null;
  }
} 