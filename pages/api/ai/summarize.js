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

    if (req.method === 'POST') {
      const { clientId, sessionType, messages } = req.body;

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(req.body))) {
        return res.status(400).json({ 
          message: 'Request contains potentially sensitive information' 
        });
      }

      // Get clinical context
      const clinicalContext = await prisma.clinicalContext.findUnique({
        where: {
          clientId
        }
      });

      // Prepare context for summarization
      const context = {
        clinicalContext,
        sessionType,
        messageCount: messages.length,
        timeSpan: messages.length > 0 ? 
          new Date(messages[messages.length - 1].createdAt) - new Date(messages[0].createdAt) : 
          0
      };

      // Generate summary using AI
      // This would be replaced with actual AI call
      const summary = {
        keyPoints: [
          'Main discussion topics',
          'Important decisions made',
          'Next steps agreed upon'
        ],
        clinicalInsights: [
          'Progress observations',
          'Treatment adjustments',
          'Risk factors identified'
        ],
        actionItems: [
          'Tasks assigned',
          'Follow-up appointments',
          'Documentation needed'
        ],
        context: context
      };

      // Save summary to database
      const savedSummary = await prisma.conversationSummary.create({
        data: {
          clientId,
          sessionType,
          summary: summary,
          createdAt: new Date()
        }
      });

      return res.status(201).json({
        summary: savedSummary
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 