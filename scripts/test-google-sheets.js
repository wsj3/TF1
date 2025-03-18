/**
 * Script to test Google Sheets access
 * 
 * This script verifies if the configured Google Sheet is accessible
 * and helps diagnose any issues with permissions or APIs.
 * 
 * Run with: node scripts/test-google-sheets.js
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { google } = require('googleapis');
const chalk = require('chalk') || { green: (s) => s, red: (s) => s, yellow: (s) => s, blue: (s) => s };

// Configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;

// Helper function to log with timestamp
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] ${msg}`),
  success: (msg) => console.log(chalk.green(`[${new Date().toISOString()}] ✓ ${msg}`)),
  error: (msg) => console.log(chalk.red(`[${new Date().toISOString()}] ✗ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`[${new Date().toISOString()}] ⚠ ${msg}`))
};

// Test API key access
async function testApiKeyAccess() {
  log.info('Testing Google Sheets API access using API key...');
  
  try {
    if (!API_KEY) {
      log.warn('No Google API key found in environment variables');
      return false;
    }
    
    const sheets = google.sheets({
      version: 'v4',
      auth: API_KEY
    });
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: 'spreadsheetId,properties,sheets.properties'
    });
    
    log.success('Successfully accessed Google Sheet using API key');
    log.info(`Sheet title: "${response.data.properties.title}"`);
    log.info(`Found ${response.data.sheets.length} sheets:`);
    
    response.data.sheets.forEach((sheet, i) => {
      log.info(`  ${i+1}. ${sheet.properties.title}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Failed to access Google Sheet using API key: ${error.message}`);
    if (error.response) {
      log.error(`Status code: ${error.response.status}`);
      log.error(`Error details: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test public URL access
async function testPublicAccess() {
  log.info('Testing public URL access to Google Sheet...');
  
  try {
    const publicUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
    const response = await axios.get(publicUrl);
    
    if (response.status === 200) {
      log.success('Successfully accessed Google Sheet via public URL');
      return true;
    } else {
      log.error(`Failed to access Google Sheet via public URL: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to access Google Sheet via public URL: ${error.message}`);
    return false;
  }
}

// Test export URL access
async function testExportUrl() {
  log.info('Testing export URL access to Google Sheet...');
  
  try {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    const response = await axios.get(exportUrl);
    
    if (response.status === 200) {
      log.success('Successfully accessed Google Sheet via export URL');
      
      // Check if the response contains JSON data
      const data = response.data;
      if (typeof data === 'string' && data.includes('table')) {
        log.success('Export URL returned valid data');
      } else {
        log.warn('Export URL response may not contain valid data');
        log.info(`Response starts with: ${typeof data === 'string' ? data.substring(0, 100) : typeof data}`);
      }
      
      return true;
    } else {
      log.error(`Failed to access Google Sheet via export URL: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to access Google Sheet via export URL: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  log.info('=== Google Sheets Access Test ===');
  log.info(`Sheet ID: ${SHEET_ID || 'Not set'}`);
  log.info(`API Key: ${API_KEY ? 'Configured' : 'Not configured'}`);
  
  if (!SHEET_ID) {
    log.error('No Google Sheet ID found in environment variables');
    process.exit(1);
  }
  
  // Run all tests
  const apiAccess = await testApiKeyAccess();
  const publicAccess = await testPublicAccess();
  const exportAccess = await testExportUrl();
  
  // Summary
  log.info('\n=== Test Summary ===');
  log.info(`API Key Access: ${apiAccess ? chalk.green('✓ Successful') : chalk.red('✗ Failed')}`);
  log.info(`Public URL Access: ${publicAccess ? chalk.green('✓ Successful') : chalk.red('✗ Failed')}`);
  log.info(`Export URL Access: ${exportAccess ? chalk.green('✓ Successful') : chalk.red('✗ Failed')}`);
  
  // Recommendations
  log.info('\n=== Recommendations ===');
  
  if (!apiAccess && !publicAccess && !exportAccess) {
    log.error('All access methods failed. Check if the sheet exists and sharing permissions.');
    log.info('Make sure the Google Sheet exists and is shared with "Anyone with the link" (View access).');
  } else if (!apiAccess && (publicAccess || exportAccess)) {
    log.warn('API key access failed but public access works.');
    log.info('The application will use the public export method to access the sheet.');
    log.info('If you want to use the API method, check if your API key is valid and has access to the Sheets API.');
  } else if (apiAccess && (!publicAccess || !exportAccess)) {
    log.warn('API access works but public access has issues.');
    log.info('The application might fall back to using the API method, which may have rate limits.');
    log.info('For best performance, ensure the sheet is shared with "Anyone with the link" (View access).');
  } else if (apiAccess && publicAccess && exportAccess) {
    log.success('All access methods are working correctly!');
    log.info('The application should be able to access and display the Google Sheet data.');
  }
}

// Run the tests
main().catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
}); 