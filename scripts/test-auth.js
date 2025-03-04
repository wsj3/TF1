/**
 * Authentication Testing Script
 * 
 * This script tests the authentication flows in the application.
 * Run this script before deployment to verify authentication is working correctly.
 * 
 * Usage: node scripts/test-auth.js
 */

const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.production
const envFile = process.env.ENV_FILE || '.env.production';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Test configuration
const config = {
  apiBaseUrl: process.env.API_BASE_URL,
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'testpassword'
  },
  endpoints: {
    login: '/api/auth/login',
    user: '/api/auth/user',
    protected: '/api/protected'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Utility function to log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Utility function to log test results
function logTestResult(testName, success, message) {
  if (success) {
    log(`✓ ${testName}: ${message}`, colors.green);
  } else {
    log(`✗ ${testName}: ${message}`, colors.red);
  }
  return success;
}

// Test authentication API connection
async function testApiConnection() {
  try {
    log('\nTesting API connection...', colors.blue);
    
    if (!config.apiBaseUrl) {
      return logTestResult('API Connection', false, 'API_BASE_URL is not defined in environment variables');
    }
    
    const response = await fetch(`${config.apiBaseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      return logTestResult('API Connection', true, `Connected successfully to ${config.apiBaseUrl}`);
    } else {
      return logTestResult('API Connection', false, `Failed to connect to ${config.apiBaseUrl}, status: ${response.status}`);
    }
  } catch (error) {
    return logTestResult('API Connection', false, `Error connecting to API: ${error.message}`);
  }
}

// Test login flow
async function testLogin() {
  try {
    log('\nTesting login flow...', colors.blue);
    
    const response = await fetch(`${config.apiBaseUrl}${config.endpoints.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.testUser.email,
        password: config.testUser.password
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      return {
        success: logTestResult('Login', true, 'Successfully logged in and received token'),
        token: data.token
      };
    } else {
      return {
        success: logTestResult('Login', false, `Login failed: ${data.message || response.statusText}`),
        token: null
      };
    }
  } catch (error) {
    return {
      success: logTestResult('Login', false, `Login error: ${error.message}`),
      token: null
    };
  }
}

// Test accessing user data with token
async function testGetUserData(token) {
  try {
    log('\nTesting user data retrieval...', colors.blue);
    
    if (!token) {
      return logTestResult('User Data', false, 'No token available, skipping test');
    }
    
    const response = await fetch(`${config.apiBaseUrl}${config.endpoints.user}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.user) {
      return logTestResult('User Data', true, `Successfully retrieved user data for: ${data.user.email}`);
    } else {
      return logTestResult('User Data', false, `Failed to retrieve user data: ${data.message || response.statusText}`);
    }
  } catch (error) {
    return logTestResult('User Data', false, `User data error: ${error.message}`);
  }
}

// Test accessing protected endpoint with token
async function testProtectedEndpoint(token) {
  try {
    log('\nTesting protected endpoint access...', colors.blue);
    
    if (!token) {
      return logTestResult('Protected Endpoint', false, 'No token available, skipping test');
    }
    
    const response = await fetch(`${config.apiBaseUrl}${config.endpoints.protected}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return logTestResult('Protected Endpoint', true, 'Successfully accessed protected endpoint');
    } else {
      return logTestResult('Protected Endpoint', false, `Failed to access protected endpoint: ${data.message || response.statusText}`);
    }
  } catch (error) {
    return logTestResult('Protected Endpoint', false, `Protected endpoint error: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  log('=================================', colors.blue);
  log('  Authentication Testing Script   ', colors.blue);
  log('=================================', colors.blue);
  log(`Using environment file: ${envFile}`);
  log(`API Base URL: ${config.apiBaseUrl || 'Not defined'}`);
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test API connection
  const apiConnectionResult = await testApiConnection();
  apiConnectionResult ? testsPassed++ : testsFailed++;
  
  // If API connection fails, exit
  if (!apiConnectionResult) {
    log('\nAPI connection failed, aborting remaining tests.', colors.red);
    return summarizeResults(testsPassed, testsFailed);
  }
  
  // Test login
  const { success: loginSuccess, token } = await testLogin();
  loginSuccess ? testsPassed++ : testsFailed++;
  
  // Test user data retrieval
  const userDataResult = await testGetUserData(token);
  userDataResult ? testsPassed++ : testsFailed++;
  
  // Test protected endpoint
  const protectedEndpointResult = await testProtectedEndpoint(token);
  protectedEndpointResult ? testsPassed++ : testsFailed++;
  
  // Summarize results
  summarizeResults(testsPassed, testsFailed);
}

// Summarize test results
function summarizeResults(passed, failed) {
  log('\n=================================', colors.blue);
  log('         Test Summary            ', colors.blue);
  log('=================================', colors.blue);
  log(`Tests passed: ${passed}`, colors.green);
  log(`Tests failed: ${failed}`, failed > 0 ? colors.red : colors.reset);
  log('\n');
  
  if (failed > 0) {
    log('Some tests failed. Please review and fix issues before deploying.', colors.yellow);
    process.exit(1);
  } else {
    log('All authentication tests passed!', colors.green);
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  log(`Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
}); 