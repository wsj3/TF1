import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import Head from 'next/head';

// This is a debug page to help identify issues with the appointments page
export default function DebugAppointments() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState({
    pageLoaded: true,
    timestamp: new Date().toISOString(),
    router: null,
    filesChecked: {}
  });
  
  useEffect(() => {
    // Add router info
    setDebugInfo(prev => ({
      ...prev,
      router: {
        pathname: router.pathname,
        asPath: router.asPath,
        query: router.query
      }
    }));
    
    // Check if files exist
    async function checkFiles() {
      try {
        const filesToCheck = [
          '/api/sessions',
          '/appointments'
        ];
        
        const results = {};
        
        for (const file of filesToCheck) {
          try {
            const response = await fetch(file);
            results[file] = {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              text: await response.text().then(t => t.substring(0, 100) + '...')
            };
          } catch (error) {
            results[file] = { error: error.message };
          }
        }
        
        setDebugInfo(prev => ({
          ...prev,
          filesChecked: results
        }));
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          error: error.message
        }));
      }
    }
    
    checkFiles();
  }, [router]);
  
  return (
    <Layout>
      <Head>
        <title>Debug Appointments | Therapist's Friend</title>
      </Head>
      
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Debug Appointments</h1>
        
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl text-white mb-3">Diagnostics</h2>
          
          <div className="mb-4">
            <button 
              onClick={() => router.push('/appointments')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mr-2"
            >
              Go to Appointments
            </button>
            
            <button 
              onClick={() => router.push('/appointments?demo=true')}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded mr-2"
            >
              Go to Appointments with Demo Mode
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Refresh Page
            </button>
          </div>
          
          <div className="mt-4 bg-gray-900 p-4 rounded overflow-auto max-h-96">
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="text-white">
          <p>If the appointments page is showing placeholder text instead of the calendar:</p>
          <ol className="list-decimal ml-6 mt-2">
            <li>Check that the AppointmentCalendar component is being imported correctly</li>
            <li>Verify that any conditional rendering logic isn't preventing the calendar from showing</li>
            <li>Check browser console for any JavaScript errors</li>
            <li>Try accessing the page with demo mode enabled (?demo=true)</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
} 