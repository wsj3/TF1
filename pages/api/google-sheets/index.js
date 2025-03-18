/**
 * API endpoint for fetching data from Google Sheets
 * 
 * This API loads data from the configured Google Sheet
 * and returns it in a structured format for the AI Assistant to use
 */

import { google } from 'googleapis';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import axios from 'axios';

// Detailed logging utility for debugging
const logger = {
  debug: (message, ...args) => {
    console.log(`[SHEETS-DEBUG] ${message}`, ...args);
  },
  info: (message, ...args) => {
    console.log(`[SHEETS-INFO] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[SHEETS-WARN] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[SHEETS-ERROR] ${message}`, ...args);
  },
  logRequestDetails: (url, response) => {
    logger.info(`Request to: ${url}`);
    logger.info(`Status: ${response?.status}`);
    logger.info(`Headers: ${JSON.stringify(response?.headers?.toJSON?.() || {})}`);
  }
};

// Initialize the sheets API client with authentication
async function getSheetClient() {
  try {
    // Try to use API key from environment variables
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
    
    if (!apiKey) {
      logger.warn('No Google API key found in environment variables');
    } else {
      logger.info('Using Google API key from environment variables');
    }
    
    const sheets = google.sheets({
      version: 'v4',
      auth: apiKey
    });
    
    return sheets;
  } catch (error) {
    logger.error('Error initializing Google Sheets client:', error);
    throw error;
  }
}

// Helper function to get sheet names from the HTML of the Google Sheet
async function getSheetNamesFromHTML(spreadsheetId) {
  try {
    logger.info('Attempting to get sheet names from HTML...');
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to access sheet HTML: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract sheet names from the HTML
    const sheetNames = [];
    let foundRealNames = false;
    
    // Sheet names are often stored in elements with specific attributes
    // Look for elements that might contain sheet names
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html();
      if (scriptContent && scriptContent.includes('_docs_flag_initialData')) {
        // Parse the script content to extract sheet names
        const match = scriptContent.match(/\"sheets\"\s*:\s*(\[.*?\])/);
        if (match && match[1]) {
          try {
            // Try to parse the JSON array of sheets
            const sheetsData = JSON.parse(match[1].replace(/\\u003d/g, '='));
            sheetsData.forEach(sheet => {
              if (sheet.name) {
                sheetNames.push(sheet.name);
                foundRealNames = true;
              }
            });
          } catch (e) {
            logger.warn('Error parsing sheet names from script:', e);
          }
        }
      }
    });
    
    // If we couldn't extract from script, fallback to looking for sheet tab elements
    if (!foundRealNames) {
      // Look for elements that might be sheet tabs
      $('[role="tab"], .waffle-sheet-tab, .docs-sheet-tab').each((i, elem) => {
        const name = $(elem).text().trim();
        if (name && !name.includes('Add sheet') && !sheetNames.includes(name)) {
          sheetNames.push(name);
          foundRealNames = true;
        }
      });
    }
    
    // If we still couldn't find any, use default sheet names but mark them as defaults
    if (!foundRealNames) {
      const defaultNames = ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4'];
      logger.logRequestDetails(url, response);
      logger.info('Could not extract real sheet names, using defaults:', defaultNames);
      return { names: defaultNames, areDefault: true };
    } else {
      logger.info('Found actual sheet names from HTML:', sheetNames);
      return { names: sheetNames, areDefault: false };
    }
  } catch (error) {
    logger.error('Error getting sheet names from HTML:', error);
    // Fallback to default sheet names but mark them as defaults
    return { names: ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4'], areDefault: true };
  }
}

