/**
 * Context Manager for AI Assistant
 * 
 * Manages conversation context, session state, and entity references
 * across multiple interactions with the AI agent.
 */

/**
 * Class to track and update conversation context.
 */
export class ContextManager {
  constructor() {
    // Initialize conversation state
    this.activeContext = {
      clientId: null,              // Current client being discussed
      appointmentId: null,         // Current appointment being discussed
      entities: {},                // Named entities from the conversation
      activeTask: null,            // Current task flow (scheduling, billing, etc.)
      taskProgress: {},            // Progress within current task
      recentSearches: [],          // Previous searches
      sessionStart: new Date(),    // When session started
    };
    
    // Maximum number of searches to track
    this.maxSearchHistory = 5;
  }
  
  /**
   * Get the current conversation context.
   */
  getContext() {
    return { ...this.activeContext };
  }
  
  /**
   * Set the active client being discussed.
   */
  setActiveClient(clientId, clientInfo = {}) {
    this.activeContext.clientId = clientId;
    
    // Store additional client info if provided
    if (Object.keys(clientInfo).length > 0) {
      this.activeContext.entities[clientId] = {
        type: 'client',
        ...clientInfo
      };
    }
    
    return this.activeContext;
  }
  
  /**
   * Clear the active client.
   */
  clearActiveClient() {
    this.activeContext.clientId = null;
    return this.activeContext;
  }
  
  /**
   * Set the active appointment being discussed.
   */
  setActiveAppointment(appointmentId, appointmentInfo = {}) {
    this.activeContext.appointmentId = appointmentId;
    
    // Store additional appointment info if provided
    if (Object.keys(appointmentInfo).length > 0) {
      this.activeContext.entities[appointmentId] = {
        type: 'appointment',
        ...appointmentInfo
      };
    }
    
    return this.activeContext;
  }
  
  /**
   * Clear the active appointment.
   */
  clearActiveAppointment() {
    this.activeContext.appointmentId = null;
    return this.activeContext;
  }
  
  /**
   * Start a new task flow.
   */
  startTask(taskName, initialData = {}) {
    this.activeContext.activeTask = taskName;
    this.activeContext.taskProgress = {
      status: 'in_progress',
      step: 'initial',
      data: initialData,
      started: new Date()
    };
    
    return this.activeContext;
  }
  
  /**
   * Update progress within the current task.
   */
  updateTaskProgress(step, data = {}) {
    if (!this.activeContext.activeTask) {
      return null;
    }
    
    this.activeContext.taskProgress = {
      ...this.activeContext.taskProgress,
      step,
      data: {
        ...this.activeContext.taskProgress.data,
        ...data
      },
      lastUpdated: new Date()
    };
    
    return this.activeContext;
  }
  
  /**
   * Complete the current task.
   */
  completeTask(finalData = {}) {
    if (!this.activeContext.activeTask) {
      return null;
    }
    
    const completedTask = {
      task: this.activeContext.activeTask,
      progress: { 
        ...this.activeContext.taskProgress,
        status: 'completed',
        data: {
          ...this.activeContext.taskProgress.data,
          ...finalData
        },
        completed: new Date()
      }
    };
    
    // Reset task state
    this.activeContext.activeTask = null;
    this.activeContext.taskProgress = {};
    
    return completedTask;
  }
  
  /**
   * Track a search query for context.
   */
  addSearchQuery(query, results = null) {
    const searchEntry = {
      query,
      timestamp: new Date(),
      results: results
    };
    
    // Add to recent searches, maintaining max length
    this.activeContext.recentSearches = [
      searchEntry,
      ...this.activeContext.recentSearches.slice(0, this.maxSearchHistory - 1)
    ];
    
    return searchEntry;
  }
  
  /**
   * Remember an entity from the conversation.
   */
  trackEntity(id, type, data = {}) {
    this.activeContext.entities[id] = {
      type,
      ...data,
      mentionedAt: new Date()
    };
    
    return this.activeContext.entities[id];
  }
  
  /**
   * Get an entity by ID if it exists in context.
   */
  getEntity(id) {
    return this.activeContext.entities[id] || null;
  }
  
  /**
   * Reset the entire conversation context.
   */
  resetContext() {
    this.activeContext = {
      clientId: null,
      appointmentId: null,
      entities: {},
      activeTask: null,
      taskProgress: {},
      recentSearches: [],
      sessionStart: new Date(),
    };
    
    return this.activeContext;
  }
  
  /**
   * Serialize the context to a JSON string.
   */
  serialize() {
    return JSON.stringify(this.activeContext);
  }
  
  /**
   * Restore context from a serialized string.
   */
  deserialize(contextString) {
    try {
      const parsed = JSON.parse(contextString);
      
      // Validate and restore parsed data
      if (parsed && typeof parsed === 'object') {
        this.activeContext = {
          ...this.activeContext,  // Keep defaults for any missing fields
          ...parsed
        };
        
        // Restore date objects
        this.activeContext.sessionStart = new Date(this.activeContext.sessionStart);
        
        if (this.activeContext.taskProgress.started) {
          this.activeContext.taskProgress.started = new Date(this.activeContext.taskProgress.started);
        }
        
        if (this.activeContext.taskProgress.lastUpdated) {
          this.activeContext.taskProgress.lastUpdated = new Date(this.activeContext.taskProgress.lastUpdated);
        }
        
        this.activeContext.recentSearches = this.activeContext.recentSearches.map(search => ({
          ...search,
          timestamp: new Date(search.timestamp)
        }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to deserialize context:', error);
      return false;
    }
  }
}

/**
 * Create and export a singleton instance.
 */
export const contextManager = new ContextManager(); 