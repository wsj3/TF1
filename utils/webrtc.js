/**
 * WebRTC utility functions for managing connections and signaling
 */

// Placeholder for real signaling server connection
let signalingServerConnection = null;

// Initialize the signaling server connection
export const connectToSignalingServer = async (sessionId, userId) => {
  try {
    console.log(`Connecting to signaling server for session ${sessionId} as user ${userId}...`);
    
    // In a real implementation, this would connect to a WebSocket or SSE endpoint
    // For demo purposes, we're just creating a mock connection object
    signalingServerConnection = {
      sessionId,
      userId,
      isConnected: true,
      
      // Mock sending message to signaling server
      send: (message) => {
        console.log('Sending to signaling server:', message);
        // In a real implementation, this would send the message over WebSocket
        return Promise.resolve({ success: true });
      },
      
      // Mock close connection
      close: () => {
        console.log('Closing signaling server connection');
        signalingServerConnection.isConnected = false;
        return Promise.resolve();
      }
    };
    
    return signalingServerConnection;
  } catch (error) {
    console.error('Failed to connect to signaling server:', error);
    throw error;
  }
};

// Send a message through the signaling server
export const sendSignalingMessage = async (message) => {
  if (!signalingServerConnection || !signalingServerConnection.isConnected) {
    throw new Error('Not connected to signaling server');
  }
  
  try {
    return await signalingServerConnection.send(message);
  } catch (error) {
    console.error('Error sending message through signaling server:', error);
    throw error;
  }
};

// Close the signaling server connection
export const disconnectFromSignalingServer = async () => {
  if (signalingServerConnection && signalingServerConnection.isConnected) {
    await signalingServerConnection.close();
    signalingServerConnection = null;
  }
};

// Get ICE servers configuration
export const getIceServers = () => {
  // In a production environment, you would fetch these from your server
  // to keep credentials secure and rotate them as needed
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // Add TURN servers in production for reliable connections 
      // These would usually be provided by your backend
      // { 
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
    ]
  };
};

// Create a peer connection with the right configuration
export const createPeerConnection = () => {
  const configuration = getIceServers();
  
  try {
    const peerConnection = new RTCPeerConnection(configuration);
    return peerConnection;
  } catch (error) {
    console.error('Error creating peer connection:', error);
    throw error;
  }
};

// Handle receiving media when the remote peer adds a track
export const attachTrackHandler = (peerConnection, remoteVideoRef) => {
  peerConnection.ontrack = (event) => {
    console.log('Remote track received:', event.streams[0]);
    
    if (remoteVideoRef && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  };
};

// Create and send an offer to the remote peer
export const createAndSendOffer = async (peerConnection, sessionId) => {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    const offerMessage = {
      type: 'offer',
      sessionId,
      offer: peerConnection.localDescription
    };
    
    await sendSignalingMessage(offerMessage);
    return offer;
  } catch (error) {
    console.error('Error creating or sending offer:', error);
    throw error;
  }
};

// Handle an incoming offer from a remote peer
export const handleRemoteOffer = async (peerConnection, offer, sessionId) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    const answerMessage = {
      type: 'answer',
      sessionId,
      answer: peerConnection.localDescription
    };
    
    await sendSignalingMessage(answerMessage);
    return answer;
  } catch (error) {
    console.error('Error handling remote offer:', error);
    throw error;
  }
};

// Handle an incoming answer from a remote peer
export const handleRemoteAnswer = async (peerConnection, answer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error handling remote answer:', error);
    throw error;
  }
};

// Handle an incoming ICE candidate from a remote peer
export const handleRemoteIceCandidate = async (peerConnection, iceCandidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidate));
  } catch (error) {
    console.error('Error handling remote ICE candidate:', error);
    throw error;
  }
};

// Add a handler for ICE candidates generated by the local peer
export const setupIceCandidateHandler = (peerConnection, sessionId) => {
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const message = {
        type: 'ice-candidate',
        sessionId,
        candidate: event.candidate
      };
      
      await sendSignalingMessage(message);
    }
  };
};

// Clean up a peer connection, streams, and signaling
export const cleanupWebRTC = (peerConnection, localStream) => {
  // Close data channels
  peerConnection?.getDataChannels()?.forEach(channel => {
    channel.close();
  });
  
  // Stop all tracks in the local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  // Close the peer connection
  if (peerConnection) {
    peerConnection.close();
  }
  
  // Disconnect from signaling server
  return disconnectFromSignalingServer();
}; 