// After trying all methods to fetch real data, create dummy data for detected sheets
const createDummySheetData = (sheetNames) => {
  logger.info('Creating UNIQUE dummy data for sheets:', sheetNames);
  
  const result = {};
  const sheetList = [];
  
  // Create a structure for each sheet
  sheetNames.forEach((name, index) => {
    sheetList.push({
      id: index,
      title: name,
      index: index
    });
    
    // Create CLEARLY DIFFERENT dummy headers and data for each sheet
    let headers = [];
    let data = [];
    
    // Different data structures based on sheet name or position
    if (index === 0) { // First sheet - Compliance
      headers = ['Guideline', 'Description'];
      data = [
        { 'Guideline': 'Client Confidentiality', 'Description': 'Ensure all AI interactions comply with privacy laws' },
        { 'Guideline': 'Ethical Guidelines', 'Description': 'Align with professional ethical standards' },
        { 'Guideline': 'Service Accessibility', 'Description': 'Offer tools across various devices and platforms' }
      ];
    } else if (index === 1) { // Second sheet - Features
      headers = ['Feature', 'Status', 'Priority'];
      data = [
        { 'Feature': 'AI Response Accuracy', 'Status': 'Active', 'Priority': 'High' },
        { 'Feature': 'Session Recording', 'Status': 'In Development', 'Priority': 'Medium' },
        { 'Feature': 'Client Portal', 'Status': 'Planned', 'Priority': 'Low' }
      ];
    } else if (index === 2) { // Third sheet - Resources
      headers = ['Resource Type', 'URL', 'Notes'];
      data = [
        { 'Resource Type': 'Documentation', 'URL': 'https://docs.example.com', 'Notes': 'Official documentation' },
        { 'Resource Type': 'Training Videos', 'URL': 'https://training.example.com', 'Notes': 'Video tutorials' },
        { 'Resource Type': 'Support', 'URL': 'https://support.example.com', 'Notes': '24/7 support portal' }
      ];
    } else { // Fourth sheet and beyond - Configuration
      headers = ['Key', 'Value'];
      data = [
        { 'Key': 'Version', 'Value': '1.0.0' },
        { 'Key': 'Last Updated', 'Value': new Date().toISOString().split('T')[0] },
        { 'Key': 'Status', 'Value': 'Production' }
      ];
    }
    
    // Add a special field to make it obvious which sheet this is
    const identifier = `[THIS IS ${name.toUpperCase()} DATA]`;
    if (headers.length > 0 && data.length > 0) {
      // Add an identifier to the first data row's first column
      const firstKey = Object.keys(data[0])[0];
      data[0][firstKey] = identifier + " " + data[0][firstKey];
    }
    
    logger.info(`Created dummy data for sheet ${name} with unique identifier: ${identifier}`);
    
    result[name] = {
      headers,
      data,
      rowCount: data.length,
      isDummy: true
    };
  });
  
  return { sheetList, data: result };
};

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'Spreadsheet ID is required' });
  }

  try {
    logger.info('Handling Google Sheets request for ID:', id);

    // First, try to get sheet metadata using the API client (with API key)
    try {
      logger.info('Attempting to access sheets using Google API...');
      const sheetsClient = await getSheetClient();
      
      // Get sheet metadata to test if the API key works
      const metadataResponse = await sheetsClient.spreadsheets.get({
        spreadsheetId: id,
        // Only request minimal metadata to check access
        fields: 'spreadsheetId,properties,sheets.properties'
      });
      
      logger.info('Successfully retrieved sheet metadata via API');
      
      // If we get here, the API key is working
      // Now get sheet data via the public export URL (which is more reliable for reading data)
      const sheetsData = await getSheetDataUsingPublicExport(id);
      
      return res.status(200).json({
        success: true,
        sheets: sheetsData.sheets,
        data: sheetsData.data,
        access: true
      });
    } catch (apiError) {
      logger.error('Failed to get sheet metadata via API:', apiError.message);
      
      // If API access fails, try the public export URL directly
      logger.info('Falling back to public export URL method...');
      const sheetsData = await getSheetDataUsingPublicExport(id);
      
      return res.status(200).json({
        success: true,
        sheets: sheetsData.sheets,
        data: sheetsData.data,
        access: true
      });
    }
  } catch (error) {
    logger.error('All methods failed to access Google Sheet:', error);
    
    // As a last resort, get sheet names (even if we can't get data)
    try {
      const { names: sheetNames, areDefault } = await getSheetNamesFromHTML(id);
      
      if (!areDefault) {
        // If we found real sheet names but couldn't get data,
        // create dummy data with the real sheet names
        logger.info('Creating dummy data for real sheet names:', sheetNames);
        const { sheetList, data } = createDummySheetData(sheetNames);
        
        return res.status(200).json({
          success: true,
          sheets: sheetList,
          data,
          access: false,
          isDummy: true,
          message: 'Using placeholder data. The actual sheets from your Google Sheet couldn\'t be loaded. Please check the sharing settings.'
        });
      }
    } catch (e) {
      logger.error('Failed to get sheet names from HTML:', e);
    }
    
    // If all else fails, use completely generic dummy data
    logger.info('Using generic dummy data as last resort');
    const dummyData = generateDummyData();
    
    return res.status(200).json({
      success: true,
      sheets: dummyData.sheets,
      data: dummyData.data,
      access: false,
      isDummy: true,
      message: 'Using placeholder data. The actual sheets from your Google Sheet couldn\'t be loaded. Please check the sharing settings.'
    });
  }
}

