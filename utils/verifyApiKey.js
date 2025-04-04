/**
 * API Key Verification Utility
 * 
 * This file provides functions to verify API keys for external services
 * like OpenAI and Google's Generative AI.
 */

/**
 * Cache for API key verification results
 * Prevents repeated checks within a short time period
 */
const keyVerificationCache = {
  openai: { valid: null, timestamp: 0 },
  gemini: { valid: null, timestamp: 0 }
};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Verify if an API key is valid for the specified provider
 * 
 * @param {string} provider - 'openai' or 'gemini'
 * @returns {Promise<Object>} Object with valid boolean and message
 */
export async function verifyApiKey(provider = 'openai') {
  try {
    // Skip verification in development/demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return { valid: true, message: 'Demo mode enabled, skipping verification' };
    }
    
    // Check cache first
    const cacheEntry = keyVerificationCache[provider];
    const now = Date.now();
    
    if (cacheEntry && cacheEntry.valid !== null && (now - cacheEntry.timestamp) < CACHE_EXPIRATION) {
      return { 
        valid: cacheEntry.valid, 
        message: cacheEntry.valid 
          ? `${provider} API key previously verified` 
          : `${provider} API key previously failed verification`
      };
    }
    
    // Get the appropriate API key
    let apiKey;
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY;
    } else if (provider === 'gemini') {
      apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Check if key exists
    if (!apiKey) {
      updateCache(provider, false);
      return { valid: false, message: `No API key found for ${provider}` };
    }
    
    // Perform a lightweight API call to verify key
    if (provider === 'openai') {
      const result = await verifyOpenAIKey(apiKey);
      updateCache(provider, result.valid);
      return result;
    } else if (provider === 'gemini') {
      const result = await verifyGeminiKey(apiKey);
      updateCache(provider, result.valid);
      return result;
    }
    
    // Fallback for unknown providers
    updateCache(provider, false);
    return { valid: false, message: `Unsupported provider: ${provider}` };
  } catch (error) {
    console.error(`Error verifying ${provider} API key:`, error);
    updateCache(provider, false);
    return { valid: false, message: error.message || `Error verifying ${provider} API key` };
  }
}

/**
 * Update the cache with verification result
 * 
 * @param {string} provider - 'openai' or 'gemini'
 * @param {boolean} valid - Whether the key is valid
 */
function updateCache(provider, valid) {
  keyVerificationCache[provider] = {
    valid,
    timestamp: Date.now()
  };
}

/**
 * Verify OpenAI API key by making a simple models list request
 * 
 * @param {string} apiKey - OpenAI API key to verify
 * @returns {Promise<Object>} Object with valid boolean and message
 */
async function verifyOpenAIKey(apiKey) {
  try {
    // Make a simple request to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      return { valid: true, message: 'OpenAI API key is valid' };
    } else {
      const data = await response.json();
      return { 
        valid: false, 
        message: data.error?.message || `OpenAI API returned status ${response.status}` 
      };
    }
  } catch (error) {
    console.error('Error verifying OpenAI API key:', error);
    return { valid: false, message: error.message || 'Error verifying OpenAI API key' };
  }
}

/**
 * Verify Gemini API key by making a simple models list request
 * 
 * @param {string} apiKey - Gemini API key to verify
 * @returns {Promise<Object>} Object with valid boolean and message
 */
async function verifyGeminiKey(apiKey) {
  try {
    // Make a simple request to the Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      return { valid: true, message: 'Gemini API key is valid' };
    } else {
      const data = await response.json();
      return { 
        valid: false, 
        message: data.error?.message || `Gemini API returned status ${response.status}` 
      };
    }
  } catch (error) {
    console.error('Error verifying Gemini API key:', error);
    return { valid: false, message: error.message || 'Error verifying Gemini API key' };
  }
}

/**
 * Verify if the specified model is available with the current API key
 * 
 * @param {string} modelName - Optional specific model name to verify
 * @param {string} provider - 'openai' or 'gemini'
 * @returns {Promise<Object>} Object with available boolean and error message
 */
