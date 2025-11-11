import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api';

/**
 * Hook to ensure API client always has the current token
 * This automatically sets the token whenever the auth state changes
 */
export function useApiClient() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('useApiClient Debug:', {
      isAuthenticated,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
    });

    if (isAuthenticated && token) {
      console.log('Setting token from auth context');
      apiClient.setToken(token);
    } else {
      // Try to get token from localStorage/cookies as fallback
      const fallbackToken = localStorage.getItem('token');
      console.log('Fallback token check:', {
        localStorage: !!localStorage.getItem('token'),
        cookies: !!document.cookie.includes('clientToken')
      });
      
      if (fallbackToken) {
        console.log('Using fallback token from localStorage');
        apiClient.setToken(fallbackToken);
      } else {
        console.log('No token found, clearing API client');
        apiClient.clearToken();
      }
    }
  }, [token, isAuthenticated]);

  return apiClient;
}
