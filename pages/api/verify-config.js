/**
 * Configuration Verification API Endpoint
 * 
 * This endpoint verifies that the application's configuration is valid,
 * including API keys, database connection, and model availability.
 */

import { verifyApiKey, verifyModelAvailability } from '../../utils/verifyApiKey';
import { logger } from '../../utils/logger';
import prisma from '../../lib/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logger.info('Verifying application configuration');
    
    // Verify OpenAI API key
    const apiKeyResult = await verifyApiKey();
    
    // Verify model availability if the API key is valid
    let modelResult = { available: false, error: 'Skipped due to invalid API key' };
    if (apiKeyResult.valid) {
      modelResult = await verifyModelAvailability();
    }
    
    // Verify database connection
    let dbConnected = false;
    let dbError = null;
    
    try {
      // Simple query to verify database connection
      await prisma.client.count();
      dbConnected = true;
    } catch (error) {
      dbError = error.message;
      logger.error('Database connection verification failed', { error: error.message });
    }
    
    // Check environment variables
    const environmentVars = {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      openAiModel: process.env.OPENAI_MODEL || 'gpt-4o'
    };
    
    // Compile final verification result
    const result = {
      timestamp: new Date().toISOString(),
      environment: environmentVars,
      database: {
        connected: dbConnected,
        error: dbError
      },
      openai: {
        keyValid: apiKeyResult.valid,
        keyError: apiKeyResult.error,
        keySuggestion: apiKeyResult.suggestion,
        modelAvailable: modelResult.available,
        modelError: modelResult.error,
        modelSuggestion: modelResult.suggestion,
        defaultModel: modelResult.model || environmentVars.openAiModel
      },
      overall: {
        ready: apiKeyResult.valid && modelResult.available && dbConnected,
        issues: []
      }
    };
    
    // Identify issues
    if (!apiKeyResult.valid) {
      result.overall.issues.push('Invalid OpenAI API key');
    }
    if (!modelResult.available) {
      result.overall.issues.push('Model unavailable');
    }
    if (!dbConnected) {
      result.overall.issues.push('Database connection error');
    }
    
    // Return the verification result
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Configuration verification error', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      error: 'Configuration verification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 