import { useState, useEffect } from 'react';

/**
 * GoogleSheetContext component loads and formats Google Sheets data
 * to be used as context for the AI Assistant
 */
const GoogleSheetContext = ({ 
  enabled = true,
  includeInAssistant = true,
  sheetId = null
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetsData, setSheetsData] = useState(null);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [formattedContext, setFormattedContext] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Fetch Google Sheets data
  const fetchSheetData = async (id) => {
    if (!id || !enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('GoogleSheetContext: Fetching sheet data...', id);
      
      // Add cache busting to prevent stale data
      const cacheBuster = new Date().getTime();
      const response = await fetch(`/api/google-sheets?id=${id}&t=${cacheBuster}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch (e) {
          // If not JSON, use as plain text
          errorMessage = errorText;
        }
        
        throw new Error(`Failed to fetch Google Sheets data (${response.status}): ${errorMessage}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('GoogleSheetContext: Successfully fetched sheet data');
        setSheetsData(data);
        
        // Get available sheets from the data
        const sheets = data.sheets.map(sheet => ({
          id: sheet.id,
          title: sheet.title,
          display: true // Default to display all sheets
        }));
        
        // Check if we have saved display preferences
        if (typeof window !== 'undefined') {
          const savedPrefs = localStorage.getItem('sheetDisplayPreferences');
          if (savedPrefs) {
            try {
              const parsedPrefs = JSON.parse(savedPrefs);
              // Apply saved preferences
              for (const sheet of sheets) {
                const savedPref = parsedPrefs.find(pref => pref.title === sheet.title);
                if (savedPref) {
                  sheet.display = savedPref.display;
                }
              }
            } catch (error) {
              console.error('Error parsing saved sheet preferences:', error);
            }
          }
        }
        
        setAvailableSheets(sheets);
        
        // Format the data for AI context
        formatDataForContext(data, sheets);
        
        // Reset retry count on success
        setRetryCount(0);
      } else {
        throw new Error(data.error || 'Failed to load Google Sheet data');
      }
    } catch (error) {
      console.error('GoogleSheetContext: Error fetching Google Sheets data:', error);
      setError(error.message);
      
      // If we haven't exceeded max retries, schedule a retry
      if (retryCount < 3) {
        console.log(`GoogleSheetContext: Retrying (${retryCount + 1}/3) in 2 seconds...`);
        setTimeout(() => {
          setRetryCount(prevCount => prevCount + 1);
          fetchSheetData(id);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Format the sheets data into text context for the AI
  const formatDataForContext = (data, sheets) => {
    if (!data || !data.data) return;
    
    // Only include sheets that are marked for display
    const enabledSheets = sheets.filter(sheet => sheet.display);
    if (enabledSheets.length === 0) {
      setFormattedContext('');
      return;
    }
    
    let context = '--- GOOGLE SHEETS REFERENCE DATA ---\n\n';
    
    // Add each enabled sheet to the context
    for (const sheet of enabledSheets) {
      const sheetData = data.data[sheet.title];
      if (!sheetData || !sheetData.headers || sheetData.headers.length === 0) {
        console.log(`Skipping sheet ${sheet.title} - no data or headers`);
        continue;
      }
      
      context += `## ${sheet.title}\n\n`;
      
      // Create a table header
      const headers = sheetData.headers;
      context += headers.join(' | ') + '\n';
      context += headers.map(() => '---').join(' | ') + '\n';
      
      // Add rows (limit to a reasonable number to avoid token limits)
      const maxRows = 20; // Limit to 20 rows per sheet to manage context size
      const rowsToInclude = Math.min(sheetData.data.length, maxRows);
      
      for (let i = 0; i < rowsToInclude; i++) {
        const row = sheetData.data[i];
        const rowValues = headers.map(header => row[header] || '');
        context += rowValues.join(' | ') + '\n';
      }
      
      // Add indication if there are more rows
      if (sheetData.data.length > maxRows) {
        context += `\n_Note: Only showing ${maxRows} of ${sheetData.data.length} available rows._\n`;
      }
      
      context += '\n\n';
    }
    
    context += '--- END OF REFERENCE DATA ---\n\n';
    
    // Instructions for the AI on how to use this data
    context += 'Instructions for using the above reference data:\n';
    context += '1. Reference this data when responding to user queries related to the topics covered.\n';
    context += '2. Cite the specific sheet when providing information from this data.\n';
    context += '3. Do not fabricate or extrapolate beyond what is directly stated in the data.\n';
    
    console.log('GoogleSheetContext: Formatted context for AI with data from sheets:', enabledSheets.map(s => s.title).join(', '));
    setFormattedContext(context);
  };
  
  // Load on component mount or when sheetId changes
  useEffect(() => {
    if (enabled && sheetId) {
      console.log('GoogleSheetContext: Loading with provided sheet ID:', sheetId);
      fetchSheetData(sheetId);
    }
  }, [enabled, sheetId, retryCount]);
  
  // Also load from .env or localStorage if no sheetId provided
  useEffect(() => {
    if (enabled && !sheetId && typeof window !== 'undefined') {
      const envSheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '16BxY67QqOE-CDOhF9GiUkESRuAyYt4TI641Zpu32qIc';
      
      if (envSheetId) {
        console.log('GoogleSheetContext: Loading with env sheet ID:', envSheetId);
        fetchSheetData(envSheetId);
      }
    }
  }, [enabled, sheetId, retryCount]);
  
  // Return a status component that can be used for debugging
  const renderStatusComponent = () => {
    if (loading) {
      return <div className="text-xs text-yellow-500">Loading Google Sheets data...</div>;
    }
    if (error) {
      return <div className="text-xs text-red-500">Error: {error}</div>;
    }
    if (sheetsData) {
      return (
        <div className="text-xs text-green-500">
          Loaded {sheetsData.sheets.length} sheets with {availableSheets.filter(s => s.display).length} enabled
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="google-sheet-context">
      {/* This component doesn't render anything visible normally,
          but we include a hidden debug element */}
      {includeInAssistant && (
        <div data-ai-context={formattedContext} className="hidden" />
      )}
      
      {/* Optional status component for debugging */}
      <div className="hidden">
        {renderStatusComponent()}
      </div>
    </div>
  );
};

export default GoogleSheetContext; 