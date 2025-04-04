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
    if (!hasPermission(userData.role, 'view_own_appointments')) {
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
      const mockAppointments = [
        {
          id: '1',
          date: new Date().toISOString(),
          time: '10:00 AM',
          status: 'scheduled',
          type: 'Individual Therapy',
          therapist: 'Dr. Smith'
        },
        {
          id: '2',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: '2:00 PM',
          status: 'scheduled',
          type: 'Group Therapy',
          therapist: 'Dr. Johnson'
        }
      ];

      return res.status(200).json({
        appointments: mockAppointments
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in appointments API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 