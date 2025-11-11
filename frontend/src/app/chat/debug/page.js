'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';

export default function ChatDebugPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message, details: error }
      }));
    }
    setLoading(false);
  };

  const testBasicAPI = async () => {
    const response = await axios.get('/api/test/chat');
    return response.data;
  };

  const testChatAPI = async () => {
    const response = await axios.get('/api/chat');
    return response.data;
  };

  const testCreateChat = async () => {
    const response = await axios.post('/api/chat', { title: 'Debug Test Chat' });
    return response.data;
  };

  const testPythonBackend = async () => {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'What should I know about managing blood sugar levels?',
        conversation_history: []
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  };

  const testPythonHealth = async () => {
    const response = await fetch('http://localhost:5000/health');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  };

  const testCORS = async () => {
    const response = await fetch('http://localhost:5000/test-cors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'CORS test from frontend' })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chat System Debug</h1>
        
        {/* User Info */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Not logged in'}</p>
            <p><strong>User ID:</strong> {user?._id || 'N/A'}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => runTest('basicAPI', testBasicAPI)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={loading}
            >
              Test Basic API
            </button>
            
            <button
              onClick={() => runTest('chatAPI', testChatAPI)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              disabled={loading || !isAuthenticated}
            >
              Test Chat API
            </button>
            
            <button
              onClick={() => runTest('createChat', testCreateChat)}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              disabled={loading || !isAuthenticated}
            >
              Test Create Chat
            </button>
            
            <button
              onClick={() => runTest('pythonHealth', testPythonHealth)}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              disabled={loading}
            >
              Test Python Health
            </button>
            
            <button
              onClick={() => runTest('pythonBackend', testPythonBackend)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              disabled={loading}
            >
              Test Python Chat
            </button>
            
            <button
              onClick={() => runTest('testCORS', testCORS)}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
              disabled={loading}
            >
              Test CORS
            </button>
            
            <button
              onClick={() => setTestResults({})}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                {result.success ? '✅' : '❌'} {testName}
              </h3>
              
              {result.success ? (
                <div className="bg-green-50 p-4 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-red-800 font-medium mb-2">Error: {result.error}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer">View Details</summary>
                    <pre className="mt-2 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure you&apos;re logged in to test authenticated endpoints</li>
            <li>Start your Python backend: <code className="bg-gray-200 px-2 py-1 rounded">python server.py</code></li>
            <li>Check that your backend is running on <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:5000</code></li>
            <li>Test each endpoint to identify where the issue is</li>
            <li>Check browser console and terminal logs for detailed error messages</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