export async function verifyModelAvailability(modelName, provider = 'openai') {
  try {
    // Skip verification in development/demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return { 
        available: true, 
        error: null,
        model: modelName || (provider === 'openai' ? 'gpt-4o' : 'gemini-pro'),
        suggestion: 'Demo mode enabled, skipping verification' 
      };
    }
    
    const defaultModel = provider === 'openai' 
      ? (process.env.OPENAI_MODEL || 'gpt-4o')
      : (process.env.GEMINI_MODEL || 'gemini-pro');
    
    // Use provided model name or default
    const model = modelName || defaultModel;
    
    // Get the appropriate API key
    const apiKey = provider === 'openai' 
      ? process.env.OPENAI_API_KEY
      : process.env.GOOGLE_GENERATIVE_AI_KEY;
    
    if (!apiKey) {
      return { 
        available: false, 
        error: `No API key found for ${provider}`,
        model,
        suggestion: `Set the ${provider === 'openai' ? 'OPENAI_API_KEY' : 'GOOGLE_GENERATIVE_AI_KEY'} environment variable` 
      };
    }
    
    if (provider === 'openai') {
      return await verifyOpenAIModel(apiKey, model);
    } else if (provider === 'gemini') {
      return await verifyGeminiModel(apiKey, model);
    }
    
    return { 
      available: false, 
      error: `Unsupported provider: ${provider}`,
      model,
      suggestion: 'Use "openai" or "gemini" as the provider'
    };
  } catch (error) {
    console.error(`Error verifying model availability:`, error);
    return { 
      available: false, 
      error: error.message || 'Unexpected error verifying model',
      model: modelName,
      suggestion: 'Check server logs for more details'
    };
  }
}

/**
 * Verify if a specific OpenAI model is available
 * 
 * @param {string} apiKey - OpenAI API key
 * @param {string} modelName - Model name to check
 * @returns {Promise<Object>} Availability result
 */
async function verifyOpenAIModel(apiKey, modelName) {
  try {
    // Make a request to list available models
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      const data = await response.json();
      return { 
        available: false, 
        error: data.error?.message || `OpenAI API returned status ${response.status}`,
        model: modelName,
        suggestion: 'Verify your API key has the correct permissions'
      };
    }
    
    const data = await response.json();
    const models = data.data || [];
    const modelIds = models.map(m => m.id);
    
    if (modelIds.includes(modelName)) {
      return { 
        available: true, 
        error: null,
        model: modelName,
        suggestion: null
      };
    } else {
      // Model not found, suggest an alternative
      const suggestions = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-1106'];
      const availableSuggestion = suggestions.find(m => modelIds.includes(m));
      
      return { 
        available: false, 
        error: `Model ${modelName} not found in available models`,
        model: modelName,
        suggestion: availableSuggestion 
          ? `The model "${modelName}" is not available. Consider using "${availableSuggestion}" instead`
          : 'The specified model is not available. Check your OpenAI account for available models'
      };
    }
  } catch (error) {
    console.error('Error verifying OpenAI model:', error);
    return { 
      available: false, 
      error: error.message || 'Error verifying OpenAI model',
      model: modelName,
      suggestion: 'Check your internet connection and API key'
    };
  }
}

/**
 * Verify if a specific Gemini model is available
 * 
 * @param {string} apiKey - Gemini API key
 * @param {string} modelName - Model name to check
 * @returns {Promise<Object>} Availability result
 */
async function verifyGeminiModel(apiKey, modelName) {
  try {
    // Make a request to list available models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      const data = await response.json();
      return { 
        available: false, 
        error: data.error?.message || `Gemini API returned status ${response.status}`,
        model: modelName,
        suggestion: 'Verify your API key has the correct permissions'
      };
    }
    
    const data = await response.json();
    const models = data.models || [];
    const modelNames = models.map(m => m.name.split('/').pop());
    
    if (modelNames.includes(modelName)) {
      return { 
        available: true, 
        error: null,
        model: modelName,
        suggestion: null
      };
    } else {
      // Model not found, suggest an alternative
      const suggestions = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.0-pro'];
      const availableSuggestion = suggestions.find(m => modelNames.includes(m));
      
      return { 
        available: false, 
        error: `Model ${modelName} not found in available models`,
        model: modelName,
        suggestion: availableSuggestion 
          ? `The model "${modelName}" is not available. Consider using "${availableSuggestion}" instead`
          : 'The specified model is not available. Check your Google AI account for available models'
      };
    }
  } catch (error) {
    console.error('Error verifying Gemini model:', error);
    return { 
      available: false, 
      error: error.message || 'Error verifying Gemini model',
      model: modelName,
      suggestion: 'Check your internet connection and API key'
    };
  }
}

export default {
  verifyApiKey,
  verifyModelAvailability
}; 