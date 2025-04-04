import { useState, useEffect, useRef } from 'react';
import { loadScriptWithRetries, canLoadScripts } from '../../utils/script-loader';

export default function ElevenLabsWidget() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Load the widget script safely
  useEffect(() => {
    // Skip in server-side rendering
    if (!canLoadScripts()) return;

    let isMounted = true;
    
    const loadWidgetScript = async () => {
      try {
        // Attempt to load the script with retries
        const success = await loadScriptWithRetries('https://elevenlabs.io/convai-widget/index.js', 1, 5000);
        
        if (isMounted) {
          if (success) {
            console.log('ElevenLabs widget script loaded successfully');
            setIsLoaded(true);
          } else {
            console.error('Failed to load ElevenLabs widget after retries');
            setHasError(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading ElevenLabs widget:', error);
          setHasError(true);
        }
      }
    };

    loadWidgetScript();

    return () => {
      isMounted = false;
    };
  }, []);

  // Safely handle iframe loading
  useEffect(() => {
    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      console.error('Failed to load ElevenLabs widget iframe');
      setHasError(true);
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);
    }

    // Set a timeout to mark as error if it takes too long to load
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        setHasError(true);
      }
    }, 5000);

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
      }
      clearTimeout(timeoutId);
    };
  }, [isLoaded]);

  // Show a fallback if the widget fails to load
  if (hasError) {
    return (
      <div className="p-3 bg-gray-800 rounded-md">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-1">AI Assistant</p>
          <p className="text-xs text-gray-500">Temporarily unavailable</p>
        </div>
      </div>
    );
  }

  // Direct embedding of widget (alternative approach for development)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="p-4 bg-gray-800 rounded-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400">Development Mode</p>
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded-md mt-2">
          <p className="text-sm text-gray-300">How can I help you with your therapy practice today?</p>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white rounded-md px-3 py-2 flex-1">Try me in production!</button>
        </div>
      </div>
    );
  }

  // Production widget with iframe fallback
  return (
    <div className="relative mt-2 p-1 bg-gray-800 rounded-md overflow-hidden" style={{ height: "400px" }}>
      <style jsx global>{`
        elevenlabs-convai {
          --background-color: #111827;
          --text-color: #f3f4f6;
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
          height: 100% !important;
        }
      `}</style>
      <elevenlabs-convai agent-id="JpEws8YUu0EDKkpvZPOt"></elevenlabs-convai>
    </div>
  );
} 