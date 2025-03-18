/**
 * API endpoint to start a session
 */
export default async function handler(req, res) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.query;
    const { status, start_time } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing session ID' });
    }
    
    // In a real implementation, we would update the session in the database
    // For demo purposes, we'll just return a successful response
    console.log(`Starting session ${id} with status ${status} at ${start_time}`);
    
    // Update session in database (mocked)
    // const result = await db.sessions.update({ id }, { status, start_time, updated_at: new Date() });
    
    return res.status(200).json({
      success: true,
      message: 'Session started successfully',
      session: {
        id: parseInt(id),
        status,
        start_time
      }
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({ error: 'Failed to start session' });
  }
} 