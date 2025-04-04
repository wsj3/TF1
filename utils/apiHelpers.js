/**
 * API Helper utilities for making safe API calls and handling errors
 */

/**
 * General utility for API calls that works with our updated API architecture
 * 
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, body, etc)
 * @returns {Promise<Object>} - Standardized response object
 */
export async function callApi(url, options = {}) {
  try {
    // Log the API call
    console.log('API Call:', {
      url,
      options,
      timestamp: new Date().toISOString()
    });

    // Ensure the endpoint starts with a slash
    const normalizedEndpoint = url.startsWith('/') ? url : `/${url}`;
    
    // Default options
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin', // Include cookies for authentication
    };

    // Merge options
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    // Make the API call
    console.log(`Making API call to: ${normalizedEndpoint}`, fetchOptions);
    const response = await fetch(normalizedEndpoint, fetchOptions);
    
    // Log the response status
    console.log('API Response Status:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Try to parse the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    // Log the parsed response
    console.log('API Response Data:', data);

    // Check if the response was successful
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    // Return standardized response format
    return {
      success: true,
      data: data.data || data,
      ...(data.isDemoData && { isDemoData: true }),
      ...(data.timezone && { timezone: data.timezone }),
      message: data.message
    };
  } catch (error) {
    console.error('API call failed:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      data: null
    };
  }
}

/**
 * Safely fetch data from an API endpoint with proper error handling
 * 
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data or error object
 */
