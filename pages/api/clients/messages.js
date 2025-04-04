import { verifySessionToken } from '../../../utils/security';
import { hasPermission } from '../../../utils/security';
import { validateHIPAACompliance } from '../../../utils/hipaaUtils';

export default async function handler(req, res) {
  // Verify authentication
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const userData = await verifySessionToken(token);
    
    // Check permissions
    if (!hasPermission(userData.role, 'view_own_records')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (req.method === 'GET') {
      // Validate HIPAA compliance of query parameters
      if (!validateHIPAACompliance(JSON.stringify(req.query))) {
        return res.status(400).json({ 
          message: 'Query contains potentially sensitive information' 
        });
      }

      // In a real implementation, this would query a database
      // For now, return mock data
      const mockMessages = [
        {
          id: '1',
          content: 'Your next appointment is scheduled for tomorrow at 2 PM.',
          sender: 'Dr. Smith',
          timestamp: new Date().toISOString(),
          read: true
        },
        {
          id: '2',
          content: 'Please complete the intake forms before your first session.',
          sender: 'System',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: false
        }
      ];

      return res.status(200).json({
        messages: mockMessages
      });
    }

    if (req.method === 'POST') {
      // Validate request body
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(message)) {
        return res.status(400).json({ 
          message: 'Message contains potentially sensitive information' 
        });
      }

      // In a real implementation, this would store the message in a database
      // For now, return success
      return res.status(201).json({
        message: 'Message sent successfully',
        messageId: 'new-message-id'
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in messages API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 