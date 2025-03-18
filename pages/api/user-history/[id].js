/**
 * API endpoint for global user conversation history
 * Handles storing and retrieving AI interaction history that persists across all user interactions
 */

// For production, this would use a database
// For demo purposes, we'll use an in-memory store
const userHistories = new Map();

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  // GET request to retrieve global user history
  if (req.method === 'GET') {
    try {
      // In production, fetch from database
      // For demo, use in-memory store
      const history = userHistories.get(id) || [];
      return res.status(200).json(history);
    } catch (error) {
      console.error('Error retrieving user history:', error);
      return res.status(500).json({ error: 'Failed to retrieve user history' });
    }
  }
  
  // POST request to store global user history
  else if (req.method === 'POST') {
    try {
      const { history } = req.body;
      
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: 'Invalid history data' });
      }
      
      // In production, we might want to limit the size of the history
      // to prevent excessive storage by trimming older entries
      const trimmedHistory = history.length > 500 
        ? history.slice(history.length - 500) // Keep only last 500 messages
        : history;
      
      // In production, store in database
      // For demo, use in-memory store
      userHistories.set(id, trimmedHistory);
      
      return res.status(200).json({ 
        success: true, 
        message: 'User history saved successfully',
        entriesCount: trimmedHistory.length
      });
    } catch (error) {
      console.error('Error saving user history:', error);
      return res.status(500).json({ error: 'Failed to save user history' });
    }
  }
  
  // DELETE request to clear user history
  else if (req.method === 'DELETE') {
    try {
      // In production, delete from database
      // For demo, remove from in-memory store
      userHistories.delete(id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'User history deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting user history:', error);
      return res.status(500).json({ error: 'Failed to delete user history' });
    }
  }
  
  // Other methods not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 