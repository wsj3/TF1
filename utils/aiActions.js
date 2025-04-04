// AI Actions Registry
// This file defines all the actions that the AI Assistant can perform

/**
 * Registry of all available AI actions
 * Each action has:
 * - name: The action identifier
 * - description: What the action does
 * - requiredParams: Parameters needed to execute the action
 * - optionalParams: Optional parameters
 * - handler: Function that performs the action
 */
const actionRegistry = {
  // Appointment Management
  scheduleAppointment: {
    name: "scheduleAppointment",
    description: "Schedule a new appointment for a client",
    requiredParams: ["clientId", "date", "time", "duration"],
    optionalParams: ["notes", "type"],
    handler: async (params) => {
      try {
        // API call to create appointment
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to schedule appointment');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Appointment scheduled with ${params.clientName || "client"} on ${params.date} at ${params.time}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't schedule the appointment. Please try again."
        };
      }
    }
  },
  
  rescheduleAppointment: {
    name: "rescheduleAppointment",
    description: "Reschedule an existing appointment",
    requiredParams: ["appointmentId", "newDate", "newTime"],
    optionalParams: ["duration", "notes"],
    handler: async (params) => {
      try {
        const response = await fetch(`/api/appointments/${params.appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to reschedule appointment');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Appointment rescheduled to ${params.newDate} at ${params.newTime}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't reschedule the appointment. Please try again."
        };
      }
    }
  },
  
  // Client Management
  addClient: {
    name: "addClient",
    description: "Add a new client to the system",
    requiredParams: ["name", "email"],
    optionalParams: ["phone", "address", "dateOfBirth", "notes"],
    handler: async (params) => {
      try {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to add client');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Added new client: ${params.name}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't add the client. Please try again."
        };
      }
    }
  },
  
  updateClient: {
    name: "updateClient",
    description: "Update an existing client's information",
    requiredParams: ["clientId"],
    optionalParams: ["name", "email", "phone", "address", "dateOfBirth", "notes"],
    handler: async (params) => {
      try {
        const response = await fetch(`/api/clients/${params.clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to update client');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Updated client information for ${result.name || "client"}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't update the client information. Please try again."
        };
      }
    }
  },
  
  // Task Management
  createTask: {
    name: "createTask",
    description: "Create a new task",
    requiredParams: ["title", "dueDate"],
    optionalParams: ["description", "priority", "assignedTo", "clientId"],
    handler: async (params) => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to create task');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Created task: ${params.title}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't create the task. Please try again."
        };
      }
    }
  },
  
  updateTask: {
    name: "updateTask",
    description: "Update an existing task's status or details",
    requiredParams: ["taskId"],
    optionalParams: ["title", "description", "dueDate", "status", "priority", "assignedTo"],
    handler: async (params) => {
      try {
        const response = await fetch(`/api/tasks/${params.taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to update task');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Updated task: ${result.title || params.title || "task"}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't update the task. Please try again."
        };
      }
    }
  },
  
  // Billing Management
  addBillingRecord: {
    name: "addBillingRecord",
    description: "Add a new billing record for a client",
    requiredParams: ["clientId", "amount", "description"],
    optionalParams: ["date", "status", "invoiceNumber", "sessionId"],
    handler: async (params) => {
      try {
        // Default to today if no date provided
        if (!params.date) {
          params.date = new Date().toISOString().split('T')[0];
        }
        
        const response = await fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to add billing record');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Added billing record for $${params.amount} to client`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't add the billing record. Please try again."
        };
      }
    }
  },
  
  // Session Support
  startSession: {
    name: "startSession",
    description: "Start a therapy session with notes and recording",
    requiredParams: ["clientId"],
    optionalParams: ["initialNotes", "sessionType"],
    handler: async (params) => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to start session');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Started therapy session. I'm here to assist.`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't start the session. Please try again."
        };
      }
    }
  },
  
  addSessionNote: {
    name: "addSessionNote",
    description: "Add a note to the current therapy session",
    requiredParams: ["sessionId", "note"],
    optionalParams: ["timestamp", "category"],
    handler: async (params) => {
      try {
        const response = await fetch(`/api/sessions/${params.sessionId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        
        if (!response.ok) throw new Error('Failed to add session note');
        
        const result = await response.json();
        return {
          success: true,
          data: result,
          message: `Added note to the session`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't add the note to the session. Please try again."
        };
      }
    }
  },
  
  // Utility Functions
  searchClients: {
    name: "searchClients",
    description: "Search for clients by name or other criteria",
    requiredParams: ["query"],
    optionalParams: ["limit", "offset"],
    handler: async (params) => {
      try {
        const queryParams = new URLSearchParams({
          q: params.query,
          limit: params.limit || 10,
          offset: params.offset || 0
        });
        
        const response = await fetch(`/api/clients/search?${queryParams}`);
        
        if (!response.ok) throw new Error('Failed to search clients');
        
        const results = await response.json();
        return {
          success: true,
          data: results,
          message: `Found ${results.length} clients matching "${params.query}"`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't search for clients. Please try again."
        };
      }
    }
  },
  
  findAvailableSlots: {
    name: "findAvailableSlots",
    description: "Find available appointment slots for a given date range",
    requiredParams: ["startDate"],
    optionalParams: ["endDate", "duration", "clientId"],
    handler: async (params) => {
      try {
        const queryParams = new URLSearchParams({
          startDate: params.startDate,
          endDate: params.endDate || params.startDate,
          duration: params.duration || 60,
          clientId: params.clientId || ''
        });
        
        const response = await fetch(`/api/appointments/available?${queryParams}`);
        
        if (!response.ok) throw new Error('Failed to find available slots');
        
        const results = await response.json();
        return {
          success: true,
          data: results,
          message: `Found ${results.length} available time slots`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          message: "I couldn't find available appointment slots. Please try again."
        };
      }
    }
  }
};

/**
 * Process a user request to determine which action to take
 * @param {string} userRequest - The user's request text
 * @returns {Object} The identified action and extracted parameters
 */
export function processUserRequest(userRequest) {
  // To be implemented with NLP understanding
  // For now, a placeholder that would be replaced with actual NLP logic
  
  // Example implementation (simplified)
  const lowerRequest = userRequest.toLowerCase();
  
  if (lowerRequest.includes('schedule') && lowerRequest.includes('appointment')) {
    return {
      action: 'scheduleAppointment',
      params: {}  // Parameters would be extracted here
    };
  }
  
  if (lowerRequest.includes('add') && lowerRequest.includes('client')) {
    return {
      action: 'addClient',
      params: {}
    };
  }
  
  // More intent matching would be added here
  
  return null; // No action identified
}

/**
 * Execute an AI action with provided parameters
 * @param {string} actionName - The name of the action to execute
 * @param {Object} params - Parameters for the action
 * @returns {Promise<Object>} The result of the action
 */
export async function executeAction(actionName, params) {
  const action = actionRegistry[actionName];
  
  if (!action) {
    return {
      success: false,
      error: 'Unknown action',
      message: `I don't know how to ${actionName}. Please try a different request.`
    };
  }
  
  // Validate required parameters
  const missingParams = action.requiredParams.filter(param => !params[param]);
  if (missingParams.length > 0) {
    return {
      success: false,
      error: 'Missing required parameters',
      missingParams,
      message: `I need more information to ${action.name}. Please provide: ${missingParams.join(', ')}`
    };
  }
  
  // Execute the action
  return await action.handler(params);
}

export default {
  processUserRequest,
  executeAction,
  actionRegistry
}; 