// Function to get sheet data using the public export URL method
async function getSheetDataUsingPublicExport(spreadsheetId) {
  logger.info(`Attempting to access sheets using public export URL for ID: ${spreadsheetId}`);
  
  // First, try to get the list of sheet names using the "web view" of the spreadsheet
  const sheetNames = await getSheetNamesFromHtml(spreadsheetId);
  
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Could not retrieve sheet names');
  }
  
  // Create a result object
  const result = {
    sheets: [],
    data: {},
    access: true
  };
  
  // For each sheet, get the data
  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];
    const sheetId = i; // Use the index as a simple sheet ID
    
    // Add this sheet to the sheets list
    result.sheets.push({
      id: sheetId,
      title: sheetName,
    });
    
    // Get the data for this sheet
    const sheetData = await getSheetDataFromPublicExport(spreadsheetId, sheetName, i);
    
    // Add the data to our result
    result.data[sheetName] = sheetData;
  }
  
  return result;
}

// Function to get the list of sheet names from the HTML view of the spreadsheet
async function getSheetNamesFromHtml(spreadsheetId) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    logger.info(`Fetching sheet names from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to retrieve the sheet HTML view: ${response.status}`);
    }
    
    logger.info(`Got HTML response with status: ${response.status}`);
    
    // Look for sheet names in the HTML
    const html = response.data;
    const $ = cheerio.load(html);
    
    // First attempt: Look for sheet tabs directly
    let sheetNames = [];
    const tabSelectors = [
      '.docs-sheet-tab-name',
      '[role="tab"]',
      '.docs-sheet-tab',
      '.waffle-sheet-tab-name'
    ];
    
    for (const selector of tabSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        logger.info(`Found ${elements.length} elements with selector: ${selector}`);
        sheetNames = elements.map((i, el) => $(el).text().trim()).get();
        if (sheetNames.length > 0) {
          logger.info(`Extracted sheet names from tabs: ${sheetNames.join(', ')}`);
          return sheetNames;
        }
      }
    }
    
    // Second attempt: Parse from script tags
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      if (content.includes('_docs_flag_initialData') || content.includes('DOCS_modelChunk')) {
        // Look for sheet definitions
        const sheetDefMatches = content.match(/\[{"name":"([^"]+)".*?},{"name":"([^"]+)".*?}/g);
        if (sheetDefMatches) {
          const nameMatches = content.match(/"name":"([^"]+)"/g);
          if (nameMatches) {
            sheetNames = nameMatches.map(match => match.replace(/"name":"([^"]+)"/, '$1'));
            logger.info(`Extracted sheet names from script: ${sheetNames.join(', ')}`);
            return sheetNames;
          }
        }
      }
    });
    
    // Third attempt: Use the API directly with the public export URL
    if (sheetNames.length === 0) {
      logger.info('Attempting to get sheet names from export URL...');
      try {
        // This URL lists all sheets in a spreadsheet
        const tqxUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
        const tqxResponse = await axios.get(tqxUrl);
        
        if (tqxResponse.status === 200) {
          const tqxData = tqxResponse.data;
          // Look for sheet references in the response
          const matches = tqxData.match(/"name":"([^"]+)"/g);
          if (matches && matches.length > 0) {
            sheetNames = matches.map(match => match.replace(/"name":"/, '').replace(/"$/, ''));
            logger.info(`Extracted sheet names from export URL: ${sheetNames.join(', ')}`);
            return sheetNames;
          }
        }
      } catch (e) {
        logger.warn('Failed to get sheet names from export URL:', e.message);
      }
    }
    
    // Fourth attempt: Try to get the first sheet, then request the others
    if (sheetNames.length === 0) {
      logger.info('Attempting to discover sheets one by one...');
      const discoveredSheets = [];
      
      // Try several potential sheet names
      const potentialSheets = ['Sheet1', 'Sheet 1', 'Page1', 'Page 1', 'Tab1', 'Tab 1'];
      
      for (let i = 0; i < 10; i++) {
        const sheetIndex = i + 1;
        const potentialNames = [
          `Sheet${sheetIndex}`, 
          `Sheet ${sheetIndex}`, 
          `Page${sheetIndex}`, 
          `Page ${sheetIndex}`,
          `Tab${sheetIndex}`,
          `Tab ${sheetIndex}`
        ];
        
        // Try each potential name for this sheet
        for (const sheetName of potentialNames) {
          try {
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;
            const sheetResponse = await axios.get(sheetUrl);
            
            if (sheetResponse.status === 200 && !sheetResponse.data.includes('Invalid query')) {
              logger.info(`Found sheet at index ${sheetIndex}: ${sheetName}`);
              discoveredSheets.push(sheetName);
              break; // Found this sheet, move to next index
            }
          } catch (e) {
            // Just continue to next name
          }
        }
        
        // If we didn't find any sheet at this index, stop searching
        if (discoveredSheets.length < i + 1) {
          break;
        }
      }
      
      if (discoveredSheets.length > 0) {
        logger.info(`Discovered sheets: ${discoveredSheets.join(', ')}`);
        return discoveredSheets;
      }
    }
    
    // If we still have no sheet names, use default names
    if (sheetNames.length === 0) {
      logger.warn('Could not extract real sheet names, using defaults');
      return ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4'];
    }
    
    return sheetNames;
  } catch (error) {
    logger.error('Error getting sheet names from HTML:', error);
    // Fallback to default sheet names
    return ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4'];
  }
}

