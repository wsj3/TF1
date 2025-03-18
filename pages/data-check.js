import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { withAuth, useAuth } from '../utils/auth';

function DataCheck() {
  const { user } = useAuth();
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('counts');

  useEffect(() => {
    async function runDiagnostics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/diagnose?t=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();
        setDiagnosticData(data);
      } catch (err) {
        console.error('Error running diagnostics:', err);
        setError(err.message || 'Failed to run diagnostics');
      } finally {
        setLoading(false);
      }
    }

    runDiagnostics();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setError(null);
    setDiagnosticData(null);
    fetch(`/api/diagnose?t=${Date.now()}`)
      .then(response => {
        if (!response.ok) throw new Error(`API returned status ${response.status}`);
        return response.json();
      })
      .then(data => setDiagnosticData(data))
      .catch(err => {
        console.error('Error refreshing diagnostics:', err);
        setError(err.message || 'Failed to refresh diagnostics');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Layout>
      <Head>
        <title>Data Diagnostics | Therapist's Friend</title>
      </Head>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Database Diagnostic Tool</h1>
          <div className="flex space-x-2">
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-50 rounded-md text-red-200 border border-red-700">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300 text-lg">Running database diagnostics...</p>
            </div>
          </div>
        ) : diagnosticData ? (
          <div>
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Database Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-3 rounded text-gray-300">
                  <p><strong>Connection:</strong> {diagnosticData.database.connected ? '✅ Connected' : '❌ Disconnected'}</p>
                  <p><strong>Timestamp:</strong> {new Date(diagnosticData.timestamp).toLocaleString()}</p>
                  <p><strong>Tables Found:</strong> {diagnosticData.database.tables?.length || 0}</p>
                </div>
                
                <div className="bg-gray-700 p-3 rounded">
                  <h3 className="text-blue-400 font-medium mb-2">Available Tables</h3>
                  <div className="max-h-40 overflow-y-auto text-gray-300">
                    {diagnosticData.database.tables?.map(table => (
                      <div key={table} className="mb-1 flex items-center">
                        <span className="mr-2">📄</span> {table}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <div className="mb-4 border-b border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'counts'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('counts')}
                  >
                    Record Counts
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${
                      activeTab === 'samples'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('samples')}
                  >
                    Sample Data
                  </button>
                  {diagnosticData.errors && (
                    <button
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTab === 'errors'
                          ? 'text-red-400 border-b-2 border-red-400'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      onClick={() => setActiveTab('errors')}
                    >
                      Errors
                    </button>
                  )}
                </nav>
              </div>

              {activeTab === 'counts' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Record Counts</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(diagnosticData.counts).map(([recordType, count]) => (
                      <div key={recordType} className={`p-4 rounded-lg flex items-center ${count > 0 ? 'bg-green-900/30 border border-green-800' : 'bg-gray-700/50 border border-gray-600'}`}>
                        <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-lg ${count > 0 ? 'bg-green-800 text-green-100' : 'bg-gray-600 text-gray-300'}`}>
                          {count}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-200 capitalize">{recordType}</h3>
                          <p className="text-sm text-gray-400">{count > 0 ? 'Records available' : 'No records'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'samples' && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Sample Data</h2>
                  
                  {Object.keys(diagnosticData.samples || {}).length === 0 ? (
                    <p className="text-gray-400">No sample data available</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(diagnosticData.samples).map(([recordType, samples]) => (
                        <div key={recordType} className="bg-gray-700 p-4 rounded-lg">
                          <h3 className="text-lg font-medium text-gray-200 capitalize mb-3">{recordType} Samples</h3>
                          <div className="overflow-x-auto">
                            <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-auto max-h-60">
                              {JSON.stringify(samples, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'errors' && diagnosticData.errors && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Errors</h2>
                  <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
                    <pre className="text-red-200 text-sm overflow-auto max-h-96">
                      {JSON.stringify(diagnosticData.errors, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Troubleshooting Steps</h2>
              
              <div className="text-gray-300 space-y-4">
                <p className="font-medium">If some record types show zero counts:</p>
                
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Check if the tables were correctly seeded with data using <code className="bg-gray-700 px-1 rounded">npx prisma db seed</code></li>
                  <li>Verify that the Prisma schema has correct relationships between models</li>
                  <li>Ensure that API routes for these record types are properly implemented</li>
                  <li>Check if there are access permission issues with these tables</li>
                </ol>
                
                <p className="mt-4 font-medium">For records with data that are not displaying in the UI:</p>
                
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Check the API response format and ensure it matches what the UI components expect</li>
                  <li>Examine the frontend code that fetches and displays this data for any errors</li>
                  <li>Verify that the authentication context includes the necessary permissions</li>
                  <li>Look for any client-side filtering that might be excluding the records</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No diagnostic data available. Click Refresh to run diagnostics.</p>
        )}
      </div>
    </Layout>
  );
}

export default withAuth(DataCheck); 