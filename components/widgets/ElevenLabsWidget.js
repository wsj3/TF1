import { useEffect, useRef } from 'react';

export default function ElevenLabsWidget() {
  return (
    <div style={{ height: '400px', marginLeft: '-30px', width: 'calc(100% + 30px)' }}>
      <iframe 
        src="/elevenlabs-widget.html" 
        width="100%" 
        height="100%" 
        frameBorder="0"
        title="ElevenLabs AI Assistant"
        style={{ backgroundColor: 'transparent' }}
      />
    </div>
  );
} 