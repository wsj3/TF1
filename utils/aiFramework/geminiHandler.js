/**
 * Gemini AI Handler
 * 
 * This utility handles interactions with Google's Gemini models, providing
 * a consistent interface for chat completions and function calling.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLogger } from '../logger';

const logger = getLogger('gemini-handler');

/**
 * Handler for Google's Gemini API
 */
class GeminiHandler {
  /**
   * Create a new GeminiHandler instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Store configuration
    this.config = config;
    this.name = 'Gemini';
    this.apiKey = config.apiKey;
    
    if (!this.apiKey) {
      logger.error('No API key provided for Gemini');
      throw new Error('API key is required for Gemini');
    }
    
    // Initialize the Google AI client
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    
    // Use a preferred model order - we'll try these in sequence
    this.preferredModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    // The model name will be set after checking availability
    this.modelName = config.modelName || this.preferredModels[0];
    
    // Check available models and set the best one
    this.initializeModel().catch(err => {
      logger.warn(`Error initializing model, using default: ${err.message}`);
    });
    
    logger.info(`Initialized GeminiHandler with model: ${this.modelName}`);
    
    // Extract and prepare model options with better defaults
    this.modelOptions = {
      temperature: config.temperature ?? 0.4, // Lower temperature for more focused responses
      topP: config.topP ?? 0.9, // Higher topP for better quality generations
      topK: config.topK ?? 40,
      maxOutputTokens: config.maxOutputTokens ?? 4096, // Increased token limit for more complete responses
      safetySettings: config.safetySettings ?? [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };
    logger.debug('Model options:', this.modelOptions);
  }
  
  /**
   * Initialize and check available models
   * @returns {Promise<void>}
   */
  async initializeModel() {
    try {
      // Try to list available models
      const models = await this.listAvailableModels();
      logger.info(`Available Gemini models: ${models.join(', ')}`);
      
      // Find the first preferred model that's available
      const availableModel = this.preferredModels.find(model => models.includes(model));
      
      if (availableModel) {
        this.modelName = availableModel;
        logger.info(`Selected model: ${this.modelName}`);
      } else if (models.length > 0) {
        // If none of our preferred models are available, use the first available one
        this.modelName = models[0];
        logger.info(`None of the preferred models available. Using: ${this.modelName}`);
      } else {
        logger.warn('No Gemini models available. Using default model name but this may fail.');
      }
    } catch (error) {
      logger.error('Error checking available models:', error);
      // Keep using the default model name
    }
  }
  
  /**
   * List available models from the API
   * @returns {Promise<string[]>} Array of available model names
   */
  async listAvailableModels() {
    try {
      // This is a simple test to see which models work
      const models = [];
      
      for (const modelName of this.preferredModels) {
        try {
          // Try to initialize the model
          const model = this.genAI.getGenerativeModel({ model: modelName });
          // If it doesn't throw an error, add it to the list
          models.push(modelName);
          logger.debug(`Model ${modelName} is available`);
        } catch (e) {
          logger.debug(`Model ${modelName} is not available: ${e.message}`);
        }
      }
      
      return models;
    } catch (error) {
      logger.error('Error listing models:', error);
      return [];
    }
  }
  
  /**
   * Convert standard chat messages to Gemini format
   * @param {Array} messages - Array of {role, content} message objects
   * @returns {Array} - Messages in Gemini format
   */
  convertToGeminiMessages(messages) {
    if (!Array.isArray(messages)) {
      logger.error('Messages must be an array, received:', typeof messages);
      return [];
    }
    
    logger.debug(`Converting ${messages.length} messages to Gemini format`);
    
    // Map messages to Gemini format
    const geminiMessages = messages.map(msg => {
      // Check if message has required properties
      if (!msg || typeof msg !== 'object' || !msg.role) {
        logger.warn('Invalid message format, skipping:', msg);
        return null;
      }
      
      // Handle messages with tool calls or function results
      if (msg.role === 'assistant' && msg.toolCalls) {
        return {
          role: 'model',
          parts: [
            { text: msg.content || '' },
            ...msg.toolCalls.map(toolCall => ({
              functionCall: {
                name: toolCall.name,
                args: toolCall.arguments
              }
            }))
          ]
        };
      } else if (msg.role === 'function') {
        return {
          role: 'function',
          parts: [{
            functionResponse: {
              name: msg.name,
              response: msg.content
            }
          }]
        };
      } else {
        // Clean the content
        const content = typeof msg.content === 'string' ? msg.content.trim() : 
                      msg.content ? String(msg.content).trim() : '';
        
        if (!content) {
          logger.warn('Empty message content, skipping');
          return null;
        }
        
        // Map to Gemini's role format
        const role = msg.role === 'user' ? 'user' : 
                    msg.role === 'system' ? 'user' : 'model';
        
        // For system messages, add a prefix
        const text = msg.role === 'system' ? 
                    `[System instruction]: ${content}` : content;
        
        return {
          role,
          parts: [{ text }]
        };
      }
    });
    
    // Filter out null entries
    return geminiMessages.filter(Boolean);
  }
  
  /**
   * Convert Gemini tool schema to the format expected by the API
   * @param {Array} tools - Tool definitions
   * @returns {Array} - Formatted tool definitions
   */
  formatToolDefinitions(tools) {
    if (!tools || !Array.isArray(tools)) {
      return [];
    }
    
    return tools.map(tool => ({
      functionDeclarations: [{
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }]
    }));
  }
  
