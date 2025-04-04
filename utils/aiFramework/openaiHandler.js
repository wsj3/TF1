import { OpenAI } from 'openai';
import { getLogger } from '../logger';

const logger = getLogger('openai-handler');

/**
 * OpenAI API handler implementation
 */
class OpenAIHandler {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.model = options.model || 'gpt-4o';
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 4096;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: this.apiKey
    });
    
    logger.info(`Initialized OpenAI handler with model: ${this.model}`);
  }
  
  /**
   * Generate a chat completion response
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response from OpenAI API
   */
  async generateChatCompletion(messages, options = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages,
        temperature: options.temperature || this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
        n: 1
      });
      
      return {
        text: response.choices[0].message.content,
        rawResponse: response
      };
    } catch (error) {
      logger.error('Error generating chat completion:', error);
      throw error;
    }
  }
  
  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Array>} - Embeddings
   */
  async generateEmbeddings(text) {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw error;
    }
  }
}

export default OpenAIHandler; 