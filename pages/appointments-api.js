import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';
import AppointmentCalendar from '../components/AppointmentCalendar';
import DemoCalendar from '../components/DemoCalendar';

function AppointmentsApi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [debugMode, setDebugMode] = useState(true); // Always show debug initially
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [useDemo, setUseDemo] = useState(false); // Try to use API by default
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  
  // Initialize page and handle API connection
  useEffect(() => {
    console.log('Appointments page: Initializing with API connection');
    setIsLoading(true);
    setLoadingError(null);
    
    // Check if demo mode is requested in URL
    const shouldUseDemo = router.query.demo === 'true';
    setUseDemo(shouldUseDemo);
    
    // Run API test on load
    testApiConnection();
    
    // Set a loading timeout to ensure UI doesn't stay in loading state indefinitely
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing calendar display');
        setIsLoading(false);
        if (!apiResponse) {
          setLoadingError('Loading timed out. Displaying demo calendar instead.');
          setUseDemo(true); // Fall back to demo mode if loading times out
        }
      }
    }, 5000); // 5 second timeout
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [router.pathname, router.query]);

  // Test API connectivity
  const testApiConnection = async () => {
    setLoadingTest(true);
    try {
      // Force a timestamp to bypass cache
      const timestamp = new Date().getTime();
      console.log('Testing API connection to /api/sessions...');
      
      const response = await fetch(`/api/sessions?t=${timestamp}`);
      const status = response.status;
      let data;
      
      try {
        data = await response.json();
      } catch (e) {
        // If it's not JSON, try to get the text
        try {
          data = await response.text();
        } catch (textError) {
          // If we can't even get text, just use the status
          data = `Response status: ${response.status}`;
        }
      }
      
      console.log('API response status:', status);
      if (status >= 200 && status < 300) {
        console.log('API connected successfully');
      } else {
        console.error('API response error:', status, data);
      }
      
      setApiResponse({
        status,
        data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString()
      });

      // If API connection was successful, mark loading as complete
      setIsLoading(false);
    } catch (error) {
      console.error('API connection failed:', error.message);
      
      // Detect specific error types for better error messages
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: The API server may be down or unreachable.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Data format error: The API returned an invalid response format.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout error: The API request took too long to respond.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error: Cross-origin request blocked. Check API server configuration.';
      }
      
      setApiResponse({
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      });
      
      // If API connection failed, mark loading as complete and switch to demo mode
      setIsLoading(false);
      setLoadingError(`API connection error: ${errorMessage}. Displaying demo calendar instead.`);
      setUseDemo(true);
    } finally {
      setLoadingTest(false);
    }
  };

  // Manual refresh function
  const refreshCalendar = () => {
    setIsLoading(true);
    setLoadingError(null);
    testApiConnection();
  };

  return (
    <Layout>
      <Head>
        <title>Appointments (API) | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Appointments (API Mode)</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              {debugMode ? 'Hide Debug' : 'Show Debug'}
            </button>
            
            <button
              onClick={testApiConnection}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              disabled={loadingTest}
            >
              {loadingTest ? 'Testing...' : 'Test API'}
            </button>
            
            <button
              onClick={() => setUseDemo(!useDemo)}
              className={`px-3 py-1 text-white text-sm rounded flex items-center ${useDemo ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {useDemo ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Using Demo Data
                </>
              ) : 'Use Demo Data'}
            </button>
            
            <button
              onClick={refreshCalendar}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/appointments-api?t=${Date.now()}`;
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Hard Reload
            </button>
          </div>
        </div>
        
        {/* API mode banner */}
        {!useDemo && (
          <div className="mb-6 p-4 bg-blue-800 bg-opacity-50 rounded-md text-blue-200 border border-blue-700">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">API Mode Active</p>
            </div>
            <p className="text-sm mt-1">
              Showing real appointment data from the Neon database. This requires a working database connection.
            </p>
          </div>
        )}
        
        {/* Demo mode banner */}
        {useDemo && (
          <div className="mb-6 p-4 bg-green-800 bg-opacity-50 rounded-md text-green-200 border border-green-700">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="font-medium">Demo Mode Active</p>
            </div>
            <p className="text-sm mt-1">
              Showing sample appointment data. This allows you to view the calendar even if the database connection is not working.
            </p>
          </div>
        )}
        
        {/* Loading error notification */}
        {loadingError && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-md text-red-200 border border-red-700">
            <p className="font-medium">⚠️ {loadingError}</p>
            <p className="text-sm mt-1">
              The calendar is displaying in demo mode to ensure you can see appointments.
              <button 
                onClick={refreshCalendar}
                className="ml-2 underline hover:text-white"
              >
                Try Again
              </button>
            </p>
          </div>
        )}
        
        {/* Debug Panel */}
        {debugMode && (
          <div className="mb-6 p-4 bg-gray-800 rounded-md">
            <h2 className="text-lg font-semibold text-white mb-3">Debug Information</h2>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="text-blue-400 font-medium mb-2">Environment</h3>
                <div className="text-gray-300">
                  <p>Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}</p>
                  <p>Path: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</p>
                  <p>Query: {JSON.stringify(router.query)}</p>
                  <p>User: {user ? user.email : 'Not logged in'}</p>
                  <p>Mode: {useDemo ? 'Demo Data' : 'API Data'}</p>
                  <p>Updated: March 5, 2025</p>
                  <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                  <p>Browser: {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) + '...' : 'SSR'}</p>
                </div>
              </div>
              
              <div className="bg-gray-700 p-3 rounded">
                <h3 className="text-blue-400 font-medium mb-2">API Test Results</h3>
                {apiResponse ? (
                  <div className="text-gray-300">
                    <p>Status: <span className={apiResponse.status >= 200 && apiResponse.status < 300 ? 'text-green-400' : 'text-red-400'}>
                      {apiResponse.status || 'Error'}
                    </span></p>
                    <p>Time: {apiResponse.timestamp}</p>
                    {apiResponse.error && (
                      <p className="text-red-400">Error: {apiResponse.error}</p>
                    )}
                    {apiResponse.data && (
                      <div className="mt-2">
                        <p className="mb-1">Response:</p>
                        <pre className="bg-gray-900 p-2 rounded text-xs overflow-auto max-h-40">
                          {typeof apiResponse.data === 'string' 
                            ? apiResponse.data.substring(0, 500) 
                            : JSON.stringify(apiResponse.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">No test run yet</p>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              <p>Note: If appointments are not displaying, try these steps:</p>
              <ol className="list-decimal ml-5 mt-1">
                <li>Check API connection with the Test API button</li>
                <li>Ensure you're logged in or using demo mode</li>
                <li>Try clearing your browser cache</li>
                <li>Use the demo data toggle to use a hardcoded calendar</li>
                <li>Click the Refresh button to reload the calendar</li>
              </ol>
            </div>
          </div>
        )}
        
        {/* Main Calendar - conditionally render based on loading state */}
        <div className="bg-gray-800 rounded-lg overflow-hidden min-h-[600px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-300 text-lg">Loading appointments...</p>
                <p className="text-gray-400 text-sm mt-2">This shouldn't take long. If it does, the calendar will automatically switch to demo mode.</p>
                <p className="text-gray-400 text-sm mt-1">
                  If you see this message for more than 5 seconds, try clicking the 
                  <span className="text-red-400 font-medium"> Hard Reload </span> 
                  button above.
                </p>
              </div>
            </div>
          ) : (
            useDemo ? (
              <DemoCalendar 
                onSessionClick={(session) => router.push(`/sessions/${session.id || 1}`)}
                onDateSelect={(start, end) => router.push(`/appointments/new?start=${start.toISOString()}&end=${end.toISOString()}`)}
              />
            ) : (
              <AppointmentCalendar 
                onSessionClick={(session) => router.push(`/sessions/${session.id}`)}
                onDateSelect={(start, end) => router.push(`/appointments/new?start=${start.toISOString()}&end=${end.toISOString()}`)}
              />
            )
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AppointmentsApi); 