// Function to get the data for a specific sheet using the public export URL
async function getSheetDataFromPublicExport(spreadsheetId, sheetName, sheetIndex) {
  try {
    logger.info(`Getting data for sheet "${sheetName}" using public export URL...`);
    
    // Use the /gviz/tq endpoint to get the data in a JSON-like format
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to retrieve sheet data: ${response.status}`);
    }
    
    // Log the status code to debug
    logger.logRequestDetails(url, response);
    
    // The response is a weird JSON-like format that starts with "/*O_o*/" and ends with a semicolon
    // We need to extract the actual JSON part
    let jsonText = response.data;
    
    // Check if response is in the expected format and extract the JSON
    let parsedData;
    
    if (typeof jsonText === 'string') {
      // Handle the strange format from /gviz/tq endpoint
      if (jsonText.startsWith('/*O_o*/')) {
        jsonText = jsonText.substring(jsonText.indexOf('{'), jsonText.lastIndexOf('}') + 1);
        try {
          parsedData = JSON.parse(jsonText);
        } catch (e) {
          logger.error(`Failed to parse JSON from "${jsonText.substring(0, 100)}...": ${e.message}`);
          throw e;
        }
      } else if (jsonText.startsWith('{')) {
        // Handle regular JSON
        parsedData = JSON.parse(jsonText);
      } else {
        throw new Error(`Response is not in expected format: ${jsonText.substring(0, 100)}...`);
      }
    } else if (typeof jsonText === 'object') {
      // Response is already an object
      parsedData = jsonText;
    } else {
      throw new Error(`Unexpected response type: ${typeof jsonText}`);
    }
    
    // Ensure we have the expected table structure
    if (!parsedData.table) {
      logger.error('No table data found in response:', parsedData);
      throw new Error('No table data found in response');
    }
    
    // Extract the headers and rows
    const table = parsedData.table;
    
    // Handle missing cols array
    if (!table.cols || !Array.isArray(table.cols)) {
      logger.error('No columns found in table data:', table);
      throw new Error('No columns found in table data');
    }
    
    // Extract column headers
    const headers = table.cols.map((col, index) => {
      // Use the label if available, otherwise use the id, or default to a column number
      return col.label || col.id || `Column ${index + 1}`;
    }).filter(header => header.trim() !== ''); // Filter out empty headers
    
    // Process the rows
    const rows = [];
    if (table.rows && table.rows.length > 0) {
      table.rows.forEach((row, rowIndex) => {
        const rowData = {};
        
        // Process each cell in the row
        if (row.c) {
          // Each cell can contain v (value) and f (formatted value)
          row.c.forEach((cell, columnIndex) => {
            // Get the corresponding header or use a default
            const header = columnIndex < headers.length ? 
              headers[columnIndex] : 
              `Column ${columnIndex + 1}`;
            
            // Extract the actual value
            let value = '';
            if (cell) {
              // Prefer v (value) over f (formatted value)
              if (cell.v !== undefined) {
                value = cell.v;
              } else if (cell.f !== undefined) {
                value = cell.f;
              }
            }
            
            // Assign to the row object
            rowData[header] = value;
          });
          
          // Only add rows that have actual data (at least one non-empty cell)
          const hasData = Object.values(rowData).some(val => val !== '');
          if (hasData) {
            rows.push(rowData);
          }
        }
      });
    }
    
    logger.info(`Successfully processed data for sheet "${sheetName}": ${rows.length} rows, ${headers.length} columns`);
    
    // Return structured data for this sheet
    return {
      headers: headers,
      rows: rows,
      rowCount: rows.length,
      columnCount: headers.length
    };
  } catch (error) {
    logger.error(`Error getting data for sheet "${sheetName}":`, error);
    
    // Try alternative export format (CSV) as fallback
    try {
      logger.info(`Trying alternative CSV export for sheet "${sheetName}"...`);
      // Use direct CSV export - note: gid is the numeric ID of the sheet, which may be different from the index
      // We'll use the index as a fallback, but it might not be accurate
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetIndex}`;
      
      const response = await axios.get(csvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Failed to retrieve CSV data: ${response.status}`);
      }
      
      // Parse CSV data (simple implementation - assumes well-formed CSV)
      const csvText = response.data;
      if (!csvText || typeof csvText !== 'string') {
        throw new Error('Invalid CSV response');
      }
      
      const lines = csvText.split('\n');
      if (lines.length === 0) {
        throw new Error('Empty CSV response');
      }
      
      // Extract headers from the first line
      const headers = lines[0].split(',').map(h => {
        // Remove quotes and trim whitespace
        return h.trim().replace(/^"|"$/g, '').trim();
      }).filter(h => h !== ''); // Filter out empty headers
      
      const rows = [];
      // Process data rows (skip header row)
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // Split by comma but handle quoted values
        const rawValues = lines[i].split(',');
        const values = [];
        
        // Process each value, handling quotes
        let currentValue = '';
        let insideQuotes = false;
        
        for (let val of rawValues) {
          if (val.startsWith('"') && !insideQuotes) {
            insideQuotes = true;
            currentValue = val.substring(1);
          } else if (val.endsWith('"') && insideQuotes) {
            insideQuotes = false;
            currentValue += ',' + val.substring(0, val.length - 1);
            values.push(currentValue.trim());
            currentValue = '';
          } else if (insideQuotes) {
            currentValue += ',' + val;
          } else {
            values.push(val.replace(/^"|"$/g, '').trim());
          }
        }
        
        // Create a row object with header keys
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = index < values.length ? values[index] : '';
        });
        
        // Only add rows that have actual data
        const hasData = Object.values(rowData).some(val => val !== '');
        if (hasData) {
          rows.push(rowData);
        }
      }
      
      logger.info(`Successfully processed CSV data for sheet "${sheetName}": ${rows.length} rows, ${headers.length} columns`);
      
      return {
        headers: headers,
        rows: rows,
        rowCount: rows.length,
        columnCount: headers.length
      };
    } catch (csvError) {
      logger.error(`CSV fallback also failed for sheet "${sheetName}":`, csvError);
      
      // Try one more method - HTML table scraping
      try {
        logger.info(`Trying HTML table scraping for sheet "${sheetName}"...`);
        const htmlUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview?gid=${sheetIndex}`;
        
        const response = await axios.get(htmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.status !== 200) {
          throw new Error(`Failed to retrieve HTML data: ${response.status}`);
        }
        
        const $ = cheerio.load(response.data);
        const headers = [];
        const rows = [];
        
        // Find the table with data
        $('table').each((tableIndex, table) => {
          // Look for header row
          $(table).find('tr').each((rowIndex, row) => {
            if (rowIndex === 0) {
              // Header row
              $(row).find('th').each((colIndex, col) => {
                headers.push($(col).text().trim());
              });
              
              // If no th elements, try td for headers
              if (headers.length === 0) {
                $(row).find('td').each((colIndex, col) => {
                  headers.push($(col).text().trim());
                });
              }
            } else {
              // Data rows
              const rowData = {};
              $(row).find('td').each((colIndex, col) => {
                const header = colIndex < headers.length ? 
                  headers[colIndex] : 
                  `Column ${colIndex + 1}`;
                rowData[header] = $(col).text().trim();
              });
              
              // Only add rows with data
              const hasData = Object.values(rowData).some(val => val !== '');
              if (hasData) {
                rows.push(rowData);
              }
            }
          });
          
          // If we found data in this table, stop processing more tables
          if (headers.length > 0 && rows.length > 0) {
            return false;
          }
        });
        
        if (headers.length > 0 && rows.length > 0) {
          logger.info(`Successfully scraped HTML data for sheet "${sheetName}": ${rows.length} rows, ${headers.length} columns`);
          
          return {
            headers: headers,
            rows: rows,
            rowCount: rows.length,
            columnCount: headers.length
          };
        } else {
          throw new Error('No data found in HTML tables');
        }
      } catch (htmlError) {
        logger.error(`HTML scraping also failed for sheet "${sheetName}":`, htmlError);
        // Return a minimum structure to prevent errors
        return {
          headers: [],
          rows: [],
          rowCount: 0,
          columnCount: 0
        };
      }
    }
  }
}

