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

  // Handle when widget might fail to load
  useEffect(() => {
    // Set a timeout to mark as error if it takes too long to load
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        setHasError(true);
      }
    }, 8000);

    return () => {
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

  // Direct embedding of widget for both development and production
  return (
    <div className="relative p-1 bg-gray-800 rounded-md overflow-hidden" style={{ minHeight: "300px" }}>
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
          min-height: 300px !important;
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1 items-center text-center">
              <div className="h-4 bg-gray-700 rounded mx-auto w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded mx-auto w-1/2"></div>
              <div className="text-sm text-gray-400 mt-2">Loading AI Assistant...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 