  /**
   * Parse tool calls from Gemini response
   * @param {Object} response - Gemini response
   * @returns {Array} - Extracted tool calls
   */
  extractToolCalls(response) {
    if (!response || !response.candidates || !response.candidates[0]) {
      return [];
    }
    
    const candidate = response.candidates[0];
    
    if (!candidate.content || !candidate.content.parts) {
      return [];
    }
    
    const toolCalls = [];
    
    for (const part of candidate.content.parts) {
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          arguments: part.functionCall.args || {}
        });
      }
    }
    
    return toolCalls;
  }
  
  /**
   * Generate a chat completion response using streaming to prevent connection timeouts
   * @param {Object} options - Options for the completion
   * @returns {Object} - The completion response
   */
  async generateChatCompletion(options = {}) {
    try {
      const { messages, temperature, maxTokens, conversationId, tools } = options;
      
      // Validate messages
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        logger.error('Invalid or empty messages array');
        throw new Error('Messages array is required');
      }
      
      // Log what we're sending to Gemini
      logger.info(`Generating chat completion for ${messages.length} messages`);
      logger.debug('Last message:', messages[messages.length - 1]?.content?.substring(0, 100));
      
      // Convert messages to Gemini format
      const geminiMessages = this.convertToGeminiMessages(messages);
      
      if (geminiMessages.length === 0) {
        logger.error('No valid messages after conversion');
        throw new Error('No valid messages to send to Gemini');
      }
      
      // Prepare model options
      const generationConfig = {
        temperature: temperature ?? this.modelOptions.temperature,
        topP: this.modelOptions.topP,
        topK: this.modelOptions.topK,
        maxOutputTokens: maxTokens ?? this.modelOptions.maxOutputTokens
      };
      
      // If tools are provided, format them for Gemini
      const formattedTools = tools ? this.formatToolDefinitions(tools) : undefined;
      
      // Get the model with options
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig,
        safetySettings: this.modelOptions.safetySettings,
        tools: formattedTools
      });
      
      // Prepare the chat session
      let chatSession;
      try {
        chatSession = model.startChat({
          history: geminiMessages.slice(0, -1),
          generationConfig
        });
        logger.debug('Chat session started successfully');
      } catch (e) {
        logger.error('Failed to start chat session:', e);
        throw new Error('Failed to initialize chat: ' + e.message);
      }
      
      // Get the last message to send
      const lastMessage = geminiMessages[geminiMessages.length - 1];
      
      if (!lastMessage) {
        logger.error('No last message to send');
        throw new Error('No valid last message to send to Gemini');
      }
      
      // Send the message and get the response using streaming to prevent timeouts
      try {
        logger.debug('Sending message to Gemini chat using streaming');
        const messageText = lastMessage.parts && lastMessage.parts[0].text ? 
                           lastMessage.parts[0].text : "";
        
        // Use streaming response to avoid channel closing issues
        const streamingResult = await chatSession.sendMessageStream(messageText);
        
        // Process the streaming response
        let responseText = '';
        const toolCalls = [];
        let hasStartedResponse = false;
        let lastChunkTime = Date.now();
        const maxChunkWaitTime = 10000; // 10 seconds max wait between chunks
        
        // Collect all chunks from the stream
        logger.debug('Processing streaming response from Gemini');
        try {
          for await (const chunk of streamingResult.stream) {
            // Update last chunk time
            lastChunkTime = Date.now();
            
            // Process content chunks
            if (chunk.text) {
              responseText += chunk.text;
              if (!hasStartedResponse) {
                hasStartedResponse = true;
                logger.debug('Received first chunk of response');
              }
            }
            
            // Check for function calls in this chunk
            for (const part of chunk.parts || []) {
              if (part.functionCall) {
                toolCalls.push({
                  name: part.functionCall.name,
                  arguments: part.functionCall.args || {}
                });
                logger.debug(`Detected tool call in stream: ${part.functionCall.name}`);
              }
            }
          }
          
          logger.info('Successfully received complete streaming response from Gemini');
        } catch (streamError) {
          logger.warn('Error during stream processing:', streamError);
          
          // If we at least started getting a response, use what we have
          if (hasStartedResponse) {
            logger.info('Using partial response as stream was interrupted');
          } else {
            throw new Error('Stream failed before receiving any response: ' + streamError.message);
          }
        }
        
        // Verify we got a meaningful response
        if (!responseText.trim()) {
          logger.warn('Received empty response from Gemini');
          responseText = "I'm sorry, I wasn't able to generate a response. Please try again or rephrase your request.";
        }
        
        logger.debug('Response preview:', responseText.substring(0, 100));
        
        // Return in a standardized format
        const completion = {
          content: responseText,
          role: 'assistant',
          model: this.modelName,
          provider: this.name
        };
        
        // If there are tool calls, add them to the completion
        if (toolCalls.length > 0) {
          logger.info(`Response includes ${toolCalls.length} tool calls`);
          completion.toolCalls = toolCalls;
        }
        
        return completion;
      } catch (e) {
        logger.error('Error in streaming response from Gemini:', e);
        throw new Error('Failed to get streaming response from Gemini: ' + e.message);
      }
    } catch (error) {
      logger.error('Error generating chat completion:', error);
      throw error;
    }
  }
}

export default GeminiHandler; 