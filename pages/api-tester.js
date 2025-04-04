import { useState } from 'react';
import Head from 'next/head';

export default function ApiTester() {
  const [prompt, setPrompt] = useState('Tell me about therapy practices');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  const testGeminiApi = async () => {
    setLoading(true);
    setError(null);
    setResponse('');
    addLog(`Testing Gemini API with prompt: "${prompt}"`, 'info');

    try {
      addLog('Sending request to /api/test-gemini...', 'info');
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      addLog(`Received response with status: ${res.status}`, res.ok ? 'success' : 'error');

      if (!res.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setResponse(data.response);
      addLog('Successfully received response from Gemini API', 'success');
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Head>
        <title>API Tester | Therapist's Friend</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">API Tester</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Gemini API</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Prompt:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-md"
              rows={3}
            />
          </div>

          <button
            onClick={testGeminiApi}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Gemini API'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-800 text-white rounded-md">
              <h3 className="font-semibold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {response && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Response:</h3>
              <div className="p-3 bg-gray-700 rounded-md whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Logs</h2>
          <div className="bg-black rounded-md p-3 h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                'text-gray-300'
              }`}>
                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 italic">No logs yet. Run a test to see logs.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 