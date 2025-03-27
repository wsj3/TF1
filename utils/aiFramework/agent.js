/**
 * AI Agent Framework
 * 
 * This file defines the core AI agent functionality for Therapist's Friend.
 * It provides a framework for executing AI-driven actions, managing context,
 * and handling responses.
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyApiKey } from '../verifyApiKey';

let openaiClient = null;
let geminiClient = null;

/**
 * Initialize the AI clients
 */
function initializeAIClients() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  if (!geminiClient && process.env.GOOGLE_GENERATIVE_AI_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY);
  }
}

/**
 * Make an AI request using the specified provider
 * 
 * @param {string} provider - 'openai' or 'gemini'
 * @param {Object} params - Parameters for the AI request
 * @returns {Promise<Object>} AI response
 */
export async function makeAIRequest(provider = 'openai', params = {}) {
  try {
    initializeAIClients();
    
    // Use demo mode if no API keys are available or explicitly requested
    if (params.demoMode || (!openaiClient && !geminiClient)) {
      return generateDemoResponse(params);
    }
    
    // Verify API keys are valid
    const keyStatus = await verifyApiKey(provider);
    if (!keyStatus.valid) {
      console.error(`Invalid ${provider} API key`);
      return {
        success: false,
        error: `Invalid ${provider} API key. Please check your configuration.`,
        isDemo: false
      };
    }
    
    // Make the appropriate API call based on provider
    if (provider === 'openai' && openaiClient) {
      return await makeOpenAIRequest(params);
    } else if (provider === 'gemini' && geminiClient) {
      return await makeGeminiRequest(params);
    } else {
      throw new Error(`Provider ${provider} not available or configured`);
    }
  } catch (error) {
    console.error('AI Request error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred with the AI service',
      isDemo: false
    };
  }
}

/**
 * Make a request to OpenAI
 * 
 * @param {Object} params - Parameters for the OpenAI request
 * @returns {Promise<Object>} OpenAI response
 */
async function makeOpenAIRequest(params) {
  try {
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens } = params;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required for OpenAI requests');
    }
    
    const requestOptions = {
      model,
      messages,
      temperature,
    };
    
    if (maxTokens) {
      requestOptions.max_tokens = maxTokens;
    }
    
    const response = await openaiClient.chat.completions.create(requestOptions);
    
    return {
      success: true,
      data: response,
      content: response.choices[0]?.message?.content || '',
      isDemo: false
    };
  } catch (error) {
    console.error('OpenAI request error:', error);
    
    // Fall back to demo mode on error
    return {
      ...generateDemoResponse(params),
      original_error: error.message
    };
  }
}

/**
 * Make a request to Google's Gemini API
 * 
 * @param {Object} params - Parameters for the Gemini request
 * @returns {Promise<Object>} Gemini response
 */
async function makeGeminiRequest(params) {
  try {
    const { messages, model = 'gemini-pro', temperature = 0.7 } = params;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required for Gemini requests');
    }
    
    // Convert chat messages to Gemini format
    const formattedMessages = messages.map(msg => {
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      };
    });
    
    const geminiModel = geminiClient.getGenerativeModel({ model });
    const chat = geminiModel.startChat({
      history: formattedMessages.slice(0, -1),
      generationConfig: {
        temperature
      }
    });
    
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    
    return {
      success: true,
      data: response,
      content: response.text(),
      isDemo: false
    };
  } catch (error) {
    console.error('Gemini request error:', error);
    
    // Fall back to demo mode on error
    return {
      ...generateDemoResponse(params),
      original_error: error.message
    };
  }
}

/**
 * Generate a demo response when API keys are not available
 * 
 * @param {Object} params - Original request parameters
 * @returns {Object} Demo response
 */
