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
      <div style={{ 
        height: '100px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        margin: '10px 0'
      }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Assistant temporarily unavailable
        </p>
      </div>
    );
  }

  // Direct embedding of widget (alternative approach for development)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div 
        ref={containerRef}
        style={{ 
          height: '100px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          margin: '10px 0'
        }}
      >
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          AI Assistant (dev mode)
        </p>
      </div>
    );
  }

  // Production widget with iframe fallback
  return (
    <div style={{ height: '400px', marginLeft: '-30px', width: 'calc(100% + 30px)' }}>
      <iframe 
        ref={iframeRef}
        src="/elevenlabs-widget.html" 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="ElevenLabs AI Assistant"
        style={{ backgroundColor: 'transparent' }}
        loading="lazy"
      />
    </div>
  );
} 