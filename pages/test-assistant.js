import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TestAssistant() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [functionResponse, setFunctionResponse] = useState(null);
  const [envInfo, setEnvInfo] = useState({});

  // Get environment info on component load
  useEffect(() => {
    async function getEnvInfo() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setEnvInfo(data);
      } catch (e) {
        console.error('Error fetching env info:', e);
      }
    }
    
    getEnvInfo();
  }, []);

  const handleDirectOpenAITest = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setFunctionResponse(null);
    
    try {
      const res = await fetch('/api/test-openai');
      const data = await res.json();
      
      if (data.status === 'success') {
        setSuccess(true);
        setResponse(data.message);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssistantTest = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const updatedMessages = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    
    setLoading(true);
    setSuccess(false);
    setError(null);
    setFunctionResponse(null);
    
    try {
      // Call the API with conversation history
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversationId: 'test-assistant',
          clearContext: false
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to get response from AI assistant';
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If not JSON, use the raw text
          errorMessage = errorText || `${errorMessage} (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      setSuccess(true);
      setResponse(data.message);
      
      // Check if a function was called
      if (data.function_call) {
        setFunctionResponse(data.function_call);
      }
      
      // Add assistant message to chat
      setMessages([...updatedMessages, { role: 'assistant', content: data.message }]);
      
      // Clear input
      setInput('');
      
    } catch (e) {
      setError(e.message);
      console.error('Error calling assistant API:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>AI Assistant Test</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">AI Assistant Testing Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
          <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(envInfo, null, 2)}</pre>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Direct OpenAI Test</h2>
            <button 
              onClick={handleDirectOpenAITest}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Testing...' : 'Test OpenAI Connection'}
            </button>
          </div>
        </div>
        
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Assistant API Test</h2>
          <form onSubmit={handleAssistantTest} className="flex flex-col">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message to test the assistant..."
              className="border p-2 rounded mb-2"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="mt-4">
        {loading && <p className="text-blue-500">Loading...</p>}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
            <strong className="font-bold">Success! </strong>
            <span className="block sm:inline">{response}</span>
          </div>
        )}
        
        {functionResponse && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4">
            <strong className="font-bold">Function Called: </strong>
            <span className="block font-semibold">{functionResponse.name}</span>
            <div className="mt-2">
              <p className="font-semibold">Arguments:</p>
              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(functionResponse.arguments, null, 2)}</pre>
            </div>
            <div className="mt-2">
              <p className="font-semibold">Response:</p>
              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(functionResponse.response, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Conversation</h2>
        <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet. Start a conversation above.</p>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-2 p-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-800 ml-8' 
                    : 'bg-gray-100 text-gray-800 mr-8'
                }`}
              >
                <p className="text-xs font-semibold">{msg.role.toUpperCase()}</p>
                <p>{msg.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 