// Function to generate dummy data when the actual sheet cannot be accessed
function generateDummyData() {
  return {
    sheets: [
      { id: 0, title: "Client Guidelines" },
      { id: 1, title: "Features Status" },
      { id: 2, title: "Resources" },
      { id: 3, title: "Settings" }
    ],
    data: {
      "Client Guidelines": {
        headers: ["Guideline", "Description", "Importance"],
        rows: [
          { "Guideline": "Confidentiality", "Description": "Always maintain client confidentiality", "Importance": "High" },
          { "Guideline": "Boundaries", "Description": "Maintain professional boundaries", "Importance": "High" },
          { "Guideline": "Documentation", "Description": "Keep accurate and timely records", "Importance": "Medium" },
          { "Guideline": "Informed Consent", "Description": "Ensure clients understand treatment", "Importance": "High" }
        ],
        rowCount: 4,
        columnCount: 3
      },
      "Features Status": {
        headers: ["Feature", "Status", "Priority", "Notes"],
        rows: [
          { "Feature": "Session Notes", "Status": "Completed", "Priority": "High", "Notes": "Core functionality" },
          { "Feature": "Client Portal", "Status": "In Progress", "Priority": "Medium", "Notes": "Expected completion Q2" },
          { "Feature": "Billing Integration", "Status": "Planned", "Priority": "Low", "Notes": "Depends on partner API" },
          { "Feature": "AI Assistant", "Status": "Beta", "Priority": "High", "Notes": "Currently in testing" }
        ],
        rowCount: 4,
        columnCount: 4
      },
      "Resources": {
        headers: ["Resource", "Type", "URL", "Description"],
        rows: [
          { "Resource": "Ethics Guide", "Type": "PDF", "URL": "https://example.com/ethics", "Description": "Professional ethics guidelines" },
          { "Resource": "Assessment Tools", "Type": "Website", "URL": "https://example.com/tools", "Description": "Clinical assessment resources" },
          { "Resource": "Research Journal", "Type": "Subscription", "URL": "https://example.com/journal", "Description": "Latest research articles" },
          { "Resource": "Training Videos", "Type": "Video", "URL": "https://example.com/videos", "Description": "Professional development" }
        ],
        rowCount: 4,
        columnCount: 4
      },
      "Settings": {
        headers: ["Setting", "Value", "Description", "Category"],
        rows: [
          { "Setting": "DarkMode", "Value": "true", "Description": "Enable dark theme", "Category": "UI" },
          { "Setting": "AutoSave", "Value": "5", "Description": "Auto-save every 5 minutes", "Category": "Data" },
          { "Setting": "Notifications", "Value": "true", "Description": "Enable notifications", "Category": "Communication" },
          { "Setting": "DataRetention", "Value": "7", "Description": "Keep data for 7 years", "Category": "Compliance" }
        ],
        rowCount: 4,
        columnCount: 4
      }
    }
  };
} 