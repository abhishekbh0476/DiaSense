'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCookie } from '../lib/cookies';

export default function AuthDebug() {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const [testToken, setTestToken] = useState('');

  const handleSetTestToken = () => {
    if (testToken) {
      localStorage.setItem('token', testToken);
      alert('Test token set in localStorage');
    }
  };

  const handleClearTokens = () => {
    localStorage.removeItem('token');
    document.cookie = 'clientToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    alert('All tokens cleared');
  };

  const handleRefreshToken = async () => {
    try {
      const response = await fetch('/api/auth/token', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
        alert('Token retrieved and stored successfully!');
        window.location.reload(); // Refresh to update the debug panel
      } else {
        alert('Could not retrieve token: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error retrieving token: ' + error.message);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '15px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>🐛 Auth Debug Panel</h4>
      <div>
        <strong>Auth State:</strong><br/>
        • Authenticated: {isAuthenticated ? '✅' : '❌'}<br/>
        • Loading: {isLoading ? '⏳' : '✅'}<br/>
        • User: {user?.email || 'None'}<br/>
        • Context Token: {token ? '✅' : '❌'}<br/>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <strong>Storage:</strong><br/>
        • localStorage: {localStorage.getItem('token') ? '✅' : '❌'}<br/>
        • Cookies: {getCookie('clientToken') ? '✅' : '❌'}<br/>
        • HttpOnly Cookie: {document.cookie.includes('token=') ? '✅' : '❌'}<br/>
      </div>

      <div style={{ marginTop: '10px' }}>
        <input 
          type="text" 
          placeholder="Test token" 
          value={testToken}
          onChange={(e) => setTestToken(e.target.value)}
          style={{ width: '100%', marginBottom: '5px' }}
        />
        <button onClick={handleSetTestToken} style={{ marginRight: '5px', fontSize: '10px' }}>
          Set Test Token
        </button>
        <button onClick={handleClearTokens} style={{ marginRight: '5px', fontSize: '10px' }}>
          Clear All
        </button>
        <button onClick={handleRefreshToken} style={{ fontSize: '10px', backgroundColor: '#4CAF50', color: 'white' }}>
          Get Token
        </button>
      </div>

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        If not authenticated, try signing in first at /signin
      </div>
    </div>
  );
}
