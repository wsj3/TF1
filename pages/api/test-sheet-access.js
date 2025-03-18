/**
 * Test if a Google Sheet is accessible via different methods
 * Returns details about the accessibility status
 */

import { google } from 'googleapis';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Helper function to get sheet names from the HTML of the Google Sheet
async function getSheetNamesFromHTML(spreadsheetId) {
  try {
    console.log('Attempting to get sheet names from HTML...');
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
            console.warn('Error parsing sheet names from script:', e);
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
      console.log('Could not extract real sheet names, using defaults:', defaultNames);
      return { names: defaultNames, areDefault: true };
    } else {
      console.log('Found actual sheet names from HTML:', sheetNames);
      return { names: sheetNames, areDefault: false };
    }
  } catch (error) {
    console.error('Error getting sheet names from HTML:', error);
    // Fallback to default sheet names but mark them as defaults
    return { names: ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4'], areDefault: true };
  }
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get spreadsheet ID from query params
  const spreadsheetId = req.query.id;
  
  if (!spreadsheetId) {
    return res.status(400).json({
      success: false,
      message: 'Missing spreadsheet ID',
      help: 'Provide a valid Google Sheet ID in the "id" query parameter'
    });
  }
  
  try {
    // Test methods in sequence
    const results = {
      success: false,
      message: 'Testing sheet accessibility...',
      methods: {}
    };
    
    // Try to get sheet names from HTML first
    let sheetNamesInfo = { names: [], areDefault: true };
    try {
      sheetNamesInfo = await getSheetNamesFromHTML(spreadsheetId);
      if (sheetNamesInfo.names.length > 0) {
        results.methods.html = {
          success: true,
          message: `Found ${sheetNamesInfo.names.length} sheets in HTML`,
          sheetNames: sheetNamesInfo.names,
          usingDefaults: sheetNamesInfo.areDefault
        };
      }
    } catch (htmlError) {
      results.methods.html = {
        success: false,
        message: htmlError.message
      };
    }
    
    // Method 1: Try to access via public export URL
    try {
      console.log('Testing accessibility via public export URL...');
      
      let publicUrlSuccessCount = 0;
      const publicUrlResults = [];
      
      // Try to access each sheet via public export URL
      for (const sheetName of sheetNamesInfo.names.length > 0 ? sheetNamesInfo.names : ['Sheet1']) {
        try {
          // Test via public export URL
          const publicUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
          const publicResponse = await fetch(publicUrl);
          
          if (!publicResponse.ok) {
            publicUrlResults.push({
              sheetName,
              success: false,
              status: publicResponse.status,
              message: `Failed to access ${sheetName} via public export URL: ${publicResponse.status}`
            });
            continue;
          }
          
          const text = await publicResponse.text();
          
          // Check if response looks like valid data
          if (text.includes('{') && text.includes('}') && text.includes('table')) {
            publicUrlSuccessCount++;
            publicUrlResults.push({
              sheetName,
              success: true,
              message: `Successfully accessed ${sheetName} via public export URL`
            });
            
            // Try to get row count
            try {
              const jsonStartIndex = text.indexOf('{');
              const jsonEndIndex = text.lastIndexOf('}') + 1;
              const jsonString = text.substring(jsonStartIndex, jsonEndIndex);
              const data = JSON.parse(jsonString);
              
              if (data.table && data.table.rows) {
                publicUrlResults[publicUrlResults.length - 1].rowCount = 
                  data.table.rows.length > 0 ? data.table.rows.length - 1 : 0; // Exclude header row
              }
            } catch (parseError) {
              console.warn(`Could not parse row count for ${sheetName}:`, parseError.message);
            }
          } else {
            publicUrlResults.push({
              sheetName,
              success: false,
              message: `Invalid response format for ${sheetName} from public export URL`
            });
          }
        } catch (sheetError) {
          publicUrlResults.push({
            sheetName,
            success: false,
            message: `Error accessing ${sheetName}: ${sheetError.message}`
          });
        }
      }
      
      results.methods.public_export = {
        success: publicUrlSuccessCount > 0,
        message: publicUrlSuccessCount > 0 
          ? `Successfully accessed ${publicUrlSuccessCount} sheets via public export URL`
          : 'Failed to access any sheets via public export URL',
        sheetsResults: publicUrlResults
      };
    } catch (error) {
      results.methods.public_export = {
        success: false,
        message: error.message
      };
    }
    
    // Method 2: Try to access via Google Sheets API
    try {
      console.log('Testing accessibility via Google Sheets API...');
      
      // Initialize the API client
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
      const sheets = google.sheets({
        version: 'v4',
        auth: apiKey
      });
      
      // Try to get metadata about the spreadsheet
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId
      });
      
      if (metadata && metadata.data) {
        results.methods.api = {
          success: true,
          message: 'Successfully accessed via Google Sheets API',
          sheetCount: metadata.data.sheets?.length || 0,
          sheetTitles: metadata.data.sheets?.map(s => s.properties.title) || []
        };
        
        if (metadata.data.sheets && metadata.data.sheets.length > 0) {
          results.methods.api.sheetTitle = metadata.data.sheets[0].properties.title;
        }
      } else {
        results.methods.api = {
          success: false,
          message: 'Failed to retrieve sheet metadata'
        };
      }
    } catch (error) {
      results.methods.api = {
        success: false,
        message: error.message
      };
    }
    
    // Determine overall success based on the methods that worked
    const htmlSuccess = results.methods.html?.success || false;
    const publicExportSuccess = results.methods.public_export?.success || false;
    const apiSuccess = results.methods.api?.success || false;
    
    if (htmlSuccess || publicExportSuccess || apiSuccess) {
      results.success = true;
      
      // Determine the primary method
      if (apiSuccess) {
        results.method = 'api';
        results.message = 'Sheet is accessible via Google Sheets API';
        results.sheetCount = results.methods.api.sheetCount;
        results.sheetTitles = results.methods.api.sheetTitles;
        results.useDefaultNames = false;
      } else if (publicExportSuccess) {
        results.method = 'public_export';
        results.message = 'Sheet is publicly accessible via export URL';
        
        // Get sheet titles from the public export results
        results.sheetTitles = results.methods.public_export.sheetsResults
          .filter(r => r.success)
          .map(r => r.sheetName);
        results.sheetCount = results.sheetTitles.length;
        results.useDefaultNames = sheetNamesInfo.areDefault;
        
        if (!apiSuccess) {
          results.note = 'API access failed but public export works - check sharing settings';
        }
      } else {
        results.method = 'html';
        results.message = 'Sheet structure detected via HTML parsing';
        results.sheetTitles = results.methods.html.sheetNames;
        results.sheetCount = results.sheetTitles.length;
        results.useDefaultNames = sheetNamesInfo.areDefault;
        results.note = 'Could not access sheet data - check sharing settings';
      }
    } else {
      results.success = false;
      results.message = 'Failed to access Google Sheet via any method';
      results.help = 'Make sure the sheet exists and is properly shared. For public access, set sharing to "Anyone with the link can view".';
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error testing sheet accessibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing sheet accessibility',
      error: error.message
    });
  }
} 