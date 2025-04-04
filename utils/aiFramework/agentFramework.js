/**
 * Agent Framework
 * 
 * This file provides the framework for an AI agent that can use tools
 * to perform actions in the therapy practice management system.
 */

import { getLogger } from '../logger';
import { getApiHandler } from './handlerFactory';
import { agentTools, getToolDefinitions } from './agentTools';

const logger = getLogger('agent-framework');

/**
 * AI Agent class that can use tools to perform actions
 */
export class AIAgent {
  /**
   * Create a new AIAgent instance
   * @param {Object} config - Configuration for the agent
   */
  constructor(config = {}) {
    this.config = config;
    
    // Get API handler for the configured provider
    this.apiHandler = getApiHandler(config);
    if (!this.apiHandler) {
      logger.error('Failed to initialize API handler for agent');
      throw new Error('Failed to initialize API handler for agent');
    }
    
    logger.info(`Initialized AI Agent with handler: ${this.apiHandler.name}`);
    
    // Get tool definitions
    this.toolDefinitions = getToolDefinitions();
    
    // Initialize conversation memory
    this.memory = {};
  }
  
  /**
   * Process a user message and generate a response
   * @param {Object} options - Options for processing the message
   * @param {Array} options.messages - Previous conversation messages
   * @param {String} options.conversationId - ID for the conversation
   * @returns {Object} - The agent's response
   */
  async processMessage(options) {
    const { messages, conversationId = 'default' } = options;
    
    try {
      logger.info(`Processing message for conversation ${conversationId}`);
      
      // Ensure we have a valid message history
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        logger.error('Invalid or empty messages array');
        throw new Error('Messages array is required');
      }
      
      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        logger.error('Last message must be a user message');
        throw new Error('Last message must be a user message');
      }
      
      logger.debug(`Last user message: ${lastMessage.content.substring(0, 100)}...`);
      
      // Initialize memory for this conversation if not exists
      if (!this.memory[conversationId]) {
        this.memory[conversationId] = {
          toolCalls: [],
          toolResults: []
        };
      }
      
      // Prepare messages with system instruction about available tools
      const systemInstruction = this.createSystemInstruction();
      
      // Manage context window - limit to last 10 messages to prevent token overflow
      // but always keep the system instruction and the most recent user message
      const recentMessages = messages.length <= 10 ? messages : messages.slice(-10);
      
      const enhancedMessages = [
        { role: 'system', content: systemInstruction },
        ...recentMessages
      ];
      
