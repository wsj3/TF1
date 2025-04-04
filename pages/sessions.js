import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { withPageAuth } from '../utils/auth';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { callApi } from '../utils/apiHelpers';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Import AIAssistant dynamically to prevent client-side issues
const AIAssistant = dynamic(() => import('../components/AIAssistant'), { ssr: false });

function Sessions() {
  // Core state
  const [todaySessions, setTodaySessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Video call state
  const [inCall, setInCall] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [videoDisabled, setVideoDisabled] = useState(false);
  const [micDisabled, setMicDisabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const [aiAssistant, setAiAssistant] = useState(false);
  const [transcription, setTranscription] = useState(false);
  const [summarizeNotes, setSummarizeNotes] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);

  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Fetch appointments for selected date
  const fetchAppointmentsForDate = async (date = selectedDate) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Format the date as ISO string
      const dateParam = date ? 
        new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString() :
        new Date().toISOString();
      
      console.log('Fetching appointments for date:', dateParam);
      
      // Try to get appointments from localStorage first
      let appointments = [];
      try {
        const stored = localStorage.getItem('demoAppointments');
        if (stored) {
          appointments = JSON.parse(stored);
          console.log('Found stored appointments:', appointments);
        }
      } catch (e) {
        console.warn('Error reading from localStorage:', e);
      }
      
      // Then try to fetch from API
      try {
        const response = await fetch('/api/appointments?demo=true', {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from server');
        }
        
        const apiData = await response.json();
        
        if (Array.isArray(apiData)) {
          appointments = apiData;
        }
      } catch (apiError) {
        console.warn('API Error:', apiError);
        // If we have local appointments, we can continue
        // If not, we'll throw the error
        if (appointments.length === 0) {
          throw apiError;
        }
      }
      
      // Filter appointments for today
      const todayStart = new Date(date);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(date);
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayAppointments = appointments.filter(apt => {
        try {
          const aptDate = new Date(apt.date || apt.startTime);
          return aptDate >= todayStart && aptDate <= todayEnd;
        } catch (e) {
          console.warn('Invalid date in appointment:', apt);
          return false;
        }
      });
      
      console.log('Filtered appointments for today:', todayAppointments);
      
      // Sort appointments by time
      todayAppointments.sort((a, b) => {
        const dateA = new Date(a.date || a.startTime);
        const dateB = new Date(b.date || b.startTime);
        return dateA - dateB;
      });
      
      setTodaySessions(todayAppointments);
      
      // Set the first appointment as selected if none is selected
      if (!selectedSession && todayAppointments.length > 0) {
        setSelectedSession(todayAppointments[0].id);
      }
      
      return todayAppointments;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Unable to load appointments. Please try again later.');
      setTodaySessions([]);
      setSelectedSession(null);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch appointments when date changes
  useEffect(() => {
    fetchAppointmentsForDate();
  }, [selectedDate]);

  // Format appointment time for display
  const formatAppointmentTime = (appointment) => {
    try {
      if (!appointment) {
        console.warn('No appointment provided');
        return 'Time not set';
      }

      // Check all possible date fields
      const dateString = appointment.startTime || appointment.date || appointment.time;
      
      if (!dateString) {
        console.warn('No date field found in appointment:', appointment);
        return 'Time not set';
      }

      // Parse the date string
      const date = parseISO(dateString);
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Time not set';
      }
      
      // Format the time in 12-hour format with padding
      return format(date, 'h:mm aa');
      
    } catch (e) {
      console.error('Error formatting time:', e);
      return 'Time not set';
    }
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointmentId) => {
    const appointment = todaySessions.find(a => a.id === appointmentId);
    if (appointment) {
      setSelectedSession(appointment.id);
    }
  };

  // Start video call
  const startCall = async () => {
    if (!selectedSession) {
      alert('Please select an appointment first');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // For demo, use same stream for remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream.clone();
      }
      
      setInCall(true);
      
      // Start timer
      const interval = setInterval(() => {
        setCallTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (err) {
      console.error('Error starting video call:', err);
      alert('Could not access camera or microphone. Please check permissions.');
    }
  };

  // End video call
  const endCall = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    setCallTime(0);
    
    // Stop video tracks
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setInCall(false);
    setVideoDisabled(false);
    setMicDisabled(false);
    setRecording(false);
    setTranscription(false);
    setSummarizeNotes(false);
    setAiAssistant(false);
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle controls
  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = videoDisabled;
        setVideoDisabled(!videoDisabled);
      }
    }
  };

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = micDisabled;
        setMicDisabled(!micDisabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [timerInterval]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Video Sessions</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading appointments...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Video Sessions | Therapist's Friend</title>
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Video Sessions</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Appointment Selection */}
          <div className="bg-gray-800 rounded-lg p-6 shadow">
            <div className="mb-4">
              <label htmlFor="appointment-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select Today's Appointment
              </label>
              <div className="flex space-x-3">
                <select
                  id="appointment-select"
                  className="bg-gray-700 text-white rounded-md border-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-2"
                  value={selectedSession || ''}
                  onChange={(e) => handleAppointmentSelect(e.target.value)}
                  disabled={isLoading || inCall}
                >
                  <option value="" disabled>
                    {isLoading ? 'Loading...' : todaySessions.length === 0 ? 'No appointments today' : 'Select an appointment'}
                  </option>
                  {todaySessions.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.clientName || apt.client?.name || 'Unnamed Client'} - {formatAppointmentTime(apt)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={inCall ? endCall : startCall}
                  disabled={!selectedSession && !inCall}
                  className={`px-4 py-2 rounded-md font-medium focus:outline-none ${
                    inCall ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white ${(!selectedSession && !inCall) && 'opacity-50 cursor-not-allowed'}`}
                >
                  {inCall ? 'End Call' : 'Start Call'}
                </button>
              </div>
              {selectedSession && (
                <div className="mt-2 text-sm text-gray-400">
                  Client: {todaySessions.find(a => a.id === selectedSession)?.clientName || todaySessions.find(a => a.id === selectedSession)?.client?.name || 'Unnamed Client'} | 
                  Time: {formatAppointmentTime(todaySessions.find(a => a.id === selectedSession))}
                </div>
              )}
              {error && (
                <div className="mt-2 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Video Interface */}
          <div className="bg-gray-800 rounded-lg p-6 shadow">
            {inCall ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white">Video Call</h2>
                  <div className="text-gray-400 text-sm mt-1">
                    Duration: {formatTime(callTime)}
                  </div>
                </div>

                {/* Video Controls */}
                <div className="mb-4 flex space-x-3">
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-full ${micDisabled ? 'bg-red-600' : 'bg-gray-700'}`}
                  >
                    <span className="sr-only">{micDisabled ? 'Unmute' : 'Mute'}</span>
                    {/* Mic icon */}
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={micDisabled ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} 
                      />
                    </svg>
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full ${videoDisabled ? 'bg-red-600' : 'bg-gray-700'}`}
                  >
                    <span className="sr-only">{videoDisabled ? 'Enable Video' : 'Disable Video'}</span>
                    {/* Video icon */}
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                      />
                    </svg>
                  </button>
                </div>

                {/* Video Streams */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-sm text-white">
                      {todaySessions.find(a => a.id === selectedSession)?.clientName || 'Client'}
                    </div>
                  </div>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-sm text-white">
                      You
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 text-gray-400">
                  Select an appointment and click "Start Call" to begin a video session
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withPageAuth(Sessions); 