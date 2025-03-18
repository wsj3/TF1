#!/usr/bin/env node

/**
 * This script tests connectivity to a Google Sheet
 * It can be run from the command line to diagnose issues
 * 
 * Usage:
 *   node scripts/test-sheets-connection.js [sheet-id]
 * 
 * If no sheet ID is provided, it will attempt to read from .env.local or .env
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { google } = require('googleapis');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Get sheet ID from command line args or env vars
const sheetId = process.argv[2] || 
                process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || 
                process.env.GOOGLE_SHEET_ID || 
                '16BxY67QqOE-CDOhF9GiUkESRuAyYt4TI641Zpu32qIc';

console.log(`${colors.bright}${colors.blue}Google Sheets Connectivity Test${colors.reset}`);
console.log(`${colors.cyan}Testing sheet ID: ${sheetId}${colors.reset}\n`);

async function runTests() {
  const results = {
    apiNoAuth: { success: false, error: null },
    publicUrl: { success: false, error: null },
    apiWithKey: { success: false, error: null }
  };
  
  // Test 1: API access without auth
  console.log(`${colors.bright}Test 1: API access without auth${colors.reset}`);
  try {
    const sheets = google.sheets({ version: 'v4', auth: null });
    const response = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    
    results.apiNoAuth.success = true;
    results.apiNoAuth.title = response.data.properties.title;
    results.apiNoAuth.sheetCount = response.data.sheets.length;
    
    console.log(`${colors.green}✓ Success!${colors.reset}`);
    console.log(`  Found sheet: ${response.data.properties.title}`);
    console.log(`  Number of sheets: ${response.data.sheets.length}`);
  } catch (error) {
    results.apiNoAuth.error = error.message;
    console.log(`${colors.red}✗ Failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
  }
  
  // Test 2: Public export URL
  console.log(`\n${colors.bright}Test 2: Public export URL${colors.reset}`);
  try {
    const publicUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(publicUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const text = await response.text();
    
    if (text.includes('{') && text.includes('}') && text.includes('table')) {
      results.publicUrl.success = true;
      console.log(`${colors.green}✓ Success!${colors.reset}`);
      console.log(`  Sheet is accessible via public export URL`);
    } else {
      throw new Error('Response format not recognized');
    }
  } catch (error) {
    results.publicUrl.error = error.message;
    console.log(`${colors.red}✗ Failed${colors.reset}`);
    console.log(`  Error: ${error.message}`);
  }
  
  // Test 3: API access with API key (if available)
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  console.log(`\n${colors.bright}Test 3: API access with API key${colors.reset}`);
  
  if (!apiKey) {
    console.log(`${colors.yellow}⚠ Skipped${colors.reset}`);
    console.log(`  No API key found in environment variables.`);
    console.log(`  Add GOOGLE_SHEETS_API_KEY to .env.local to test this method.`);
  } else {
    try {
      const sheets = google.sheets({ version: 'v4', auth: apiKey });
      const response = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      
      results.apiWithKey.success = true;
      results.apiWithKey.title = response.data.properties.title;
      
      console.log(`${colors.green}✓ Success!${colors.reset}`);
      console.log(`  Found sheet: ${response.data.properties.title}`);
    } catch (error) {
      results.apiWithKey.error = error.message;
      console.log(`${colors.red}✗ Failed${colors.reset}`);
      console.log(`  Error: ${error.message}`);
    }
  }
  
  // Overall diagnosis
  console.log(`\n${colors.bright}${colors.blue}Diagnosis:${colors.reset}`);
  
  if (results.apiNoAuth.success) {
    console.log(`${colors.green}✓ Sheet is fully accessible without authentication${colors.reset}`);
    console.log(`  This is ideal for public sheets used in the AI context.`);
  } else if (results.publicUrl.success && apiKey && results.apiWithKey.success) {
    console.log(`${colors.green}✓ Sheet is accessible with API key${colors.reset}`);
    console.log(`  Your API key is working correctly.`);
  } else if (results.publicUrl.success) {
    console.log(`${colors.yellow}⚠ Sheet is accessible via public export URL only${colors.reset}`);
    console.log(`  This may work for basic access but could have limitations.`);
    console.log(`  Consider changing the sheet's sharing settings to "Anyone with the link can view".`);
  } else {
    console.log(`${colors.red}✗ Sheet is not accessible${colors.reset}`);
    console.log(`  Please check the following:`);
    console.log(`  1. The sheet ID is correct: ${sheetId}`);
    console.log(`  2. The sheet is shared publicly (Anyone with the link can view)`);
    console.log(`  3. If using an API key, ensure it has access to the Google Sheets API`);
  }
  
  // Help with sharing settings
  console.log(`\n${colors.bright}${colors.blue}Sharing help:${colors.reset}`);
  console.log(`To make your sheet publicly accessible:`);
  console.log(`1. Open the sheet in Google Sheets`);
  console.log(`2. Click the 'Share' button in the top right`);
  console.log(`3. Click 'Change to anyone with the link'`);
  console.log(`4. Ensure the permission is set to 'Viewer'`);
  console.log(`5. Click 'Done'`);
  
  // Check for .env.local file
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envLocalExists = fs.existsSync(envLocalPath);
  
  console.log(`\n${colors.bright}${colors.blue}Environment variables:${colors.reset}`);
  if (envLocalExists) {
    console.log(`${colors.green}✓ .env.local file exists${colors.reset}`);
    
    // Check if the sheet ID is in the .env.local file
    const envContents = fs.readFileSync(envLocalPath, 'utf-8');
    if (envContents.includes('NEXT_PUBLIC_GOOGLE_SHEET_ID')) {
      console.log(`${colors.green}✓ NEXT_PUBLIC_GOOGLE_SHEET_ID is set in .env.local${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ NEXT_PUBLIC_GOOGLE_SHEET_ID is not set in .env.local${colors.reset}`);
      console.log(`  Add the following line to .env.local:`);
      console.log(`  NEXT_PUBLIC_GOOGLE_SHEET_ID=${sheetId}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ .env.local file does not exist${colors.reset}`);
    console.log(`  Create a .env.local file with the following content:`);
    console.log(`  NEXT_PUBLIC_GOOGLE_SHEET_ID=${sheetId}`);
  }
}

runTests().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
}); 