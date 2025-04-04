/**
 * Sanitizes a message to remove potentially dangerous content
 * @param {string} message - The message to sanitize
 * @returns {string} - The sanitized message
 */
export const sanitizeMessage = (message) => {
  if (!message) return '';
  
  // Convert to string if it's not already
  const messageStr = typeof message === 'string' ? message : String(message);
  
  // Remove HTML tags, scripts, and other potentially dangerous content
  return messageStr
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;[^&]*&gt;/g, '') // Remove encoded HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: URIs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script|iframe|alert|confirm|prompt|eval|document\./gi, ''); // Remove common JS terms
};

/**
 * Validates if a message complies with HIPAA requirements
 * @param {string} message - The message to validate
 * @returns {boolean} - Whether the message is HIPAA compliant
 */
export const validateHIPAACompliance = (message) => {
  if (!message) return true;

  // List of potentially sensitive patterns
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{10}\b/, // Phone number pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email pattern
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP address pattern
    /\b\d{16}\b/, // Credit card pattern
    /\b\d{9}\b/, // ZIP code pattern
    /\b\d{5}\b/, // ZIP code pattern
    /\b\d{4}\b/, // Year pattern
    /\b\d{2}\/\d{2}\/\d{4}\b/, // Date pattern
    /\b\d{2}-\d{2}-\d{4}\b/, // Date pattern
    /\b\d{2}\.\d{2}\.\d{4}\b/, // Date pattern
  ];

  // Check for sensitive patterns
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return false;
    }
  }

  // Check for common medical terms that might indicate PHI
  const medicalTerms = [
    'diagnosis',
    'treatment',
    'prescription',
    'medication',
    'symptoms',
    'condition',
    'disease',
    'illness',
    'injury',
    'disability',
    'mental health',
    'depression',
    'anxiety',
    'therapy',
    'counseling',
    'psychiatric',
    'psychological',
    'medical history',
    'family history',
    'genetic information',
  ];

  const messageLower = message.toLowerCase();
  for (const term of medicalTerms) {
    if (messageLower.includes(term)) {
      // If medical term is found, check if it's in a clinical context
      const context = messageLower.split(term)[0].slice(-50) + term + messageLower.split(term)[1].slice(0, 50);
      if (!isClinicalContext(context)) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Checks if a message is in a clinical context
 * @param {string} context - The message context to check
 * @returns {boolean} - Whether the context is clinical
 */
const isClinicalContext = (context) => {
  const clinicalIndicators = [
    'client',
    'patient',
    'session',
    'assessment',
    'evaluation',
    'progress note',
    'treatment plan',
    'clinical',
    'therapeutic',
    'intervention',
    'goal',
    'objective',
    'outcome',
  ];

  return clinicalIndicators.some(indicator => 
    context.toLowerCase().includes(indicator)
  );
}; 