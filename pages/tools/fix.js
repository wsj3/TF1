import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { withAuth, useAuth } from '../../utils/auth';

function AppointmentsFix() {
  const router = useRouter();
  const { user } = useAuth();
  const [diagnosticInfo, setDiagnosticInfo] = useState({
    timestamp: new Date().toISOString(),
    checks: {}
  });
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState(null);

  // Run diagnostics when component mounts
  useEffect(() => {
    runDiagnostics();
  }, []);

  // Function to run various diagnostic checks
  async function runDiagnostics() {
    const checks = {};
    
    try {
      // Check API endpoint
      const apiResponse = await fetch('/api/sessions?demo=true');
      checks.apiStatus = {
        status: apiResponse.status,
        ok: apiResponse.ok,
        contentType: apiResponse.headers.get('content-type')
      };
      
      if (apiResponse.ok) {
        const data = await apiResponse.text();
        checks.apiResponse = data.substring(0, 100) + '...';
      }
    } catch (error) {
      checks.apiError = error.message;
    }
    
    // Update state with diagnostic info
    setDiagnosticInfo(prev => ({
      ...prev,
      timestamp: new Date().toISOString(),
      checks
    }));
  }

  // Function to navigate to different pages
  function navigateTo(path) {
    router.push(path);
  }

  // Apply fixes to routing issues
  async function applyFixes() {
    setIsFixing(true);
    
    try {
      // Clear local storage cache
      localStorage.clear();
      
      // Force reload with cache busting
      const results = {
        cacheCleared: true,
        timestamp: new Date().toISOString()
      };
      
      setFixResults(results);
      
      // Wait 1 second then reload
      setTimeout(() => {
        window.location.href = '/appointments?demo=true&t=' + Date.now();
      }, 1000);
    } catch (error) {
      setFixResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      setIsFixing(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Fix Appointments | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Appointments Page Diagnostics & Fix</h1>
        <p className="text-gray-300 mb-6">Path: /tools/fix - Build time: {new Date().toISOString()}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Navigation Panel */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl text-white mb-3">Navigation</h2>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigateTo('/appointments')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full"
              >
                Go to Appointments
              </button>
              
              <button 
                onClick={() => navigateTo('/appointments?demo=true')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded w-full"
              >
                Appointments with Demo Mode
              </button>
              
              <button 
                onClick={() => navigateTo('/debug-appointments')}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full"
              >
                Debug Appointments
              </button>
              
              <button 
                onClick={runDiagnostics}
                className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded w-full"
              >
                Run Diagnostics Again
              </button>
            </div>
          </div>
          
          {/* Fix Panel */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl text-white mb-3">Apply Fixes</h2>
            
            <div className="space-y-4">
              <div className="text-gray-300 text-sm">
                <p>This tool will attempt to fix routing issues with the appointments page:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Clear browser cache for this site</li>
                  <li>Force reload with cache-busting parameters</li>
                  <li>Enable demo mode for testing without auth</li>
                </ul>
              </div>
              
              <button 
                onClick={applyFixes}
                disabled={isFixing}
                className={`py-2 px-4 rounded w-full ${
                  isFixing 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isFixing ? 'Applying Fixes...' : 'Apply Fixes & Reload'}
              </button>
              
              {fixResults && (
                <div className="mt-2 p-3 bg-gray-700 rounded text-sm">
                  <pre className="text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(fixResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Diagnostic Information */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl text-white mb-3">Diagnostic Information</h2>
          
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-green-400 text-sm">
            {JSON.stringify(diagnosticInfo, null, 2)}
          </pre>
        </div>
        
        {/* Troubleshooting Guide */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl text-white mb-3">Troubleshooting Guide</h2>
          
          <div className="text-gray-300">
            <p className="mb-2">If you're seeing issues with the appointments page:</p>
            
            <ol className="list-decimal ml-5 space-y-2">
              <li>
                <strong>Duplicate page error in terminal:</strong> This happens when both 
                <code className="bg-gray-700 px-1 rounded">pages/appointments.js</code> and 
                <code className="bg-gray-700 px-1 rounded">pages/appointments/index.js</code> exist.
                Solution: Remove the <code className="bg-gray-700 px-1 rounded">pages/appointments/</code> directory.
              </li>
              
              <li>
                <strong>Blank page or loading indicator stuck:</strong> This may be a JavaScript error.
                Check browser console and network tab for errors.
              </li>
              
              <li>
                <strong>Not seeing appointments data:</strong> Try enabling demo mode by adding <code className="bg-gray-700 px-1 rounded">?demo=true</code>
                to the URL, or check API responses in the Network tab.
              </li>
              
              <li>
                <strong>Old content showing:</strong> Try clearing cache and hard reloading (Ctrl+Shift+R or Cmd+Shift+R).
              </li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(AppointmentsFix); 