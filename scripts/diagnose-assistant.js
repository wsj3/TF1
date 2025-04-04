/**
 * AI Assistant Diagnostic Script
 * 
 * This script helps diagnose issues with the AI Assistant by:
 * 1. Checking API key configuration
 * 2. Testing database connection
 * 3. Making a test call to the OpenAI API
 * 4. Testing the local API endpoint
 */
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

// ANSI color codes for nice output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function runDiagnostics() {
  console.log(`\n${colors.bright}${colors.blue}===== AI ASSISTANT DIAGNOSTICS =====${colors.reset}\n`);
  
  // 1. Check OpenAI API Key
  console.log(`\n${colors.cyan}🔑 API KEY:${colors.reset}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log(`${colors.red}❌ Missing OpenAI API key!${colors.reset}`);
    console.log(`${colors.yellow}Please check your .env.local file and make sure OPENAI_API_KEY is set.${colors.reset}`);
  } else {
    const keyPrefix = process.env.OPENAI_API_KEY.substring(0, 3);
    const keyLength = process.env.OPENAI_API_KEY.length;
    console.log(`${colors.green}✓ API key found (${keyPrefix}...${keyLength} chars)${colors.reset}`);
  }
  
  // 2. Test database connection
  console.log(`\n${colors.cyan}📊 DATABASE CONNECTION:${colors.reset}`);
  let prisma;
  let dbSuccess = false;
  
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log(`${colors.green}✓ Database connection successful${colors.reset}`);
    
    // Test a simple query
    try {
      const clientCount = await prisma.client.count();
      console.log(`${colors.green}✓ Database query successful (${clientCount} clients in database)${colors.reset}`);
      dbSuccess = true;
    } catch (queryError) {
      console.log(`${colors.red}❌ Database query error: ${queryError.message}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Database connection error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Please check your DATABASE_URL in .env.local${colors.reset}`);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
  
  // 3. Test OpenAI API
  console.log(`\n${colors.cyan}🤖 OPENAI API TEST:${colors.reset}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log(`${colors.yellow}⚠️ Skipping OpenAI test due to missing API key${colors.reset}`);
  } else {
    try {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);
      
      console.log(`${colors.dim}Making test request to OpenAI...${colors.reset}`);
      const start = Date.now();
      
      const response = await openai.createChatCompletion({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "OpenAI connection successful" if you can read this message.' }],
        max_tokens: 50,
      });
      
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const content = response.data.choices[0].message.content.trim();
      
      console.log(`${colors.green}✓ OpenAI API response received (${elapsed}s)${colors.reset}`);
      console.log(`${colors.dim}Response: "${content}"${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ OpenAI API error: ${error.message}${colors.reset}`);
      if (error.response) {
        console.log(`${colors.red}Status: ${error.response.status}${colors.reset}`);
        console.log(`${colors.red}Data: ${JSON.stringify(error.response.data)}${colors.reset}`);
      }
    }
  }
  
  // 4. Simulate a test call to the assistant API endpoint
  console.log(`\n${colors.cyan}🌐 LOCAL API ENDPOINT TEST:${colors.reset}`);
  console.log(`${colors.yellow}⚠️ This test requires running a local development server${colors.reset}`);
  console.log(`${colors.yellow}⚠️ Make sure 'npm run dev' is running in another terminal${colors.reset}`);
  
  try {
    const testMessage = "Test message from diagnostic script";
    console.log(`${colors.dim}Sending test request with message: "${testMessage}"${colors.reset}`);
    
    const response = await fetch('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        conversationId: 'diagnostic-test',
        clearContext: true
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✓ API endpoint responded successfully${colors.reset}`);
      console.log(`${colors.dim}Response preview: "${data.message?.substring(0, 50)}..."${colors.reset}`);
    } else {
      const errorText = await response.text();
      console.log(`${colors.red}❌ API endpoint error (${response.status}): ${errorText}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Could not connect to local API: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Is your development server running? (npm run dev)${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}===== DIAGNOSTICS SUMMARY =====${colors.reset}`);
  console.log(`
  1. ${process.env.OPENAI_API_KEY ? colors.green + '✓ API Key configured' : colors.red + '❌ API Key missing'}${colors.reset}
  2. ${dbSuccess ? colors.green + '✓ Database connection working' : colors.red + '❌ Database connection issues'}${colors.reset}
  3. ${colors.yellow}ℹ️ See detailed results above for OpenAI and API endpoint tests${colors.reset}
  `);
  
  console.log(`${colors.cyan}Recommended steps if you're having issues:${colors.reset}`);
  console.log(`
  ${colors.bright}1. Check your environment variables:${colors.reset}
     - Make sure OPENAI_API_KEY is correctly set in .env.local
     - Verify DATABASE_URL is correct in .env.local
  
  ${colors.bright}2. Check server logs:${colors.reset}
     - Look for specific error messages in your console where the dev server is running
  
  ${colors.bright}3. Check network requests:${colors.reset}
     - Open browser dev tools (F12) and look at the Network tab when using the AI Assistant
     - Look for failed requests and error responses
  
  ${colors.bright}4. Try restarting the development server:${colors.reset}
     - Stop the current process and run 'npm run dev' again
  `);
}

runDiagnostics().catch(error => {
  console.error('Error running diagnostics:', error);
}); 