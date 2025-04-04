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
      const { clientId, sessionType } = req.query;

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(req.query))) {
        return res.status(400).json({ 
          message: 'Query contains potentially sensitive information' 
        });
      }

      // Fetch conversation history with context
      const conversations = await prisma.aIConversation.findMany({
        where: {
          clientId,
          sessionType,
          therapistId: userData.id
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: {
          lastActivity: 'desc'
        }
      });

      return res.status(200).json({
        conversations
      });
    }

    if (req.method === 'POST') {
      const { clientId, sessionType, message, context } = req.body;

      // Validate HIPAA compliance
      if (!validateHIPAACompliance(JSON.stringify(req.body))) {
        return res.status(400).json({ 
          message: 'Request contains potentially sensitive information' 
        });
      }

      // Create or update conversation
      const conversation = await prisma.aIConversation.upsert({
        where: {
          clientId_sessionType: {
            clientId,
            sessionType
          }
        },
        update: {
          lastActivity: new Date()
        },
        create: {
          clientId,
          therapistId: userData.id,
          sessionType,
          lastActivity: new Date()
        }
      });

      // Add message to conversation
      const newMessage = await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message
        }
      });

      // Get AI response with context
      const aiResponse = await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: 'AI response here' // This would be replaced with actual AI response
        }
      });

      return res.status(201).json({
        conversation,
        messages: [newMessage, aiResponse]
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 