/**
 * Script Loader Utility
 * 
 * This utility provides functions for safely loading external scripts with
 * proper error handling, retries, and timeouts to prevent UI blocking.
 */

/**
 * Safely load an external script with a timeout
 * @param {string} src - The script URL to load
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} - Resolves to true if loaded successfully, false otherwise
 */
export function loadScriptWithTimeout(src, timeout = 5000) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    let timer;

    // Success handler
    script.onload = () => {
      if (timer) clearTimeout(timer);
      resolve(true);
    };

    // Error handler
    script.onerror = () => {
      if (timer) clearTimeout(timer);
      console.error(`Failed to load script: ${src}`);
      resolve(false);
    };

    // Set timeout to prevent long-running script loads from blocking UI
    timer = setTimeout(() => {
      console.warn(`Script load timed out: ${src}`);
      resolve(false);
    }, timeout);

    // Add script to document
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  });
}

/**
 * Load a script with retries
 * @param {string} src - The script URL to load
 * @param {number} retries - Number of retry attempts
 * @param {number} timeout - Timeout per attempt in milliseconds
 * @returns {Promise<boolean>} - Resolves to true if loaded successfully
 */
export async function loadScriptWithRetries(src, retries = 2, timeout = 3000) {
  let attempts = 0;

  while (attempts <= retries) {
    attempts++;
    
    try {
      const success = await loadScriptWithTimeout(src, timeout);
      if (success) return true;
      
      console.log(`Script load attempt ${attempts}/${retries + 1} failed. ${attempts <= retries ? 'Retrying...' : 'No more retries.'}`);
    } catch (err) {
      console.error(`Error loading script (attempt ${attempts}/${retries + 1}):`, err);
    }
    
    if (attempts <= retries) {
      // Wait before retrying (increasing delay with each attempt)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
  
  return false;
}

/**
 * Check if we're in a browser environment where scripts can be loaded
 * @returns {boolean} - True if in browser environment
 */
export function canLoadScripts() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safely load a script only in development mode
 * @param {string} src - The script URL to load
 * @returns {Promise<boolean>} - Resolves to true if loaded successfully
 */
export async function loadDevelopmentScript(src) {
  if (process.env.NODE_ENV !== 'development' || !canLoadScripts()) {
    return false;
  }
  
  return loadScriptWithTimeout(src);
}

/**
 * Safely load a script only in production mode
 * @param {string} src - The script URL to load
 * @returns {Promise<boolean>} - Resolves to true if loaded successfully
 */
export async function loadProductionScript(src) {
  if (process.env.NODE_ENV !== 'production' || !canLoadScripts()) {
    return false;
  }
  
  return loadScriptWithRetries(src);
} 