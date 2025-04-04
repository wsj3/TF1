/**
 * Simple OpenAI API Key Check
 * This script checks if your OpenAI API key is properly loaded from environment variables
 */
require('dotenv').config({ path: './.env.local' });
console.log('Checking OpenAI API Key...');

// Check if the API key exists
if (!process.env.OPENAI_API_KEY) {
  console.log('❌ ERROR: OPENAI_API_KEY is not set in .env.local');
  console.log('Please make sure you have this line in your .env.local file:');
  console.log('OPENAI_API_KEY=sk-...');
} else {
  // Mask the key for security
  const keyStart = process.env.OPENAI_API_KEY.substring(0, 5);
  const keyEnd = process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4);
  const keyLength = process.env.OPENAI_API_KEY.length;
  
  console.log(`✅ OPENAI_API_KEY found: ${keyStart}...${keyEnd} (${keyLength} characters)`);
  
  // Verify it's a valid format
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('⚠️ WARNING: Key doesn\'t start with "sk-" which is the expected format for OpenAI API keys');
  }
  
  // Other environment variables
  console.log('\nOther related environment variables:');
  console.log(`OPENAI_MODEL: ${process.env.OPENAI_MODEL || '(not set)'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`);
}

// Show all loaded env vars for debugging (masked)
console.log('\nAll loaded environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('KEY') || key.includes('SECRET')) {
    console.log(`${key}: ***masked***`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
}); 