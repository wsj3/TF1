/**
 * Test script for Gemini API integration
 * 
 * This script verifies that the Gemini API is properly connected and functional
 * Run with: node scripts/test-gemini.js
 */

require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');
const colors = require('./utils/colors');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function testGeminiAPI() {
  console.log(`${colors.bright}${colors.blue}Gemini API Connectivity Test${colors.reset}`);
  console.log('----------------------------------');
  
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error(`${colors.red}❌ Error: No Gemini API key found${colors.reset}`);
    console.log(`Please set GOOGLE_AI_API_KEY in your .env.local file.`);
    return false;
  }
  
  console.log(`${colors.green}✓ API key found${colors.reset}`);
  console.log(`Key starts with: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
      },
    });
    
    console.log(`${colors.blue}Sending test prompt to Gemini...${colors.reset}`);
    
    // Generate content
    const result = await model.generateContent('Hello, I am testing the Gemini API for a therapy practice management application. Please respond with a brief greeting.');
    
    // Get response
    const response = result.response;
    const text = response.text();
    
    console.log(`${colors.green}✓ Successfully received response from Gemini API${colors.reset}`);
    console.log(`${colors.bright}Response:${colors.reset} ${text.trim()}`);
    
    // Test chat functionality
    console.log(`\n${colors.blue}Testing chat functionality...${colors.reset}`);
    
    // Create a chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Hello, I want to test the chat functionality for my therapy practice.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hello! I\'m here to help with your therapy practice. What would you like to test today?' }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
      },
    });
    
    // Send a message to the chat
    console.log(`${colors.blue}Sending test chat message...${colors.reset}`);
    
    const chatResult = await chat.sendMessage('Can you help me schedule a client appointment?');
    const chatResponse = chatResult.response.text();
    
    console.log(`${colors.green}✓ Successfully received chat response${colors.reset}`);
    console.log(`${colors.bright}Response:${colors.reset} ${chatResponse.trim()}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error connecting to Gemini API:${colors.reset}`, error.message);
    console.log('\nDetails:', error);
    return false;
  }
}

// Interactive testing
async function interactiveTest() {
  console.log(`\n${colors.bright}${colors.blue}Interactive Gemini Chat${colors.reset}`);
  console.log('Type your messages, or "exit" to quit');
  console.log('----------------------------------\n');
  
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error(`${colors.red}❌ Error: No Gemini API key found${colors.reset}`);
    return;
  }
  
  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Create a chat model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
      },
    });
    
    // Create a chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are an AI assistant for a therapy practice management application. Please help me with appointments, clients, and other therapy practice needs.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'I\'m your therapy practice assistant. I can help you manage appointments, client information, billing, and other aspects of your practice. How can I assist you today?' }],
        },
      ],
    });
    
    const askQuestion = () => {
      rl.question(`${colors.bright}${colors.blue}You:${colors.reset} `, async (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log('Exiting chat...');
          rl.close();
          return;
        }
        
        try {
          console.log(`${colors.gray}(Gemini is thinking...)${colors.reset}`);
          const result = await chat.sendMessage(input);
          const text = result.response.text();
          
          console.log(`${colors.bright}${colors.green}Assistant:${colors.reset} ${text.trim()}\n`);
          askQuestion();
        } catch (error) {
          console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
          askQuestion();
        }
      });
    };
    
    askQuestion();
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
    rl.close();
  }
}

// Run tests
async function runTests() {
  const success = await testGeminiAPI();
  
  if (success) {
    console.log(`\n${colors.bright}Would you like to test the chat interactively? (y/n)${colors.reset}`);
    
    rl.question('', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        interactiveTest();
      } else {
        console.log('Exiting...');
        rl.close();
      }
    });
  } else {
    rl.close();
  }
}

// Execute tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  rl.close();
}); 