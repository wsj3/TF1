import { useState, useEffect, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import adapter from 'webrtc-adapter';
import { callAssistantApi } from '../utils/apiHelpers';
import { validateHIPAACompliance } from '../utils/hipaaUtils';

const ffmpeg = createFFmpeg({ log: true });

const VideoSession = ({ 
  clientId, 
  sessionId,
  therapistId,
  onSessionEnd,
  onRecordingComplete
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(false);
  const [sessionNotes, setSessionNotes] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [transcriptionStatus, setTranscriptionStatus] = useState('idle');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const aiAssistantRef = useRef(null);
  
  // Initialize video session
  useEffect(() => {
    initializeVideoSession();
    return () => {
      cleanupSession();
    };
  }, []);
  
  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        await ffmpeg.load();
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
        setError('Failed to initialize video processing');
      }
    };
    loadFFmpeg();
  }, []);
  
  const initializeVideoSession = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsStreaming(true);
      
      // Initialize AI Assistant if enabled
      if (aiAssistantEnabled) {
        initializeAIAssistant();
      }
    } catch (error) {
      console.error('Error initializing video session:', error);
      setError('Failed to initialize video session. Please check your camera and microphone permissions.');
    }
  };
  
  const initializeAIAssistant = async () => {
    try {
      // Initialize AI Assistant with video context
      const response = await callAssistantApi(
        'Initialize video session assistant',
        `video-session-${sessionId}`,
        true,
        `You are an AI assistant participating in a therapy video session. 
         Your role is to:
         1. Monitor the session for key points and insights
         2. Provide real-time suggestions to the therapist
         3. Help identify important moments for note-taking
         4. Assist with session analysis and summary
         
         Maintain HIPAA compliance and professional boundaries at all times.`
      );
      
      if (response.success) {
        aiAssistantRef.current = response.data;
      }
    } catch (error) {
      console.error('Error initializing AI Assistant:', error);
    }
  };
  
  const startRecording = () => {
    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        handleRecordingComplete(blob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      // Start AI Assistant monitoring if enabled
      if (aiAssistantEnabled) {
        startAIMonitoring();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please try again.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Stop AI monitoring
      if (aiAssistantEnabled) {
        stopAIMonitoring();
      }
    }
  };
  
  const startAIMonitoring = async () => {
    try {
      // Start AI monitoring of the session
      const response = await callAssistantApi(
        'Start monitoring video session',
        `video-session-${sessionId}`,
        false,
        'Monitor the session for key points, insights, and important moments.'
      );
      
      if (response.success) {
        // Process AI insights
        processAIInsights(response.data);
      }
    } catch (error) {
      console.error('Error in AI monitoring:', error);
    }
  };
  
  const stopAIMonitoring = async () => {
    try {
      // Stop AI monitoring and generate summary
      const response = await callAssistantApi(
        'End video session monitoring and generate summary',
        `video-session-${sessionId}`,
        false,
        'Generate a comprehensive summary of the session, including key points, insights, and recommendations.'
      );
      
      if (response.success) {
        // Process final AI summary
        processAISummary(response.data);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    }
  };
  
  const processAIInsights = (insights) => {
    // Add AI insights to session notes
    setSessionNotes(prev => [...prev, {
      type: 'ai-insight',
      content: insights,
      timestamp: new Date().toISOString()
    }]);
  };
  
  const processAISummary = (summary) => {
    // Save final AI summary
    setSessionNotes(prev => [...prev, {
      type: 'ai-summary',
      content: summary,
      timestamp: new Date().toISOString()
    }]);
  };
  
  const handleRecordingComplete = async (blob) => {
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', blob, `session-${sessionId}.webm`);
      formData.append('sessionId', sessionId);
      formData.append('clientId', clientId);
      formData.append('therapistId', therapistId);
      
      // Upload recording
      const response = await fetch('/api/sessions/upload-recording', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }
      
      const data = await response.json();
      
      // Notify parent component
      if (onRecordingComplete) {
        onRecordingComplete(data);
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
      setError('Failed to upload recording. Please try again.');
    }
  };
  
  const cleanupSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsStreaming(false);
    setIsRecording(false);
  };
  
  // Enhanced recording processing
  const processRecording = async (blob) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);

      // Convert video for processing
      const inputFileName = 'recording.webm';
      const outputFileName = 'processed.mp4';
      
      ffmpeg.FS('writeFile', inputFileName, await fetchFile(blob));
      
      // Process video with progress tracking
      await ffmpeg.run(
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-progress', 'pipe:1',
        outputFileName
      );

      // Generate thumbnail
      await ffmpeg.run(
        '-i', outputFileName,
        '-ss', '00:00:01',
        '-vframes', '1',
        'thumbnail.jpg'
      );

      // Extract audio for transcription
      await ffmpeg.run(
        '-i', outputFileName,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        'audio.wav'
      );

      // Read processed files
      const processedVideo = ffmpeg.FS('readFile', outputFileName);
      const thumbnail = ffmpeg.FS('readFile', 'thumbnail.jpg');
      const audio = ffmpeg.FS('readFile', 'audio.wav');

      // Clean up files
      ffmpeg.FS('unlink', inputFileName);
      ffmpeg.FS('unlink', outputFileName);
      ffmpeg.FS('unlink', 'thumbnail.jpg');
      ffmpeg.FS('unlink', 'audio.wav');

      // Create file objects
      const processedVideoBlob = new Blob([processedVideo.buffer], { type: 'video/mp4' });
      const thumbnailBlob = new Blob([thumbnail.buffer], { type: 'image/jpeg' });
      const audioBlob = new Blob([audio.buffer], { type: 'audio/wav' });

      // Upload processed files
      await uploadProcessedFiles(processedVideoBlob, thumbnailBlob, audioBlob);

      setIsProcessing(false);
      setProcessingProgress(100);

      // Start transcription
      await startTranscription();

    } catch (error) {
      console.error('Error processing recording:', error);
      setError('Failed to process recording');
      setIsProcessing(false);
    }
  };

  const uploadProcessedFiles = async (videoBlob, thumbnailBlob, audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('video', videoBlob);
      formData.append('thumbnail', thumbnailBlob);
      formData.append('audio', audioBlob);
      formData.append('sessionId', sessionId);
      formData.append('clientId', clientId);
      formData.append('therapistId', therapistId);

      const response = await fetch('/api/sessions/upload-processed', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload processed files');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error uploading processed files:', error);
      throw error;
    }
  };

  const startTranscription = async () => {
    try {
      setTranscriptionStatus('processing');

      const response = await fetch('/api/sessions/start-transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          clientId,
          therapistId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start transcription');
      }

      setTranscriptionStatus('completed');

      // Start AI analysis after transcription
      await startAIAnalysis();

    } catch (error) {
      console.error('Error starting transcription:', error);
      setTranscriptionStatus('error');
      setError('Failed to transcribe session');
    }
  };

  const startAIAnalysis = async () => {
    try {
      // Start comprehensive AI analysis
      const analysisTypes = ['transcription', 'emotional', 'clinical', 'summary'];
      
      for (const type of analysisTypes) {
        const response = await fetch('/api/sessions/analyze-recording', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recordingId: sessionId,
            analysisType: type
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to analyze ${type}`);
        }

        const analysis = await response.json();
        processAIAnalysis(type, analysis);
      }

    } catch (error) {
      console.error('Error in AI analysis:', error);
      setError('Failed to complete AI analysis');
    }
  };

  const processAIAnalysis = (type, analysis) => {
    // Update session notes with analysis results
    setSessionNotes(prev => [...prev, {
      type: `ai-${type}`,
      content: analysis.content,
      timestamp: new Date().toISOString()
    }]);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Video Session</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video Display */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-gray-900"
            />
            {isRecording && (
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded">
                Recording
              </div>
            )}
          </div>
          
          {/* Controls and Notes */}
          <div className="space-y-4">
            {/* Recording Controls */}
            <div className="flex gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-2 rounded-md ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              
              <button
                onClick={() => setAiAssistantEnabled(!aiAssistantEnabled)}
                className={`px-4 py-2 rounded-md ${
                  aiAssistantEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
              >
                {aiAssistantEnabled ? 'AI Assistant Active' : 'Enable AI Assistant'}
              </button>
            </div>
            
            {/* Session Notes */}
            <div className="bg-gray-750 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Session Notes</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessionNotes.map((note, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      note.type === 'ai-insight' 
                        ? 'bg-blue-900/50' 
                        : 'bg-gray-700'
                    }`}
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(note.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-gray-200">{note.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Processing Status */}
      {isProcessing && (
        <div className="p-4 bg-blue-900/50">
          <div className="flex items-center justify-between">
            <span className="text-white">Processing video...</span>
            <span className="text-white">{processingProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Transcription Status */}
      {transcriptionStatus !== 'idle' && (
        <div className="p-4 bg-blue-900/50">
          <div className="flex items-center gap-2">
            <span className="text-white">Transcription:</span>
            <span className={`text-${
              transcriptionStatus === 'completed' ? 'green' : 
              transcriptionStatus === 'error' ? 'red' : 
              'blue'
            }-400`}>
              {transcriptionStatus.charAt(0).toUpperCase() + transcriptionStatus.slice(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/50 text-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoSession; 