export async function safeFetch(url, options = {}) {
  try {
    // Add cache-busting timestamp to GET requests to avoid stale data
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&t=${Date.now()}` 
      : `${url}?t=${Date.now()}`;
    
    console.log(`Fetching data from ${urlWithTimestamp}`);
    
    const response = await fetch(urlWithTimestamp, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    // Check if the response is successful
    if (!response.ok) {
      // Try to parse error response if possible
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: response.statusText };
      }
      
      throw new Error(
        errorData.message || errorData.error || `API responded with status ${response.status}`
      );
    }
    
    // Parse JSON response
    const data = await response.json();
    return { 
      success: true, 
      data,
      status: response.status
    };
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      status: error.status || 500
    };
  }
}

/**
 * Safe API call specifically for searching clients
 * 
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Response with client data
 */
export async function searchClientsApi(query) {
  return safeFetch('/api/search-clients', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/**
 * Safe API call for fetching sessions
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response with sessions data
 */
export async function fetchSessionsApi(params = {}) {
  // Build query string from params
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  const url = queryString ? `/api/sessions?${queryString}` : '/api/sessions';
  
  return safeFetch(url);
}

/**
 * Helper function to call the assistant API endpoint
 * 
 * @param {string} message - The user message to send to the assistant
 * @param {string} conversationId - ID for tracking conversation history
 * @param {boolean} clearContext - Whether to clear previous context
 * @param {string} systemInstructions - Optional system instructions 
 * @returns {Promise<Object>} API response
 */
export async function callAssistantApi(message, conversationId = 'default', clearContext = false, systemInstructions = '') {
  try {
    // Build message history from localStorage if available
    let messageHistory = [];
    
    if (!clearContext && typeof window !== 'undefined') {
      try {
        const savedMessages = localStorage.getItem(`ai-messages-${conversationId}`);
        if (savedMessages) {
          messageHistory = JSON.parse(savedMessages);
          console.log(`Loaded ${messageHistory.length} messages from history for conversation ${conversationId}`);
        }
      } catch (e) {
        console.error('Error retrieving message history:', e);
      }
    }
    
    // Add system message if provided
    if (systemInstructions) {
      messageHistory.unshift({
        role: 'system',
        content: systemInstructions
      });
      console.log('Added system instructions to conversation');
    }
    
    // Add current message
    messageHistory.push({
      role: 'user',
      content: message
    });
    console.log(`Prepared ${messageHistory.length} messages to send to API`);
    
    // Define available functions
    const functions = [
      {
        name: 'scheduleAppointment',
        description: 'Schedule a new appointment for a client',
        parameters: {
          type: 'object',
          properties: {
            clientId: {
              type: 'string',
              description: 'The ID of the client for the appointment'
            },
            date: {
              type: 'string',
              description: 'The date and time of the appointment (ISO format)'
            },
            notes: {
              type: 'string',
              description: 'Any notes about the appointment'
            }
          },
          required: ['clientId', 'date']
        }
      },
      {
        name: 'searchClients',
        description: 'Search for clients by name or other criteria',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query (name, email, etc.)'
            }
          },
          required: ['query']
        }
      }
    ];
    
    // Prepare request payload
    const payload = {
      messages: messageHistory,
      temperature: 0.7,
      conversationId: conversationId
    };
    
    console.log('Sending request to assistant API with payload:', 
      JSON.stringify({
        messageCount: payload.messages.length,
        temperature: payload.temperature,
        conversationId: payload.conversationId
      })
    );
    
    // API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        throw new Error('Expected JSON response but got: ' + contentType);
      }
      
      const data = await response.json();
      console.log('Raw API response:', JSON.stringify(data));
      
      // Format the response for the component
      if (data.success && data.data) {
        console.log('Response format check - data.data exists:', !!data.data);
        
        // If we have a function call response and follow-up
        if (data.data.function_call_response && data.data.follow_up_response) {
          console.log('Detected function call pattern with follow-up');
          return {
            success: true,
            data: {
              message: data.data.follow_up_response.content,
              functionCall: data.data.function_call_response.function_call
            }
          };
        }
        
        // Regular response - handle different possible formats
        if (typeof data.data.content === 'string') {
          console.log('Response has content string');
          return {
            success: true,
            data: {
              message: data.data.content
            }
          };
        } else if (typeof data.data === 'string') {
          console.log('Response data is direct string');
          return {
            success: true,
            data: {
              message: data.data
            }
          };
        } else if (data.data.role === 'assistant' && data.data.content) {
          console.log('Response has assistant role with content');
          return {
            success: true,
            data: {
              message: data.data.content
            }
          };
        }
        
        // Fallback for other data structures
        console.log('Using fallback response format');
        return {
          success: true,
          data: data.data
        };
      }
      
      console.error('API response was not successful or missing data:', data);
      return {
        success: false,
        error: data.message || 'Unknown error occurred',
        data: {
          message: data.message || "There was an error processing your request."
        }
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error calling assistant API:', error);
    return {
      success: false,
      error: error.message,
      data: {
        message: `Error: ${error.message}`
      }
    };
  }
}

/**
 * Safe API call for fetching diagnoses
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response with diagnoses data
 */
export async function fetchDiagnosesApi(params = {}) {
  // Always include demo=true as a fallback if server has issues
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  // Ensure we have a demo parameter for fallback
  if (!params.demo) {
    queryParams.append('demo', 'true');
  }
  
  const queryString = queryParams.toString();
  const url = `/api/diagnoses?${queryString}`;
  
  return safeFetch(url);
}

/**
 * Safe API call for fetching billing records
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response with billing data
 */
export async function fetchBillingApi(params = {}) {
  // Always include demo=true as a fallback if server has issues
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  // Ensure we have a demo parameter for fallback
  if (!params.demo) {
    queryParams.append('demo', 'true');
  }
  
  const queryString = queryParams.toString();
  const url = `/api/billing?${queryString}`;
  
  return safeFetch(url);
}

/**
 * Safe API call for fetching tasks
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response with tasks data
 */
export async function fetchTasksApi(params = {}) {
  // Always include demo=true as a fallback if server has issues
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  // Ensure we have a demo parameter for fallback
  if (!params.demo) {
    queryParams.append('demo', 'true');
  }
  
  const queryString = queryParams.toString();
  const url = `/api/tasks?${queryString}`;
  
  return safeFetch(url);
}

/**
 * Safe API call for creating a task
 * 
 * @param {Object} taskData - Task data to create
 * @returns {Promise<Object>} - Response with created task
 */
export async function createTaskApi(taskData) {
  return safeFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

/**
 * Safe API call for fetching clients
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Response with clients data
 */
export async function fetchClientsApi(params = {}) {
  // Always include demo=true as a fallback if server has issues
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  // Ensure we have a demo parameter for fallback
  if (!params.demo) {
    queryParams.append('demo', 'true');
  }
  
  const queryString = queryParams.toString();
  const url = `/api/clients?${queryString}`;
  
  return safeFetch(url);
}

/**
 * Helper function to create a safe API endpoint handler with demo fallback
 * This can be used as a template for all API endpoints
 * 
 * @param {Function} handler - The main API handler function
 * @param {Function} getDemoData - Function that returns demo data (optional)
 * @returns {Function} Enhanced handler with error handling
 */
export function createSafeApiEndpoint(handler, getDemoData) {
  return async (req, res) => {
    // Use singleton pattern for Prisma
    let prisma;
    if (typeof global.prisma !== 'undefined') {
      prisma = global.prisma;
    } else {
      try {
        const { PrismaClient } = require('@prisma/client');
        prisma = new PrismaClient({ log: ['error'] });
        if (process.env.NODE_ENV !== 'production') {
          global.prisma = prisma;
        }
      } catch (error) {
        console.error('Failed to initialize Prisma:', error);
        // If Prisma fails, we'll still respond with demo data
      }
    }
    
    try {
      // Skip demo mode for the assistant API
      const isAssistantApi = req.url.includes('/api/assistant');
      if (isAssistantApi) {
        console.log('Assistant API detected - skipping demo mode');
        return await handler(req, res, prisma);
      }

      // Determine if we should use demo data
      const demoMode = req.query.demo === 'true' || process.env.ALLOW_DEMO_MODE === 'true';
      const isDev = process.env.NODE_ENV === 'development';
      
      // If demo data function was provided and demo mode is requested or we couldn't initialize Prisma, return demo data
      if (getDemoData && (demoMode || !prisma)) {
        console.log('Using demo mode for', req.url);
        try {
          // Pass the request object to getDemoData for context
          const demoData = getDemoData(req);
          return res.status(200).json({
            ...demoData,
            demoMode: true
          });
        } catch (demoError) {
          console.error('Error generating demo data:', demoError);
          return res.status(200).json({
            success: false,
            error: 'Failed to generate demo data',
            demoMode: true
          });
        }
      }
      
      // If not demo mode, call the actual handler with Prisma
      if (typeof handler === 'function') {
        // For all handlers, pass prisma as the third argument
        return await handler(req, res, prisma);
      } else {
        throw new Error('Invalid handler provided');
      }
    } catch (error) {
      console.error('API error:', error);
      
      // Fall back to demo data on error if getDemoData function was provided
      if (getDemoData) {
        try {
          // Pass the request object to getDemoData for context
          const demoData = getDemoData(req);
          return res.status(200).json({
            ...demoData,
            demoMode: true
          });
        } catch (fallbackError) {
          console.error('Error generating fallback demo data:', fallbackError);
          return res.status(500).json({
            success: false,
            error: 'Server error, and failed to generate demo data',
            demoMode: true
          });
        }
      } else {
        // Return standard error if no demo data available
        return res.status(500).json({
          success: false,
          error: error.message || 'Internal server error'
        });
      }
    } finally {
      // Clean up Prisma connection if needed
      if (prisma && typeof prisma.$disconnect === 'function' && process.env.NODE_ENV !== 'production') {
        try {
          await prisma.$disconnect();
        } catch (e) {
          console.error('Error disconnecting from Prisma:', e);
        }
      }
    }
  };
}

/**
 * Direct API call to the temporary test endpoint
 * 
 * @param {string} message - The user message to send
 * @returns {Promise<Object>} API response
 */
export async function callDirectApi(message) {
  try {
    console.log('🔄 Calling direct temp-test API with message:', message.substring(0, 50) + '...');
    
    const response = await fetch('/api/temp-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 Direct API response:', data);
    
    if (data.success && data.data && data.data.content) {
      return {
        success: true,
        data: {
          message: data.data.content
        }
      };
    } else {
      throw new Error('Invalid response format from direct API');
    }
  } catch (error) {
    console.error('❌ Error calling direct API:', error);
    return {
      success: false,
      error: error.message,
      data: {
        message: `Error: ${error.message}`
      }
    };
  }
} 