      try {
        // Call the AI API
        logger.info('Calling AI API with enhanced messages');
        const completion = await this.apiHandler.generateChatCompletion({
          messages: enhancedMessages,
          conversationId,
          tools: this.toolDefinitions
        });
        
        // Check if the response has function calls
        if (completion.toolCalls && completion.toolCalls.length > 0) {
          logger.info(`Response includes ${completion.toolCalls.length} tool calls`);
          
          // Process tool calls
          const toolResults = await this.processToolCalls(completion.toolCalls);
          
          // Store tool calls and results in memory
          this.memory[conversationId].toolCalls.push(...completion.toolCalls);
          this.memory[conversationId].toolResults.push(...toolResults);
          
          // Add tool results to messages
          const toolResultMessages = toolResults.map(result => ({
            role: 'function',
            name: result.name,
            content: JSON.stringify(result.result)
          }));
          
          const messagesWithToolResults = [
            ...enhancedMessages,
            {
              role: 'assistant',
              content: completion.content || '',
              toolCalls: completion.toolCalls
            },
            ...toolResultMessages
          ];
          
          // Get final response that considers the tool results
          logger.info('Getting final response that considers tool results');
          try {
            const finalCompletion = await this.apiHandler.generateChatCompletion({
              messages: messagesWithToolResults,
              conversationId
            });
            
            return {
              content: finalCompletion.content,
              toolCalls: completion.toolCalls,
              toolResults
            };
          } catch (finalError) {
            logger.error('Error getting final response after tool execution:', finalError);
            // Return what we have so far
            return {
              content: `I've processed your request but encountered an issue providing a final response. Here's what I found: ${toolResults.map(r => `${r.name}: ${r.result.success ? 'Success' : 'Failed'}`).join(', ')}`,
              toolCalls: completion.toolCalls,
              toolResults
            };
          }
        }
        
        // No tool calls, just return the completion
        return {
          content: completion.content
        };
      } catch (apiError) {
        logger.error('Error calling AI API:', apiError);
        
        // Provide a helpful fallback response
        return {
          content: "I'm sorry, I'm currently experiencing technical difficulties connecting to my AI service. This could be due to API limits, network issues, or a temporary service outage. Please try again in a moment, or contact support if the issue persists.",
          error: apiError.message
        };
      }
    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    }
  }
  
  /**
   * Process tool calls from the AI response
   * @param {Array} toolCalls - Array of tool calls from the AI
   * @returns {Array} - Results of executing the tools
   */
  async processToolCalls(toolCalls) {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        const { name, arguments: args } = toolCall;
        
        logger.info(`Processing tool call: ${name}`);
        logger.debug(`Tool arguments: ${JSON.stringify(args)}`);
        
        // Check if the tool exists
        if (!agentTools[name]) {
          logger.error(`Unknown tool: ${name}`);
          results.push({
            name,
            result: {
              success: false,
              message: `Unknown tool: ${name}`
            }
          });
          continue;
        }
        
        // Execute the tool
        logger.info(`Executing tool: ${name}`);
        const result = await agentTools[name](args);
        
        // Add result to the list
        results.push({
          name,
          result
        });
        
        logger.info(`Tool ${name} execution completed with success: ${result.success}`);
      } catch (error) {
        logger.error(`Error executing tool call ${toolCall.name}:`, error);
        
        // Add error result
        results.push({
          name: toolCall.name,
          result: {
            success: false,
            message: `Error executing tool: ${error.message}`
          }
        });
      }
    }
    
    return results;
  }
  
  /**
   * Create a system instruction that defines available tools
   * @returns {String} - System instruction for the AI
   */
  createSystemInstruction() {
    return `
You are an AI assistant for a therapist's practice management system called "Therapist's Friend". You help therapists manage their practice efficiently and professionally.

Your responses should be accurate, helpful, and appropriate for a professional mental health context. When a user asks you a question, analyze it carefully and provide the most relevant and accurate information.

Available tools:
${this.toolDefinitions.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

When a user asks you to perform a task that requires using these tools, call the appropriate tool with the required parameters.
You can search for clients, create appointments, tasks, billing records, session notes, and diagnoses.

CRITICAL INSTRUCTIONS FOR CREATING APPOINTMENTS:
1. When creating appointments, use the exact ISO 8601 date format (YYYY-MM-DD) for the date parameter
2. For time, use the 24-hour format (HH:MM) like "08:00" for 8:00 AM
3. ALWAYS use the EXACT DATE the user specifies:
   - If they say "March 29", use "2025-03-29" (never change to another date)
   - If they say "8am", use "08:00" (exact time)
4. Client IDs are exact - use "demo-1" for Jane Smith
5. DO NOT adjust for timezones or add/subtract days from requested date
6. Absolutely verify that you're using the correct date before creating the appointment

Examples of tasks you can perform:
- If a user asks to find a client named "John", use the searchClients tool with the query "John".
- If a user asks to "schedule an appointment for Jane Smith at 8am on March 29", use the createAppointment tool with clientId: "demo-1", date: "2025-03-29", time: "08:00".
- If a user wants to create a billing record, use the createBillingRecord tool with details like client, amount, and service.
- If a user asks about appointment availability, check the calendar and provide accurate time slots.

Guidelines for providing feedback:
1. Be specific and detailed in your responses
2. Verify information before presenting it to the user
3. Ask clarifying questions when needed before taking action
4. Maintain a professional tone appropriate for a therapy practice
5. Respect patient confidentiality and privacy
6. When uncertain, acknowledge limitations rather than guessing

Respond in a professional, helpful manner appropriate for a therapy practice.
    `.trim();
  }
} 