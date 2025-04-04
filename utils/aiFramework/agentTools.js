/**
 * Agent Tools Framework
 * 
 * This file defines tools that the AI agent can use to perform actions
 * in the therapy practice management system.
 */

import { getLogger } from '../logger';
import { 
  createAppointmentTimeString, 
  calculateEndTime, 
  formatDateForDisplay, 
  formatTimeForDisplay 
} from '../dateUtils';

const logger = getLogger('agent-tools');

// Mock database for development purposes
const mockDatabase = {
  clients: [
    { id: 'client1', name: 'Jane Smith', email: 'jane@example.com', phone: '555-1234', notes: 'Anxiety, weekly sessions' },
    { id: 'client2', name: 'John Doe', email: 'john@example.com', phone: '555-5678', notes: 'Depression, biweekly sessions' },
    { id: 'client3', name: 'Alice Johnson', email: 'alice@example.com', phone: '555-9012', notes: 'Relationship issues, as needed' }
  ],
  appointments: [],
  tasks: [],
  billingRecords: [],
  sessionNotes: [],
  diagnoses: []
};

/**
 * Available tools for the AI agent
 */
export const agentTools = {
  /**
   * Search for clients by name or other attributes
   */
  searchClients: async ({ query }) => {
    try {
      logger.info(`Searching for clients with query: "${query}"`);
      
      if (!query) {
        return {
          success: false,
          message: 'No search query provided'
        };
      }
      
      // Filter clients by name, email, or notes containing the query
      const results = mockDatabase.clients.filter(client => 
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.email.toLowerCase().includes(query.toLowerCase()) ||
        client.notes.toLowerCase().includes(query.toLowerCase())
      );
      
      logger.info(`Found ${results.length} clients matching "${query}"`);
      
      return {
        success: true,
        clients: results,
        count: results.length,
        message: `Found ${results.length} clients matching "${query}"`
      };
    } catch (error) {
      logger.error('Error searching clients:', error);
      return {
        success: false,
        message: `Error searching clients: ${error.message}`
      };
    }
  },
  
  /**
   * Create a new appointment
   */
  createAppointment: async ({ clientId, date, time, duration, notes }) => {
    try {
      logger.info(`Creating appointment for client ${clientId} on ${date} at ${time}`);
      
      if (!clientId || !date || !time) {
        return {
          success: false,
          message: 'Missing required fields (clientId, date, time)'
        };
      }
      
      // Use our consistent date utility to format the start time
      const startTimeString = createAppointmentTimeString(date, time);
      logger.info("Formatted start time:", startTimeString);
      
      // And consistently calculate the end time
      const endTimeString = calculateEndTime(startTimeString, duration || 60);
      logger.info("Calculated end time:", endTimeString);
      
      // Create a human-readable date/time for logging and confirmation
      const readableDate = formatDateForDisplay(startTimeString);
      const readableTime = formatTimeForDisplay(startTimeString);
      logger.info(`Creating appointment on ${readableDate} at ${readableTime}`);
      
      // Make API call to create appointment
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          startTime: startTimeString,
          endTime: endTimeString,
          duration: parseInt(duration || 60, 10),
          notes: notes || `Appointment for ${clientId} on ${readableDate} at ${readableTime}`,
          type: 'Regular Session',
          status: 'scheduled',
          demo: clientId.startsWith('demo-') ? true : false
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }
      
      const data = await response.json();
      logger.info("Appointment created:", data);
      
      // Trigger calendar refresh explicitly
      if (typeof window !== 'undefined') {
        logger.info('Attempting to refresh calendar...');
        
        // Try multiple refresh methods to ensure calendar updates
        try {
          // Method 1: Dispatch custom event
          window.dispatchEvent(new CustomEvent('appointment-created', {
            detail: { appointment: data.appointment }
          }));
          
          // Method 2: Call the reload function directly
          if (window.reloadCalendar && typeof window.reloadCalendar === 'function') {
            logger.info('Calling reloadCalendar directly');
            window.reloadCalendar();
          }
          
          // Method 3: Try legacy reload method
          if (window.loadDemoAppointments && typeof window.loadDemoAppointments === 'function') {
            logger.info('Calling loadDemoAppointments legacy method');
            window.loadDemoAppointments();
          }
          
          // Method 4: Force reload after a slight delay
          setTimeout(() => {
            try {
              logger.info('Attempting delayed calendar refresh');
              window.dispatchEvent(new Event('resize')); // Sometimes helps FullCalendar update
              window.reloadCalendar?.();
            } catch (e) {
              logger.error('Error in delayed refresh:', e);
            }
          }, 500);
        } catch (e) {
          logger.error("Error triggering calendar refresh:", e);
        }
      }
      
      return {
        success: true,
        appointmentId: data.appointment.id,
        message: `Successfully scheduled appointment for ${data.appointment.client?.name || 'client'} on ${readableDate} at ${readableTime}`,
        appointment: data.appointment
      };
    } catch (error) {
      logger.error('Error creating appointment:', error);
      return {
        success: false,
        message: `Failed to create appointment: ${error.message}`
      };
    }
  },
  
  /**
   * Create a new task
   */
  createTask: async ({ title, description, dueDate, priority, assignedTo, clientId }) => {
    try {
      logger.info(`Creating task: ${title}`);
      
      if (!title) {
        return {
          success: false,
          message: 'Task title is required'
        };
      }
      
      // If clientId is provided, validate client exists
      if (clientId) {
        const client = mockDatabase.clients.find(c => c.id === clientId);
        if (!client) {
          return {
            success: false,
            message: `Client with ID ${clientId} not found`
          };
        }
      }
      
      // Create task record
      const taskId = `task-${Date.now()}`;
      const task = {
        id: taskId,
        title,
        description: description || '',
        dueDate: dueDate || null,
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
        clientId: clientId || null,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Add to database
      mockDatabase.tasks.push(task);
      
      logger.info(`Created task ${taskId}: ${title}`);
      
      return {
        success: true,
        taskId,
        message: `Successfully created task: ${title}`,
        task
      };
    } catch (error) {
      logger.error('Error creating task:', error);
      return {
        success: false,
        message: `Error creating task: ${error.message}`
      };
    }
  },
  
  /**
   * Create a billing record
   */
  createBillingRecord: async ({ clientId, sessionId, date, amount, description, billingCode, paymentStatus }) => {
    try {
      logger.info(`Creating billing record for client ${clientId}: $${amount}`);
      
      if (!clientId || !date || !amount || !description) {
        return {
          success: false,
          message: 'Missing required fields (clientId, date, amount, description)'
        };
      }
      
      // Validate client exists
      const client = mockDatabase.clients.find(c => c.id === clientId);
      if (!client) {
        return {
          success: false,
          message: `Client with ID ${clientId} not found`
        };
      }
      
      // Create billing record
      const billingId = `bill-${Date.now()}`;
      const billingRecord = {
        id: billingId,
        clientId,
        clientName: client.name,
        sessionId: sessionId || null,
        date,
        amount,
        description,
        billingCode: billingCode || '',
        paymentStatus: paymentStatus || 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Add to database
      mockDatabase.billingRecords.push(billingRecord);
      
      logger.info(`Created billing record ${billingId} for client ${client.name}: $${amount}`);
      
      return {
        success: true,
        billingId,
        message: `Successfully created billing record for ${client.name}: $${amount}`,
        billingRecord
      };
    } catch (error) {
      logger.error('Error creating billing record:', error);
      return {
        success: false,
        message: `Error creating billing record: ${error.message}`
      };
    }
  },
  
  /**
   * Create a session note
   */
  createSessionNote: async ({ clientId, sessionId, date, summary, notes, treatmentPlan, followUpActions }) => {
    try {
      logger.info(`Creating session note for client ${clientId}`);
      
      if (!clientId || !date || !summary) {
        return {
          success: false,
          message: 'Missing required fields (clientId, date, summary)'
        };
      }
      
      // Validate client exists
      const client = mockDatabase.clients.find(c => c.id === clientId);
      if (!client) {
        return {
          success: false,
          message: `Client with ID ${clientId} not found`
        };
      }
      
      // Create session note
      const noteId = `note-${Date.now()}`;
      const sessionNote = {
        id: noteId,
        clientId,
        clientName: client.name,
        sessionId: sessionId || null,
        date,
        summary,
        notes: notes || '',
        treatmentPlan: treatmentPlan || '',
        followUpActions: followUpActions || '',
        createdAt: new Date().toISOString()
      };
      
      // Add to database
      mockDatabase.sessionNotes.push(sessionNote);
      
      logger.info(`Created session note ${noteId} for client ${client.name}`);
      
      return {
        success: true,
        noteId,
        message: `Successfully created session note for ${client.name}`,
        sessionNote
      };
    } catch (error) {
      logger.error('Error creating session note:', error);
      return {
        success: false,
        message: `Error creating session note: ${error.message}`
      };
    }
  },
  
  /**
   * Create a diagnosis
   */
  createDiagnosis: async ({ clientId, diagnosisName, diagnosisCode, assessmentDate, symptoms, assessmentNotes, severity, treatmentRecommendations, researchSources }) => {
    try {
      logger.info(`Creating diagnosis for client ${clientId}: ${diagnosisName}`);
      
      if (!clientId || !diagnosisName || !assessmentDate || !assessmentNotes) {
        return {
          success: false,
          message: 'Missing required fields (clientId, diagnosisName, assessmentDate, assessmentNotes)'
        };
      }
      
      // Validate client exists
      const client = mockDatabase.clients.find(c => c.id === clientId);
      if (!client) {
        return {
          success: false,
          message: `Client with ID ${clientId} not found`
        };
      }
      
      // Create diagnosis
      const diagnosisId = `diag-${Date.now()}`;
      const diagnosis = {
        id: diagnosisId,
        clientId,
        clientName: client.name,
        diagnosisName,
        diagnosisCode: diagnosisCode || '',
        assessmentDate,
        symptoms: symptoms || [],
        assessmentNotes,
        severity: severity || 'moderate',
        treatmentRecommendations: treatmentRecommendations || '',
        researchSources: researchSources || [],
        createdAt: new Date().toISOString()
      };
      
      // Add to database
      mockDatabase.diagnoses.push(diagnosis);
      
      logger.info(`Created diagnosis ${diagnosisId} for client ${client.name}: ${diagnosisName}`);
      
      return {
        success: true,
        diagnosisId,
        message: `Successfully created diagnosis "${diagnosisName}" for ${client.name}`,
        diagnosis
      };
    } catch (error) {
      logger.error('Error creating diagnosis:', error);
      return {
        success: false,
        message: `Error creating diagnosis: ${error.message}`
      };
    }
  }
};

/**
 * Get available tool definitions for the AI agent
 * These definitions are used to populate the Gemini system message
 */
export const getToolDefinitions = () => {
  return [
    {
      name: "searchClients",
      description: "Search for clients by name or other attributes",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find clients"
          }
        },
        required: ["query"]
      }
    },
    {
      name: "createAppointment",
      description: "Schedule a new appointment for a client",
      parameters: {
        type: "object",
        properties: {
          clientId: {
            type: "string",
            description: "The ID of the client for the appointment"
          },
          date: {
            type: "string",
            description: "The date of the appointment (YYYY-MM-DD)"
          },
          time: {
            type: "string",
            description: "The time of the appointment (HH:MM)"
          },
          duration: {
            type: "number",
            description: "The duration of the appointment in minutes"
          },
          notes: {
            type: "string",
            description: "Any additional notes for the appointment"
          }
        },
        required: ["clientId", "date", "time"]
      }
    },
    {
      name: "createTask",
      description: "Create a new task in the system",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the task"
          },
          description: {
            type: "string",
            description: "Detailed description of the task"
          },
          dueDate: {
            type: "string",
            description: "The due date of the task (YYYY-MM-DD)"
          },
          priority: {
            type: "string",
            description: "Task priority (low, medium, high)",
            enum: ["low", "medium", "high"]
          },
          assignedTo: {
            type: "string",
            description: "User ID the task is assigned to (if applicable)"
          },
          clientId: {
            type: "string",
            description: "Client ID the task is related to (if applicable)"
          }
        },
        required: ["title"]
      }
    },
    {
      name: "createBillingRecord",
      description: "Create a new billing record for a client session",
      parameters: {
        type: "object",
        properties: {
          clientId: {
            type: "string",
            description: "The ID of the client for the billing record"
          },
          sessionId: {
            type: "string",
            description: "The ID of the related session (if applicable)"
          },
          date: {
            type: "string",
            description: "The date of service (YYYY-MM-DD)"
          },
          amount: {
            type: "number",
            description: "The billing amount"
          },
          description: {
            type: "string",
            description: "Description of the service provided"
          },
          billingCode: {
            type: "string",
            description: "The billing code used (if applicable)"
          },
          paymentStatus: {
            type: "string",
            description: "Payment status (pending, paid, overdue)",
            enum: ["pending", "paid", "overdue"]
          }
        },
        required: ["clientId", "date", "amount", "description"]
      }
    },
    {
      name: "createSessionNote",
      description: "Create a therapy session note or summary",
      parameters: {
        type: "object",
        properties: {
          clientId: {
            type: "string",
            description: "The ID of the client for the session note"
          },
          sessionId: {
            type: "string",
            description: "The ID of the related session (if applicable)"
          },
          date: {
            type: "string",
            description: "The date of the session (YYYY-MM-DD)"
          },
          summary: {
            type: "string",
            description: "Brief summary of the session"
          },
          notes: {
            type: "string",
            description: "Detailed therapy notes for the session"
          },
          treatmentPlan: {
            type: "string",
            description: "Updates to the treatment plan (if applicable)"
          },
          followUpActions: {
            type: "string",
            description: "Actions to take before the next session"
          }
        },
        required: ["clientId", "date", "summary"]
      }
    },
    {
      name: "createDiagnosis",
      description: "Create a clinical diagnosis based on session notes and research",
      parameters: {
        type: "object",
        properties: {
          clientId: {
            type: "string",
            description: "The ID of the client for the diagnosis"
          },
          diagnosisName: {
            type: "string",
            description: "The name of the diagnosis (e.g., 'Major Depressive Disorder')"
          },
          diagnosisCode: {
            type: "string",
            description: "The diagnostic code (e.g., ICD-10 or DSM-5 code)"
          },
          assessmentDate: {
            type: "string",
            description: "The date the diagnosis was determined (YYYY-MM-DD)"
          },
          symptoms: {
            type: "array",
            description: "List of symptoms supporting the diagnosis",
            items: {
              type: "string"
            }
          },
          assessmentNotes: {
            type: "string",
            description: "Clinical notes about the assessment and diagnosis reasoning"
          },
          severity: {
            type: "string",
            description: "The severity level of the diagnosis",
            enum: ["mild", "moderate", "severe"]
          },
          treatmentRecommendations: {
            type: "string",
            description: "Recommended treatment approach based on diagnosis"
          },
          researchSources: {
            type: "array",
            description: "References to research or clinical guidelines used",
            items: {
              type: "string"
            }
          }
        },
        required: ["clientId", "diagnosisName", "assessmentDate", "assessmentNotes"]
      }
    }
  ];
}; 