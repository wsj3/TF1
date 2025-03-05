import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';
import AppointmentCalendar from '../components/AppointmentCalendar';
import DemoCalendar from '../components/DemoCalendar';
import { useRouter } from 'next/router';
import Head from 'next/head';

function Appointments() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [debugMode, setDebugMode] = useState(true); // Always show debug initially
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [useDemo, setUseDemo] = useState(true); // Always use demo mode by default
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  // Reset state on route change or when path includes appointments
  useEffect(() => {
    // Function to initialize or reset the page state
    const initPage = () => {
      console.log('Appointments page: Initializing/Resetting state');
      setIsLoading(true);
      setLoadingError(null);
      
      // Check if we're on staging/vercel
      const isStaging = typeof window !== 'undefined' && 
                       (window.location.hostname.includes('staging') || 
                        window.location.hostname.includes('vercel.app'));
      
      // Enable demo mode for staging or via query parameter
      const shouldUseDemo = isStaging || router.query.demo === 'true';
      setUseDemo(shouldUseDemo);
      
      if (isStaging && !router.query.demo) {
        console.log('Staging environment detected, enabling demo mode');
        router.push({
          pathname: router.pathname,
          query: { ...router.query, demo: 'true', t: Date.now() }
        }, undefined, { shallow: true });
      }
      
      // Run API test
      testApiConnection();
    };
    
    // Initialize on first load
    initPage();
    
    // Set up route change handlers to reinitialize on navigation
    const handleRouteChangeStart = (url) => {
      if (url.includes('/appointments') && !url.includes('/appointments/')) {
        console.log('Appointments navigation detected, resetting state');
        setIsLoading(true);
      }
    };
    
    const handleRouteChangeComplete = (url) => {
      if (url.includes('/appointments') && !url.includes('/appointments/')) {
        console.log('Appointments navigation completed, refreshing data');
        initPage();
      }
    };
    
    // Listen for route changes
    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    // Set a loading timeout to ensure UI doesn't stay in loading state indefinitely
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing calendar display');
        setIsLoading(false);
        if (!apiResponse) {
          setLoadingError('Loading timed out. Displaying demo calendar instead.');
          setUseDemo(true);
        }
      }
    }, 3000); // 3 second timeout
    
    return () => {
      // Clean up all event listeners and timeouts
      clearTimeout(loadingTimeout);
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.pathname, router.query]); // Re-run when pathname or query changes

  // Test API connectivity
  const testApiConnection = async () => {
    setLoadingTest(true);
    try {
      // Force a timestamp to bypass cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/sessions?demo=true&t=${timestamp}`);
      const status = response.status;
      let data;
      
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
      
      setApiResponse({
        status,
        data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString()
      });

      // If API connection was successful, mark loading as complete
      setIsLoading(false);
    } catch (error) {
      setApiResponse({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // If API connection failed, mark loading as complete and switch to demo mode
      setIsLoading(false);
      setLoadingError('API connection error: ' + error.message + '. Displaying demo calendar instead.');
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
        <title>Appointments | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          
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
              className={`px-3 py-1 text-white text-sm rounded ${useDemo ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {useDemo ? 'Using Demo Data' : 'Use API Data'}
            </button>
            
            <button
              onClick={refreshCalendar}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/appointments?t=${Date.now()}`;
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Hard Reload
            </button>
          </div>
        </div>
        
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
                  If you see this message for more than 3 seconds, try clicking the 
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

export default withAuth(Appointments); 