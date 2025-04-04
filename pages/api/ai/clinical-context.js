import { verifySessionToken } from '../../../utils/security';
import { hasPermission } from '../../../utils/security';
import { validateHIPAACompliance } from '../../../utils/hipaaUtils';
import { prisma } from '../../../lib/prisma';

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
      const { clientId } = req.query;

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(req.query))) {
        return res.status(400).json({ 
          message: 'Query contains potentially sensitive information' 
        });
      }

      // Fetch clinical context
      const clinicalContext = await prisma.clinicalContext.findUnique({
        where: {
          clientId
        }
      });

      return res.status(200).json({
        clinicalContext
      });
    }

    if (req.method === 'POST') {
      const { clientId, context } = req.body;

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(req.body))) {
        return res.status(400).json({ 
          message: 'Request contains potentially sensitive information' 
        });
      }

      // Create or update clinical context
      const clinicalContext = await prisma.clinicalContext.upsert({
        where: {
          clientId
        },
        update: {
          diagnosis: context.diagnosis,
          severity: context.severity,
          duration: context.duration,
          previousTreatments: context.previousTreatments,
          comorbidities: context.comorbidities
        },
        create: {
          clientId,
          diagnosis: context.diagnosis,
          severity: context.severity,
          duration: context.duration,
          previousTreatments: context.previousTreatments,
          comorbidities: context.comorbidities
        }
      });

      return res.status(201).json({
        clinicalContext
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in clinical context API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 