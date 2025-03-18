import { google } from 'googleapis';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

/**
 * Simple diagnostic API for testing Google Sheets access
 * This provides more direct information about what's happening
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const result = {
    timestamp: new Date().toISOString(),
    diagnostics: [],
    errors: [],
    sheetNames: [],
    data: {}
  };
  
  try {
    // Get the spreadsheet ID
    const spreadsheetId = req.query.id || process.env.GOOGLE_SHEET_ID || '16BxY67QqOE-CDOhF9GiUkESRuAyYt4TI641Zpu32qIc';
    result.spreadsheetId = spreadsheetId;
    result.diagnostics.push(`Using spreadsheet ID: ${spreadsheetId}`);
    
    // TEST 1: Try to directly open the public Google Sheet URL to see if it exists
    result.diagnostics.push('TEST 1: Testing direct sheet access...');
    try {
      const publicSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      const response = await fetch(publicSheetUrl);
      
      result.diagnostics.push(`Public sheet URL status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        result.diagnostics.push('Sheet appears to exist and be accessible publicly');
        
        // Try to extract sheet names from HTML
        const html = await response.text();
        result.htmlSize = html.length;
        result.diagnostics.push(`HTML response size: ${html.length} bytes`);
        
        // Extract sheet names from HTML
        const $ = cheerio.load(html);
        const foundSheetNames = [];
        
        // Look for sheet tab elements
        $('script').each((i, elem) => {
          const text = $(elem).html() || '';
          if (text.includes('_docs_flag_initialData')) {
            result.diagnostics.push('Found Google Docs initialization data');
            // Try to extract sheet names from the script
            try {
              const matches = text.match(/\"sheets\"\s*:\s*(\[.*?\])/);
              if (matches && matches[1]) {
                let sheetsData;
                try {
                  sheetsData = JSON.parse(matches[1].replace(/\\u003d/g, '='));
                  result.diagnostics.push(`Found ${sheetsData.length} sheets in script data`);
                  sheetsData.forEach(sheet => {
                    if (sheet.name) {
                      foundSheetNames.push(sheet.name);
                    }
                  });
                } catch (jsonError) {
                  result.errors.push(`Error parsing sheets JSON: ${jsonError.message}`);
                }
              }
            } catch (scriptError) {
              result.errors.push(`Error parsing script: ${scriptError.message}`);
            }
          }
        });
        
        // If we found sheet names, add them
        if (foundSheetNames.length > 0) {
          result.diagnostics.push(`Found ${foundSheetNames.length} sheet names in HTML: ${foundSheetNames.join(', ')}`);
          result.sheetNames = [...foundSheetNames];
        } else {
          // Look for sheet tabs in HTML structure
          let tabElements = [];
          
          // Try different selectors that might contain sheet tabs
          const possibleSelectors = [
            '[role="tab"]',
            '.waffle-sheet-tab',
            '.docs-sheet-tab'
          ];
          
          for (const selector of possibleSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              result.diagnostics.push(`Found ${elements.length} potential sheet tabs with selector ${selector}`);
              elements.each((i, elem) => {
                const tabName = $(elem).text().trim();
                if (tabName && !tabName.includes('Add sheet')) {
                  tabElements.push(tabName);
                }
              });
            }
          }
          
          if (tabElements.length > 0) {
            result.diagnostics.push(`Found ${tabElements.length} sheet tabs in HTML: ${tabElements.join(', ')}`);
            result.sheetNames = [...tabElements];
          } else {
            result.diagnostics.push('Could not find sheet names in HTML, using default names');
            result.sheetNames = ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4'];
          }
        }
      } else {
        result.errors.push(`Sheet not accessible via public URL: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      result.errors.push(`Error accessing sheet URL: ${error.message}`);
    }
    
    // TEST 2: Try to access via Google Sheets API
    result.diagnostics.push('TEST 2: Testing Google Sheets API access...');
    try {
      // Get API key from environment variables
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
      
      if (!apiKey) {
        result.errors.push('No Google API key found in environment variables');
      } else {
        result.diagnostics.push(`Using API key: ${apiKey.substring(0, 5)}...`);
        
        // Initialize the Google Sheets API client
        const sheets = google.sheets({
          version: 'v4',
          auth: apiKey
        });
        
        // Try to get metadata
        const metadata = await sheets.spreadsheets.get({
          spreadsheetId
        });
        
        if (metadata?.data?.sheets) {
          const apiSheetNames = metadata.data.sheets.map(sheet => sheet.properties.title);
          result.diagnostics.push(`API found ${apiSheetNames.length} sheets: ${apiSheetNames.join(', ')}`);
          
          // If we didn't find sheet names earlier, use these
          if (result.sheetNames.length === 0 || (result.sheetNames.length === 4 && result.sheetNames[0] === 'Sheet1')) {
            result.sheetNames = apiSheetNames;
          }
          
          // Try to get first sheet data as a test
          if (apiSheetNames.length > 0) {
            const firstSheet = apiSheetNames[0];
            result.diagnostics.push(`Trying to fetch data from first sheet: ${firstSheet}`);
            
            const sheetData = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: firstSheet
            });
            
            if (sheetData?.data?.values) {
              const rows = sheetData.data.values;
              result.diagnostics.push(`Successfully retrieved ${rows.length} rows from sheet "${firstSheet}"`);
              
              // Get first few rows as sample
              const sampleData = rows.slice(0, 3);
              result.data[firstSheet] = {
                rowCount: rows.length,
                sample: sampleData
              };
            } else {
              result.errors.push(`No data found in sheet "${firstSheet}"`);
            }
          }
        } else {
          result.errors.push('Could not retrieve sheet metadata via API');
        }
      }
    } catch (apiError) {
      result.errors.push(`API error: ${apiError.message}`);
    }
    
    // TEST 3: Try public export URL approach
    result.diagnostics.push('TEST 3: Testing public export URL approach...');
    try {
      // Try for each sheet name we found
      for (const sheetName of result.sheetNames.length > 0 ? result.sheetNames : ['Sheet1']) {
        result.diagnostics.push(`Testing export URL for sheet: ${sheetName}`);
        
        const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(exportUrl);
        
        result.diagnostics.push(`Export URL status for "${sheetName}": ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const text = await response.text();
          
          // Check for valid data format
          if (text.includes('{') && text.includes('}') && text.includes('table')) {
            result.diagnostics.push(`Successfully retrieved data for sheet "${sheetName}" via export URL`);
            
            // Try to parse the data
            try {
              const jsonStartIndex = text.indexOf('{');
              const jsonEndIndex = text.lastIndexOf('}') + 1;
              const jsonString = text.substring(jsonStartIndex, jsonEndIndex);
              const data = JSON.parse(jsonString);
              
              if (data.table && data.table.rows) {
                const rowCount = data.table.rows.length;
                result.diagnostics.push(`Sheet "${sheetName}" has ${rowCount} rows`);
                
                // Only add if we don't already have data for this sheet
                if (!result.data[sheetName]) {
                  // Extract a sample of the data
                  const rows = data.table.rows;
                  const cols = data.table.cols || [];
                  
                  // Extract first row (headers)
                  const headers = rows.length > 0 
                    ? rows[0].c.map((cell, index) => (cell?.v || cols[index]?.label || `Column ${index + 1}`)) 
                    : [];
                  
                  // Get first few data rows as sample
                  const sampleRows = [];
                  for (let i = 1; i < Math.min(rows.length, 4); i++) {
                    const row = rows[i];
                    const rowData = {};
                    headers.forEach((header, index) => {
                      rowData[header] = row.c[index]?.v || '';
                    });
                    sampleRows.push(rowData);
                  }
                  
                  result.data[sheetName] = {
                    rowCount: rowCount - 1, // Exclude header row
                    sample: sampleRows
                  };
                }
              }
            } catch (parseError) {
              result.errors.push(`Error parsing export data for "${sheetName}": ${parseError.message}`);
            }
          } else {
            result.errors.push(`Invalid data format from export URL for "${sheetName}"`);
          }
        } else {
          result.errors.push(`Export URL failed for "${sheetName}": ${response.status} ${response.statusText}`);
        }
      }
    } catch (exportError) {
      result.errors.push(`Export URL error: ${exportError.message}`);
    }
    
    // Conclusion
    if (result.sheetNames.length > 0) {
      result.diagnostics.push(`Final sheet names: ${result.sheetNames.join(', ')}`);
      result.success = true;
    } else {
      result.diagnostics.push('Could not determine sheet names from any method');
      result.success = false;
    }
    
    return res.status(200).json(result);
  } catch (error) {
    result.errors.push(`Unexpected error: ${error.message}`);
    result.success = false;
    return res.status(500).json(result);
  }
} 