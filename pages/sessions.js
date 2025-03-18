import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';
import Head from 'next/head';
import AIAssistant from '../components/AIAssistant';
import { format } from 'date-fns';

function Sessions() {
  const { user } = useAuth();
  
  // Session data state
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  
  // Video call states
  const [inCall, setInCall] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [micDisabled, setMicDisabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [aiAssistant, setAiAssistant] = useState(false);
  const [transcription, setTranscription] = useState(false);
  const [summarizeNotes, setSummarizeNotes] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  
  // AI Assistant settings
  const [aiInterfaceType, setAiInterfaceType] = useState('Text Interface');
  const [aiVoiceSettings, setAiVoiceSettings] = useState({ voice: 'System Default', rate: 50 });
  const [aiTemperature, setAiTemperature] = useState(30);
  
  // References for video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Load AI settings from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInterfaceType = localStorage.getItem('aiInterfaceType');
      const savedVoiceSettings = localStorage.getItem('aiVoiceSettings');
      const savedTemperature = localStorage.getItem('aiTemperature');
      
      if (savedInterfaceType) setAiInterfaceType(savedInterfaceType);
      if (savedVoiceSettings) setAiVoiceSettings(JSON.parse(savedVoiceSettings));
      if (savedTemperature) setAiTemperature(parseInt(savedTemperature));
    }
  }, []);
  
  // Handle starting a video call
  const startCall = async () => {
    if (!selectedSession) {
      alert('Please select a session before starting');
      return;
    }
    
    try {
      // For now, we'll just simulate by showing the local video
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // In a real implementation, we'd use WebRTC to connect to the client
      // For demo purposes, let's create a mock remote video
      if (remoteVideoRef.current) {
        // In a real implementation, this would be the client's stream
        // For demo, we'll just use a clone of the local stream
        remoteVideoRef.current.srcObject = stream.clone();
      }
      
      setInCall(true);
      
      // Start timer
      const interval = setInterval(() => {
        setCallTime(prevTime => prevTime + 1);
      }, 1000);
      
      setTimerInterval(interval);
    } catch (err) {
      console.error('Error starting video call:', err);
      alert('Could not access camera or microphone. Please check permissions.');
    }
  };
  
  const endCall = () => {
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Reset call time
    setCallTime(0);
    
    // Stop local video/audio tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    // Stop remote video/audio tracks
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset call state
    setInCall(false);
    setMicDisabled(false);
    setVideoDisabled(false);
    setRecording(false);
    setTranscription(false);
    setSummarizeNotes(false);
  };
  
  // Format timer to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle microphone
  const toggleMic = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = micDisabled;
        setMicDisabled(!micDisabled);
      }
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = videoDisabled;
        setVideoDisabled(!videoDisabled);
      }
    }
  };
  
  // Toggle recording (simulated)
  const toggleRecording = () => {
    // In a real implementation, this would start/stop recording
    setRecording(!recording);
  };
  
  // Toggle AI Assistant
  const toggleAiAssistant = () => {
    setAiAssistant(!aiAssistant);
  };
  
  // Toggle transcription
  const toggleTranscription = () => {
    setTranscription(!transcription);
  };
  
  // Toggle summarize notes
  const toggleSummarizeNotes = () => {
    setSummarizeNotes(!summarizeNotes);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [timerInterval]);
  
  // Fetch sessions data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        console.log('Fetching sessions data...');
        
        // Fetch sessions from our API endpoint with cache-busting
        const timestamp = Date.now();
        const response = await fetch(`/api/sessions?t=${timestamp}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized. Please log in again.');
          } else {
            throw new Error(`API responded with status ${response.status}`);
          }
        }
        
        const data = await response.json();
        setSessions(data);
        
        // Filter today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const sessionsToday = data.filter(session => {
          const sessionDate = new Date(session.start_time);
          return sessionDate >= today && sessionDate < tomorrow;
        });
        
        setTodaySessions(sessionsToday);
        
        // Set the first session as selected if any exist today
        if (sessionsToday.length > 0) {
          setSelectedSession(sessionsToday[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching sessions:', err);
        
        // If there's an error, try to load demo data
        try {
          const demoResponse = await fetch(`/api/sessions?demo=true&t=${Date.now()}`);
          if (demoResponse.ok) {
            const demoData = await demoResponse.json();
            setSessions(demoData);
            
            // Filter today's sessions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const sessionsToday = demoData.filter(session => {
              const sessionDate = new Date(session.start_time);
              return sessionDate >= today && sessionDate < tomorrow;
            });
            
            setTodaySessions(sessionsToday);
            
            // Set the first session as selected if any exist today
            if (sessionsToday.length > 0) {
              setSelectedSession(sessionsToday[0]);
            }
          }
        } catch (demoErr) {
          console.error('Error fetching demo sessions:', demoErr);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchData();
  }, []);
  
  // Format session date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Format time (e.g., 9:00 AM)
  const formatTimeOnly = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a');
  };
  
  // Get status color based on session status
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in-progress':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Sessions | Therapist's Friend</title>
        <meta name="description" content="Manage your therapy sessions" />
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Video Sessions</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Session Selection Dropdown */}
          <div className="bg-gray-800 rounded-lg p-6 shadow">
            <div className="mb-4">
              <label htmlFor="session-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select Today's Session
              </label>
              <div className="flex space-x-3">
                <select
                  id="session-select"
                  className="bg-gray-700 text-white rounded-md border-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2"
                  value={selectedSession ? selectedSession.id : ''}
                  onChange={(e) => {
                    const sessionId = e.target.value;
                    const selected = todaySessions.find(s => s.id === parseInt(sessionId));
                    setSelectedSession(selected);
                  }}
                  disabled={loading || inCall}
                >
                  <option value="" disabled>
                    {loading ? 'Loading sessions...' : todaySessions.length === 0 ? 'No sessions today' : 'Select a session'}
                  </option>
                  {todaySessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatTimeOnly(session.start_time)} - {session.client_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={!inCall ? startCall : endCall}
                  disabled={!selectedSession && !inCall}
                  className={`px-4 py-2 rounded-md font-medium focus:outline-none ${
                    inCall
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } ${(!selectedSession && !inCall) && 'opacity-50 cursor-not-allowed'}`}
                >
                  {inCall ? 'End Session' : 'Start Session'}
                </button>
              </div>
              {selectedSession && (
                <div className="mt-2 text-sm text-gray-400">
                  Client: {selectedSession.client_name} | 
                  Time: {formatDate(selectedSession.start_time)} | 
                  <span className={`inline-block rounded-full h-2 w-2 ml-1 mr-1 ${getStatusColor(selectedSession.status)}`}></span>
                  Status: {selectedSession.status}
                </div>
              )}
            </div>
          </div>
          
          {/* Video Call Interface */}
          <div className="bg-gray-800 rounded-lg p-6 shadow">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Video Session</h2>
              {inCall && (
                <div className="text-gray-400 text-sm mt-1">
                  Call time: {formatTime(callTime)}
                </div>
              )}
            </div>
            
            {/* Call controls */}
            <div className="mb-4 flex flex-wrap space-x-3">
              <button
                onClick={toggleMic}
                disabled={!inCall}
                className={`p-3 rounded-full ${micDisabled ? 'bg-red-600' : 'bg-gray-700'} ${!inCall && 'opacity-50 cursor-not-allowed'}`}
                title={micDisabled ? "Unmute" : "Mute"}
              >
                {micDisabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              <button
                onClick={toggleVideo}
                disabled={!inCall}
                className={`p-3 rounded-full ${videoDisabled ? 'bg-red-600' : 'bg-gray-700'} ${!inCall && 'opacity-50 cursor-not-allowed'}`}
                title={videoDisabled ? "Enable video" : "Disable video"}
              >
                {videoDisabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <button
                onClick={toggleRecording}
                disabled={!inCall}
                className={`p-3 rounded-full ${recording ? 'bg-red-600 animate-pulse' : 'bg-gray-700'} ${!inCall && 'opacity-50 cursor-not-allowed'}`}
                title={recording ? "Stop recording" : "Start recording"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                onClick={toggleAiAssistant}
                disabled={!inCall}
                className={`p-3 rounded-full ${aiAssistant ? 'bg-blue-600' : 'bg-gray-700'} ${!inCall && 'opacity-50 cursor-not-allowed'}`}
                title={aiAssistant ? "Disable AI Assistant" : "Enable AI Assistant"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </button>
              <button
                onClick={toggleTranscription}
                disabled={!inCall}
                className={`p-3 rounded-full ${transcription ? 'bg-blue-600' : 'bg-gray-700'} ${!inCall && 'opacity-50 cursor-not-allowed'}`}
                title={transcription ? "Disable transcription" : "Enable transcription"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={toggleSummarizeNotes}
                disabled={!inCall}
                className={`p-3 rounded-full ${summarizeNotes ? 'bg-blue-600' : 'bg-gray-700'} ${!inCall && 'opacity-50 cursor-not-allowed'}`}
                title={summarizeNotes ? "Disable note summarization" : "Enable note summarization"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </div>
            
            {!inCall ? (
              <div className="bg-gray-700 rounded-lg p-8 text-center text-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="mt-4">Please select a session from the dropdown and click "Start Session" to begin a video call</p>
              </div>
            ) : (
              <div>
                {/* Video area */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Remote video (client) */}
                  <div className="w-full lg:w-1/2">
                    <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white">
                        Client: {selectedSession?.client_name || 'Client'}
                      </div>
                      {/* Show status indicator if client video is disabled */}
                      {videoDisabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                          <div className="text-white text-lg font-medium">Client video disabled</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Local video (therapist) */}
                  <div className="w-full lg:w-1/2">
                    <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover mirror-video"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white">
                        You (Therapist)
                      </div>
                      {/* Show status indicator if local video is disabled */}
                      {videoDisabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                          <div className="text-white text-lg font-medium">Your video is disabled</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* AI Assistant (if enabled) */}
                {aiAssistant && (
                  <div className="mt-6">
                    <AIAssistant
                      interfaceType={aiInterfaceType}
                      voiceSettings={aiVoiceSettings}
                      temperature={aiTemperature}
                    />
                  </div>
                )}
                
                {/* Transcription (if enabled) */}
                {transcription && (
                  <div className="mt-6 bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2">Live Transcription</h3>
                    <div className="h-48 overflow-y-auto text-gray-300 text-sm p-3 bg-gray-800 rounded">
                      <p className="text-gray-400 italic">Transcription will appear here...</p>
                    </div>
                  </div>
                )}
                
                {/* Notes (if enabled) */}
                {summarizeNotes && (
                  <div className="mt-6 bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2">Session Notes</h3>
                    <div className="h-48 overflow-y-auto text-gray-300 text-sm p-3 bg-gray-800 rounded">
                      <p className="text-gray-400 italic">AI-generated notes will appear here...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .mirror-video {
          transform: scaleX(-1);
        }
      `}</style>
    </Layout>
  );
}

export default withAuth(Sessions); 