import GeminiHandler from './geminiHandler';
import { getLogger } from '../logger';

// Create a logger for the factory
const logger = getLogger('handler-factory');

// Cache for handlers to avoid recreating them
const handlersCache = {};

/**
 * Get the appropriate AI API handler based on environment configuration
 * @param {Object} options - Options for creating the handler
 * @returns {Object} - An AI API handler instance
 */
export function getApiHandler(options = {}) {
  // Check if we have a forced provider in options
  const providerName = options.provider || process.env.CHAT_COMPLETION_PROVIDER || 'gemini';
  
  // Check if we already have this handler in cache
  const cacheKey = `${providerName}:${JSON.stringify(options)}`;
  if (handlersCache[cacheKey]) {
    logger.debug(`Using cached handler for provider: ${providerName}`);
    return handlersCache[cacheKey];
  }
  
  logger.info(`Creating new AI handler for provider: ${providerName}`);
  
  try {
    let handler;
    
    // Create the appropriate handler based on provider
    switch (providerName.toLowerCase()) {
      case 'gemini':
        // Create and configure Gemini handler
        try {
          handler = new GeminiHandler({
            apiKey: process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            ...options
          });
        } catch (geminiError) {
          // If Gemini initialization fails, try using OpenAI as fallback
          logger.warn(`Failed to initialize Gemini handler: ${geminiError.message}`);
          logger.info('Attempting to use OpenAI as fallback');
          
          // Check if OpenAI key is available
          if (process.env.OPENAI_API_KEY) {
            // We'll need to dynamically import OpenAI handler
            // This assumes you have an OpenAIHandler class in a file called openaiHandler.js
            const OpenAIHandler = require('./openaiHandler').default;
            handler = new OpenAIHandler({
              apiKey: process.env.OPENAI_API_KEY,
              model: process.env.OPENAI_MODEL || 'gpt-4o',
              ...options
            });
            logger.info('Successfully initialized OpenAI fallback handler');
          } else {
            // No fallback available, rethrow the original error
            throw geminiError;
          }
        }
        break;
      
      case 'openai':
        // Create OpenAI handler
        const OpenAIHandler = require('./openaiHandler').default;
        handler = new OpenAIHandler({
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          ...options
        });
        break;
      
      // Add cases for other providers as needed
      
      default:
        // Default to Gemini if provider is not recognized
        logger.warn(`Unknown provider "${providerName}", defaulting to Gemini`);
        handler = new GeminiHandler({
          apiKey: process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          ...options
        });
    }
    
    // Cache the handler for future use
    handlersCache[cacheKey] = handler;
    
    return handler;
  } catch (error) {
    logger.error(`Error creating handler for provider ${providerName}:`, error);
    return null;
  }
} 