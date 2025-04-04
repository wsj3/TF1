/**
 * Simple logger utility that supports different log levels
 */

// Allowed log levels, in order of importance
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Get current log level from environment or default to 'info'
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  return LOG_LEVELS[envLevel] !== undefined ? envLevel : 'info';
};

// Create a logger with a specific context name
export const getLogger = (context) => {
  // Get current environment log level
  const currentLogLevel = getCurrentLogLevel();
  const currentLevelValue = LOG_LEVELS[currentLogLevel];
  
  // Return a logger object with methods for each log level
  return {
    error: (...args) => {
      if (LOG_LEVELS.error <= currentLevelValue) {
        console.error(`[ERROR][${context}]`, ...args);
      }
    },
    
    warn: (...args) => {
      if (LOG_LEVELS.warn <= currentLevelValue) {
        console.warn(`[WARN][${context}]`, ...args);
      }
    },
    
    info: (...args) => {
      if (LOG_LEVELS.info <= currentLevelValue) {
        console.info(`[INFO][${context}]`, ...args);
      }
    },
    
    debug: (...args) => {
      if (LOG_LEVELS.debug <= currentLevelValue) {
        console.debug(`[DEBUG][${context}]`, ...args);
      }
    }
  };
}; 