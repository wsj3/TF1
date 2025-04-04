/**
 * AI Assistant API Endpoint
 * 
 * This endpoint handles all interactions with the AI assistant using the agent framework.
 * It processes user messages, handles tool calls, and returns AI responses.
 */

import { getLogger } from '../../utils/logger';
import { AIAgent } from '../../utils/aiFramework/agentFramework';
import { getIronSession } from 'iron-session';
import { ironOptions } from '../../lib/config';

const logger = getLogger('assistant-api');

// Create a singleton agent instance
let agentInstance = null;
const getAgent = () => {
  if (!agentInstance) {
    logger.info('Creating new AIAgent instance');
    agentInstance = new AIAgent();
  }
  return agentInstance;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    logger.warn('Method not allowed:', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Skip authentication for development/demo mode
    const skipAuth = process.env.NODE_ENV === 'development' || 
                     process.env.ALLOW_DEMO_MODE === 'true';
    
    if (!skipAuth) {
      // Authenticate the user with Iron Session
      const session = await getIronSession(req, res, ironOptions);
      
      // Check if user is authenticated
      if (!session.user?.id) {
        logger.warn('Unauthorized attempt to access assistant API');
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized. Please sign in.' 
        });
      }
    } else {
      logger.info('Bypassing authentication for development/demo mode');
    }
    
    logger.info('Assistant API called, getting agent...');
    
    // Get the AI agent
    const agent = getAgent();
    if (!agent) {
      logger.error('Failed to initialize AI agent');
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to initialize AI agent' 
      });
    }
    
    // Extract the messages from the request body
    const { messages, conversationId = 'default', options = {} } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logger.warn('Invalid or empty messages array in request');
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }
    
    logger.debug('Request payload:', { 
      messageCount: messages.length,
      conversationId,
      lastMessagePreview: messages[messages.length - 1]?.content?.substring(0, 50) + '...'
    });
    
    // Process the message with the agent
    logger.info('Processing message with agent...');
    const agentResponse = await agent.processMessage({
      messages,
      conversationId,
      ...options
    });
    
    // Check for a valid response
    if (!agentResponse || !agentResponse.content) {
      logger.error('Empty response from agent');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate a response'
      });
    }
    
    logger.info('Successfully generated response');
    logger.debug('Response preview:', agentResponse.content.substring(0, 100) + '...');
    
    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        content: agentResponse.content,
        toolCalls: agentResponse.toolCalls || [],
        toolResults: agentResponse.toolResults || []
      }
    });
  } catch (error) {
    logger.error('Error in assistant API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
} 