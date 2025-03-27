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

export default {
  verifyApiKey
}; 