/**
 * API endpoint to end a session
 */
export default async function handler(req, res) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.query;
    const { status, end_time, duration } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing session ID' });
    }
    
    // In a real implementation, we would update the session in the database
    // For demo purposes, we'll just return a successful response
    console.log(`Ending session ${id} with status ${status} at ${end_time}, duration: ${duration} seconds`);
    
    // Update session in database (mocked)
    // const result = await db.sessions.update({ 
    //   id 
    // }, { 
    //   status, 
    //   end_time, 
    //   duration, 
    //   updated_at: new Date() 
    // });
    
    return res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      session: {
        id: parseInt(id),
        status,
        end_time,
        duration
      }
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return res.status(500).json({ error: 'Failed to end session' });
  }
} 