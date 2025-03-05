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

  // Enable demo mode on staging automatically
  useEffect(() => {
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
    
    // Run API test automatically on load
    testApiConnection();
  }, [router]);

  // Test API connectivity
  const testApiConnection = async () => {
    setLoadingTest(true);
    try {
      const response = await fetch('/api/sessions?demo=true');
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
    } catch (error) {
      setApiResponse({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoadingTest(false);
    }
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
              {useDemo ? 'Using Demo Data' : 'Use Demo Data'}
            </button>
          </div>
        </div>
        
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
              </ol>
            </div>
          </div>
        )}
        
        {/* Main Calendar - conditionally render either the real calendar or demo calendar */}
        <div className="bg-gray-800 rounded-lg overflow-hidden min-h-[600px]">
          {useDemo ? (
            <DemoCalendar 
              onSessionClick={(session) => router.push(`/sessions/${session.id || 1}`)}
              onDateSelect={(start, end) => router.push(`/appointments/new?start=${start.toISOString()}&end=${end.toISOString()}`)}
            />
          ) : (
            <AppointmentCalendar 
              onSessionClick={(session) => router.push(`/sessions/${session.id}`)}
              onDateSelect={(start, end) => router.push(`/appointments/new?start=${start.toISOString()}&end=${end.toISOString()}`)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(Appointments); 