function generateDemoResponse(params) {
  const demoResponses = {
    treatment_plan: {
      content: `# Suggested Treatment Plan\n\n## Goals\n\n1. Reduce anxiety symptoms by 50% within 3 months\n2. Improve sleep quality and duration\n3. Develop effective coping mechanisms for stress\n\n## Interventions\n\n- Cognitive Behavioral Therapy (CBT) focused on identifying and challenging anxious thoughts\n- Progressive muscle relaxation and deep breathing exercises\n- Sleep hygiene education and practice\n- Mindfulness training\n\n## Evidence Base\n\nCBT has strong empirical support for anxiety disorders (Hofmann et al., 2012). Relaxation techniques and mindfulness have moderate to strong evidence for anxiety symptom reduction (Chen et al., 2018).`,
    },
    session_notes: {
      content: `# Session Notes\n\n## Summary\nClient discussed ongoing work stress and recent conflict with supervisor. Reported increased anxiety symptoms including difficulty concentrating and sleep disturbance. Made good progress identifying cognitive distortions related to workplace interactions.\n\n## Interventions Used\n- Cognitive restructuring\n- Stress management techniques\n- Problem-solving strategies for workplace communication\n\n## Plan\n- Continue practicing thought records daily\n- Implement progressive muscle relaxation before bed\n- Role-play difficult conversations in next session`,
    },
    diagnosis_suggestion: {
      content: `Based on the symptoms described, consider the following possible diagnoses:\n\n1. Generalized Anxiety Disorder (F41.1)\n   - Excessive worry occurring more days than not\n   - Difficulty controlling worry\n   - Associated symptoms include restlessness, fatigue, concentration problems\n\n2. Adjustment Disorder with Anxiety (F43.28)\n   - Emotional/behavioral symptoms in response to identifiable stressor\n   - Symptoms developed within 3 months of stressor\n   - Marked distress exceeding what would be expected\n\nRecommended assessments: GAD-7, OASIS, Life Events Checklist`,
    },
    default: {
      content: "This is a demo response. In production, this would be generated by an AI model. Please configure your API keys to use the actual AI services."
    }
  };
  
  // Determine which type of demo response to return based on the messages content
  let responseType = 'default';
  
  if (params.messages && Array.isArray(params.messages)) {
    const lastMessage = params.messages[params.messages.length - 1];
    if (lastMessage && lastMessage.content) {
      const content = lastMessage.content.toLowerCase();
      
      if (content.includes('treatment plan') || content.includes('therapy plan')) {
        responseType = 'treatment_plan';
      } else if (content.includes('session notes') || content.includes('progress notes')) {
        responseType = 'session_notes';
      } else if (content.includes('diagnosis') || content.includes('assessment')) {
        responseType = 'diagnosis_suggestion';
      }
    }
  }
  
  return {
    success: true,
    content: demoResponses[responseType].content,
    isDemo: true,
    demo_type: responseType
  };
}

/**
 * Execute an AI agent action
 * 
 * @param {string} actionType - Type of action to execute
 * @param {Object} actionParams - Parameters for the action
 * @param {Object} options - Additional options for execution
 * @returns {Promise<Object>} Action result
 */
