/**
 * AI Framework Main Entry Point
 * 
 * Exports all framework components for easy access throughout the application.
 */

import { AssistantHandler } from './assistantHandler';
import { contextManager } from './contextManager';
import { functionDefinitions, functionImplementations, processFunctionCall } from './functionRegistry';

// Re-export everything
export {
  // Core framework components
  AssistantHandler,
  contextManager,
  functionDefinitions,
  functionImplementations,
  processFunctionCall,
};

// Export the main singleton instance
export const assistantHandler = new AssistantHandler();

/**
 * Process a user message with the AI assistant
 * 
 * Convenience method that uses the singleton instance
 */
export async function processMessage(message, conversationHistory = []) {
  return assistantHandler.processMessage(message, conversationHistory);
}

/**
 * Reset conversation context 
 * 
 * Convenience method to clear the conversation context
 */
export function resetContext() {
  return contextManager.resetContext();
}

/**
 * Get current conversation context
 * 
 * Convenience method to access the current context
 */
export function getContext() {
  return contextManager.getContext();
}

/**
 * Execute a function directly
 * 
 * Convenience method for calling a function by name with parameters
 */
export async function executeFunction(functionName, parameters) {
  if (!functionImplementations[functionName]) {
    throw new Error(`Unknown function: ${functionName}`);
  }
  
  try {
    return await functionImplementations[functionName](parameters);
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return {
      error: true,
      message: error.message
    };
  }
} 