/**
 * API endpoint for WebRTC signaling between peers
 * In a production application, this would likely use WebSockets instead of HTTP
 */

// In-memory store of active sessions and their messages
// In production, you would use Redis or a similar solution
const activeSessions = new Map();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { type, sessionId, userId, data } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Handle different message types
    switch (type) {
      case 'join': {
        // Join a session
        if (!activeSessions.has(sessionId)) {
          activeSessions.set(sessionId, {
            participants: new Set(),
            messages: []
          });
        }
        
        const session = activeSessions.get(sessionId);
        session.participants.add(userId);
        
        // If a second participant joins, notify the first participant
        if (session.participants.size === 2) {
          const participants = Array.from(session.participants);
          const otherParticipant = participants.find(id => id !== userId);
          
          if (otherParticipant) {
            session.messages.push({
              type: 'peer-joined',
              to: otherParticipant,
              from: userId,
              timestamp: Date.now()
            });
          }
        }
        
        return res.status(200).json({
          success: true,
          participantCount: activeSessions.get(sessionId).participants.size
        });
      }
      
      case 'leave': {
        // Leave a session
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId);
          session.participants.delete(userId);
          
          // If the session is now empty, clean it up
          if (session.participants.size === 0) {
            activeSessions.delete(sessionId);
          } else {
            // Notify other participants that this peer has left
            const otherParticipant = Array.from(session.participants)[0];
            session.messages.push({
              type: 'peer-left',
              to: otherParticipant,
              from: userId,
              timestamp: Date.now()
            });
          }
        }
        
        return res.status(200).json({ success: true });
      }
      
      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        // Exchange WebRTC messages between peers
        if (!activeSessions.has(sessionId)) {
          return res.status(404).json({ error: 'Session not found' });
        }
        
        const session = activeSessions.get(sessionId);
        
        // Find the other participant to send this message to
        const otherParticipant = Array.from(session.participants)
          .find(id => id !== userId);
        
        if (!otherParticipant) {
          return res.status(404).json({ error: 'No other participant found' });
        }
        
        // Store the message for the other participant to poll
        session.messages.push({
          type,
          to: otherParticipant,
          from: userId,
          data,
          timestamp: Date.now()
        });
        
        return res.status(200).json({ success: true });
      }
      
      case 'poll': {
        // Poll for messages intended for this participant
        if (!activeSessions.has(sessionId)) {
          return res.status(404).json({ error: 'Session not found' });
        }
        
        const session = activeSessions.get(sessionId);
        
        // Find messages intended for this participant
        const messages = session.messages
          .filter(msg => msg.to === userId);
        
        // Remove the messages we're about to return
        session.messages = session.messages
          .filter(msg => msg.to !== userId);
        
        return res.status(200).json({
          success: true,
          messages
        });
      }
      
      default:
        return res.status(400).json({ error: 'Invalid message type' });
    }
  } catch (error) {
    console.error('Error in signaling API:', error);
    return res.status(500).json({ error: 'Server error' });
  }
} 