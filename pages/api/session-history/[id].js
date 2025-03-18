/**
 * API endpoint for session conversation history
 * Handles storing and retrieving AI interaction history for sessions
 */

// For production, this would use a database
// For demo purposes, we'll use an in-memory store
const sessionHistories = new Map();

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  // GET request to retrieve conversation history
  if (req.method === 'GET') {
    try {
      // In production, fetch from database
      // For demo, use in-memory store
      const history = sessionHistories.get(id) || [];
      return res.status(200).json(history);
    } catch (error) {
      console.error('Error retrieving session history:', error);
      return res.status(500).json({ error: 'Failed to retrieve session history' });
    }
  }
  
  // POST request to store conversation history
  else if (req.method === 'POST') {
    try {
      const { history } = req.body;
      
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: 'Invalid history data' });
      }
      
      // In production, store in database
      // For demo, use in-memory store
      sessionHistories.set(id, history);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Session history saved successfully' 
      });
    } catch (error) {
      console.error('Error saving session history:', error);
      return res.status(500).json({ error: 'Failed to save session history' });
    }
  }
  
  // DELETE request to clear conversation history
  else if (req.method === 'DELETE') {
    try {
      // In production, delete from database
      // For demo, remove from in-memory store
      sessionHistories.delete(id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Session history deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting session history:', error);
      return res.status(500).json({ error: 'Failed to delete session history' });
    }
  }
  
  // Other methods not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 