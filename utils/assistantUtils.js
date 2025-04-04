/**
 * Utilities for assistant functionality
 */

/**
 * Creates a response based on query keywords
 * @param {string} query - The user's query
 * @returns {string} - A tailored response
 */
export function createResponseBasedOnQuery(query = '') {
  if (!query || typeof query !== 'string') {
    return "I'm here to assist with your therapy practice. How can I help you today?";
  }
  
  console.log('Processing query for response:', query.substring(0, 50) + '...');
  
  const lowercaseQuery = query.toLowerCase();
  
  // Professional therapy assistant responses
  if (lowercaseQuery.includes('appointment')) {
    return "I can help you schedule that appointment. What date and time works best? And which client is this for?";
  } 
  
  if (lowercaseQuery.includes('client') || lowercaseQuery.includes('patient')) {
    if (lowercaseQuery.includes('add') || lowercaseQuery.includes('new') || lowercaseQuery.includes('create')) {
      return "I'll help you add this new client. What's their full name, contact information, and insurance details? Also, when would you like to schedule their first appointment?";
    }
    return "I can help you find client information. What's the client's name or ID you're looking for?";
  } 
  
  if (lowercaseQuery.includes('task') || lowercaseQuery.includes('todo')) {
    return "I can add this task to your list. When is the deadline, and would you like me to set a priority level for it?";
  } 
  
  if (lowercaseQuery.includes('diagnosis') || lowercaseQuery.includes('assessment')) {
    return "I can help you document this diagnosis. What symptoms has the client been reporting, and what assessments have you conducted? This will help create a comprehensive diagnosis record.";
  } 
  
  if (lowercaseQuery.includes('billing') || lowercaseQuery.includes('invoice')) {
    return "I can help you create a billing record. What service was provided, what's the billing code, and what's the charge amount? Also, which client is this for?";
  } 
  
  if (lowercaseQuery.includes('session') || lowercaseQuery.includes('notes')) {
    return "I can help you document your session notes. Would you like to create a new note or review previous session notes for a specific client?";
  }
  
  if (lowercaseQuery.includes('insurance') || lowercaseQuery.includes('coverage')) {
    return "I can help you verify insurance information. Which client's insurance would you like to check, and what specific information do you need about their coverage?";
  }
  
  if (lowercaseQuery.includes('hello') || lowercaseQuery.includes('hi') || lowercaseQuery.includes('hey')) {
    return "Hello! I'm your therapy practice assistant. I can help with appointments, client records, billing, session notes, and more. What would you like help with today?";
  } 
  
  if (lowercaseQuery.includes('help')) {
    return "I'm here to help with your therapy practice. I can assist with scheduling appointments, managing client records, documenting session notes, creating diagnoses, handling billing, and more. What specific task can I help you with today?";
  } 
  
  if (lowercaseQuery.includes('thank')) {
    return "You're welcome! Is there anything else I can assist you with regarding your therapy practice today?";
  } 
  
  if (lowercaseQuery.includes('report') || lowercaseQuery.includes('analytics')) {
    return "I can help generate a practice report for you. What time period would you like the report to cover, and are you interested in specific metrics like client retention, session frequency, or billing summaries?";
  }
  
  if (lowercaseQuery.includes('search')) {
    return "I can help you search through your records. Are you looking for a specific client, appointment, billing record, or something else?";
  }
  
  if (lowercaseQuery.includes('payment')) {
    return "I can help you record a payment. Which client made the payment, what was the amount, and what payment method did they use?";
  }
  
  // Default response
  return "I'm here to assist with your therapy practice management. I can help with appointments, client records, session notes, diagnoses, billing, and more. How can I help you today?";
} 