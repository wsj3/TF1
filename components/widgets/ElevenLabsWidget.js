import { useState, useEffect, useRef } from 'react';
import { loadScriptWithRetries, canLoadScripts } from '../../utils/script-loader';
import Script from 'next/script';

export default function ElevenLabsWidget() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);
  const isDev = process.env.NODE_ENV === 'development';

  // Handle script loading errors
  const handleScriptError = () => {
    console.error('Failed to load ElevenLabs widget script');
    setHasError(true);
  };

  const handleScriptLoad = () => {
    console.log('ElevenLabs widget script loaded successfully');
    setIsLoaded(true);
  };

  // Initialize the widget
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // In development mode, try to load the script manually with a retry mechanism
    if (isDev) {
      const loadScript = async () => {
        try {
          const script = document.createElement('script');
          script.src = "https://elevenlabs.io/convai-widget/index.js";
          script.async = true;
          
          script.onload = () => {
            console.log('ElevenLabs widget script loaded manually');
            setIsLoaded(true);
          };
          
          script.onerror = () => {
            console.error('Error loading ElevenLabs widget script manually');
            setHasError(true);
          };
          
          document.body.appendChild(script);
        } catch (error) {
          console.error('Failed to load ElevenLabs script:', error);
          setHasError(true);
        }
      };
      
      loadScript();
    }

    // Set a timeout to mark as error if it takes too long to load
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        console.warn('ElevenLabs widget loading timed out');
        setHasError(true);
      }
    }, 10000); // Increased timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoaded, isDev]);

  // Show a better-looking fallback for development mode
  if (isDev) {
    return (
      <div className="p-4 rounded-md border border-gray-700 bg-gray-800">
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-white text-sm">AI Assistant</h3>
            <p className="text-gray-400 text-xs">Development Mode</p>
          </div>
        </div>
        <div className="bg-gray-700 rounded-md p-3 mb-2">
          <p className="text-gray-200 text-sm">Hello! How can I help you with your therapy practice today?</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Type your question here..." 
            className="w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2 text-sm"
            disabled={true}
          />
          <button className="absolute right-2 top-2 text-blue-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-400">Widget simulated in development mode</p>
        </div>
      </div>
    );
  }

  // Show a fallback if the widget fails to load in production
  if (hasError) {
    return (
      <div className="p-3 rounded-md border border-gray-700">
        <div className="text-center">
          <h4 className="text-sm text-white font-medium mb-1">AI Assistant</h4>
          <p className="text-xs text-gray-300 mb-2">Temporarily unavailable</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Production widget embedding
  return (
    <div className="relative p-1 overflow-hidden" style={{ minHeight: "300px" }}>
      <style jsx global>{`
        elevenlabs-convai {
          --background-color: #111827;
          --text-color: #ffffff;
          --button-color: #2563eb;
          --button-text-color: #ffffff;
          --border-color: #374151;
          --focus-outline-color: #3b82f6;
          --card-radius: 8px;
          --button-radius: 6px;
          --avatar-first-color: #3b82f6;
          --avatar-second-color: #93c5fd;
          position: relative !important;
          right: auto !important;
          bottom: auto !important;
          width: 100% !important;
          min-height: 300px !important;
          font-size: 16px !important;
        }
        
        /* Improve text readability in widget */
        elevenlabs-convai .el-text,
        elevenlabs-convai input,
        elevenlabs-convai button {
          color: #ffffff !important;
          font-size: 1rem !important;
        }
        
        elevenlabs-convai .el-message {
          color: #ffffff !important;
          font-weight: 400 !important;
          font-size: 1rem !important;
          line-height: 1.5 !important;
        }
        
        elevenlabs-convai input::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
        }
      `}</style>
      
      <elevenlabs-convai agent-id="JpEws8YUu0EDKkpvZPOt"></elevenlabs-convai>
      
      <Script 
        src="https://elevenlabs.io/convai-widget/index.js" 
        strategy="afterInteractive"
        onError={handleScriptError}
        onLoad={handleScriptLoad}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-80">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1 items-center text-center">
              <div className="h-4 bg-gray-700 rounded mx-auto w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded mx-auto w-1/2"></div>
              <div className="text-base text-white font-medium mt-2">Loading AI Assistant...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 