export async function executeAgentAction(actionType, actionParams = {}, options = {}) {
  try {
    // Import the specific action handler dynamically
    let actionHandler;
    
    switch (actionType) {
      case 'treatmentSuggestion':
        // In a dynamic import scenario, we'd do something like:
        // actionHandler = require('./agentActions/treatmentSuggestionAction').default;
        // For now, we'll handle it directly here
        return await generateTreatmentSuggestion(actionParams, options);
        
      case 'diagnosisSuggestion':
        return await generateDiagnosisSuggestion(actionParams, options);
        
      case 'sessionSummary':
        return await generateSessionSummary(actionParams, options);
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    console.error(`Error executing agent action ${actionType}:`, error);
    return {
      success: false,
      error: error.message || `An error occurred while executing the ${actionType} action`,
      isDemo: options.demoMode || false
    };
  }
}

/**
 * Generate treatment suggestions based on client information
 * 
 * @param {Object} params - Parameters including client information and presenting problems
 * @param {Object} options - Options including AI provider and demo mode flag
 * @returns {Promise<Object>} Treatment suggestion result
 */
async function generateTreatmentSuggestion(params, options = {}) {
  try {
    const { clientInfo, presentingProblems, existingDiagnoses, clientGoals, therapyPreferences } = params;
    
    // Create a prompt for the AI
    const messages = [
      {
        role: 'system',
        content: `You are a licensed therapist with expertise in evidence-based therapy approaches. You provide treatment suggestions based on client information, always citing the evidence base for your recommendations. Focus on practical, specific interventions.`
      },
      {
        role: 'user',
        content: `Please suggest an evidence-based treatment plan for a client with the following information:
        
        ${clientInfo ? `Client Information: ${JSON.stringify(clientInfo)}` : ''}
        ${presentingProblems ? `Presenting Problems: ${presentingProblems}` : ''}
        ${existingDiagnoses ? `Existing Diagnoses: ${existingDiagnoses}` : ''}
        ${clientGoals ? `Client Goals: ${clientGoals}` : ''}
        ${therapyPreferences ? `Therapy Preferences: ${therapyPreferences}` : ''}
        
        Please structure your response with:
        1. Recommended treatment approaches with evidence base
        2. Specific goals and objectives
        3. Suggested interventions
        4. Estimated timeline and frequency
        5. Outcome measures to track progress`
      }
    ];
    
    const result = await makeAIRequest(options.provider || 'openai', {
      messages,
      temperature: 0.7,
      demoMode: options.demoMode || false
    });
    
    return {
      ...result,
      actionType: 'treatmentSuggestion'
    };
  } catch (error) {
    console.error('Treatment suggestion error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred generating treatment suggestions',
      isDemo: options.demoMode || false,
      actionType: 'treatmentSuggestion'
    };
  }
}

/**
 * Generate diagnosis suggestions based on client symptoms
 * 
 * @param {Object} params - Parameters including client symptoms and history
 * @param {Object} options - Options including AI provider and demo mode flag
 * @returns {Promise<Object>} Diagnosis suggestion result
 */
async function generateDiagnosisSuggestion(params, options = {}) {
  try {
    const { symptoms, duration, history, previousDiagnoses } = params;
    
    // Create a prompt for the AI
    const messages = [
      {
        role: 'system',
        content: `You are a licensed clinical psychologist with expertise in assessment and diagnosis. You provide diagnostic considerations based on reported symptoms, always referencing DSM-5 criteria. You never make definitive diagnoses and always emphasize the importance of a proper clinical assessment.`
      },
      {
        role: 'user',
        content: `Please provide diagnostic considerations for a client with the following information:
        
        ${symptoms ? `Current Symptoms: ${symptoms}` : ''}
        ${duration ? `Duration: ${duration}` : ''}
        ${history ? `Relevant History: ${history}` : ''}
        ${previousDiagnoses ? `Previous Diagnoses: ${previousDiagnoses}` : ''}
        
        Please structure your response with:
        1. Possible diagnostic considerations with DSM-5 codes
        2. Differential diagnosis discussion
        3. Recommended assessments or additional information needed
        4. Important considerations for the diagnostic process`
      }
    ];
    
    const result = await makeAIRequest(options.provider || 'openai', {
      messages,
      temperature: 0.7,
      demoMode: options.demoMode || false
    });
    
    return {
      ...result,
      actionType: 'diagnosisSuggestion'
    };
  } catch (error) {
    console.error('Diagnosis suggestion error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred generating diagnosis suggestions',
      isDemo: options.demoMode || false,
      actionType: 'diagnosisSuggestion'
    };
  }
}

/**
 * Generate session summary based on session notes
 * 
 * @param {Object} params - Parameters including session notes
 * @param {Object} options - Options including AI provider and demo mode flag
 * @returns {Promise<Object>} Session summary result
 */
async function generateSessionSummary(params, options = {}) {
  try {
    const { sessionNotes, clientId, sessionDate, focusAreas } = params;
    
    // Create a prompt for the AI
    const messages = [
      {
        role: 'system',
        content: `You are a licensed therapist who creates concise, professional session notes. Your summaries include the key points discussed, interventions used, client progress, and plan for next steps. You maintain a professional, clinical tone.`
      },
      {
        role: 'user',
        content: `Please create a professional session summary based on the following session notes:
        
        ${sessionNotes ? `Session Notes: ${sessionNotes}` : ''}
        ${sessionDate ? `Session Date: ${sessionDate}` : ''}
        ${focusAreas ? `Focus Areas: ${focusAreas}` : ''}
        
        Please structure your response in a SOAP note format:
        1. Subjective: Client's report and statements
        2. Objective: Observations and interventions used
        3. Assessment: Clinical impressions and progress evaluation
        4. Plan: Next steps and homework assignments`
      }
    ];
    
    const result = await makeAIRequest(options.provider || 'openai', {
      messages,
      temperature: 0.7,
      demoMode: options.demoMode || false
    });
    
    return {
      ...result,
      actionType: 'sessionSummary'
    };
  } catch (error) {
    console.error('Session summary error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred generating the session summary',
      isDemo: options.demoMode || false,
      actionType: 'sessionSummary'
    };
  }
}

// Create an aiAgent object to export functionality
export const aiAgent = {
  makeAIRequest,
  executeAgentAction,
  generateTreatmentSuggestion,
  generateDiagnosisSuggestion,
  generateSessionSummary
};

export default {
  makeAIRequest,
  executeAgentAction,
  aiAgent
}; 