import { useState, useEffect } from 'react';

export default function ApiTest() {
  const [testResult, setTestResult] = useState(null);
  const [assistantResult, setAssistantResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customMessage, setCustomMessage] = useState('What time is my next appointment?');
  
  // Function to test both endpoints
  const runTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test the test endpoint
      const testResponse = await fetch('/api/test');
      const testData = await testResponse.json();
      setTestResult(testData);
      
      // Test the assistant endpoint with custom message
      const assistantResponse = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: customMessage }],
          temperature: 0.7,
          conversationId: 'direct-test'
        }),
      });
      
      const assistantData = await assistantResponse.json();
      setAssistantResult(assistantData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Custom Message to Assistant:</label>
        <div className="flex">
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="flex-1 border rounded-l px-3 py-2"
            placeholder="Enter a test message..."
          />
          <button 
            onClick={runTest}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
          >
            {loading ? 'Testing...' : 'Send'}
          </button>
        </div>
      </div>
      
      <button 
        onClick={runTest}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Run API Test'}
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Test API Response</h2>
          <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {testResult ? JSON.stringify(testResult, null, 2) : 'No data yet'}
          </pre>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Assistant API Response</h2>
          <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {assistantResult ? JSON.stringify(assistantResult, null, 2) : 'No data yet'}
          </pre>
        </div>
      </div>
      
      {assistantResult && (
        <div className="mt-6 border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Extracted Assistant Response</h2>
          <div className="bg-blue-100 p-3 rounded">
            <p><strong>Success:</strong> {assistantResult.success ? 'Yes' : 'No'}</p>
            <p><strong>Message:</strong> {assistantResult.message}</p>
            <div className="mt-2">
              <p><strong>Data:</strong></p>
              <pre className="bg-white p-2 rounded mt-1">
                {JSON.stringify(assistantResult.data, null, 2)}
              </pre>
            </div>
            <div className="mt-4 p-3 bg-white rounded">
              <p className="font-bold">Content:</p>
              <p className="mt-2 whitespace-pre-wrap">
                {assistantResult.data?.content || 
                (typeof assistantResult.data === 'string' ? assistantResult.data : 'No content found')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 