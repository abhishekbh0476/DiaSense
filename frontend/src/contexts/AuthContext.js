'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { setCookie, getCookie, deleteCookie } from '../lib/cookies';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configure axios defaults
  useEffect(() => {
    // Always include credentials for cookies
    axios.defaults.withCredentials = true;
    
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      // Check if token exists in localStorage or cookies
      const token = localStorage.getItem('token') || getCookie('clientToken');
      
      const response = await axios.get('/api/user/profile');
      
      if (response.data.success) {
        let finalToken = token;
        
        // If we don't have a client-side token but are authenticated,
        // try to get the token from the server
        if (!token) {
          try {
            console.log('No client token found, trying to retrieve from server...');
            const tokenResponse = await axios.get('/api/auth/token');
            if (tokenResponse.data.success && tokenResponse.data.data.token) {
              finalToken = tokenResponse.data.data.token;
              console.log('Retrieved token from server successfully');
            }
          } catch (tokenError) {
            console.log('Could not retrieve token from server:', tokenError.response?.status);
          }
        }
        
        // Store the token if we have one
        if (finalToken) {
          localStorage.setItem('token', finalToken);
          setCookie('clientToken', finalToken, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          console.log('Token stored successfully');
        }
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.data.user,
            accessToken: finalToken
          }
        });
      }
    } catch (error) {
      // User is not authenticated or API error
      console.log('Auth check failed (this is normal if not logged in):', error.response?.status);
      // Clear token from localStorage and cookies if auth check fails
      localStorage.removeItem('token');
      deleteCookie('clientToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await axios.post('/api/auth/login', {
        email,
        password,
        rememberMe
      });

      if (response.data.success) {
        // Store token in both localStorage and cookies for API client compatibility
        if (response.data.data.accessToken) {
          console.log('Login successful - storing token:', {
            hasToken: !!response.data.data.accessToken,
            tokenPreview: response.data.data.accessToken.substring(0, 20) + '...'
          });
          
          localStorage.setItem('token', response.data.data.accessToken);
          setCookie('clientToken', response.data.data.accessToken, {
            expires: rememberMe ? 30 : 7, // 30 days if remember me, otherwise 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
          
          console.log('Token stored - verification:', {
            localStorage: !!localStorage.getItem('token'),
            cookies: !!getCookie('clientToken')
          });
        }
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: response.data.data
        });
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const response = await axios.post('/api/auth/register', userData);

      if (response.data.success) {
        // Store token in both localStorage and cookies for API client compatibility
        if (response.data.data.accessToken) {
          localStorage.setItem('token', response.data.data.accessToken);
          setCookie('clientToken', response.data.data.accessToken, {
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        }
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: response.data.data
        });
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      const errors = error.response?.data?.errors || [];
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errors: errors
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from localStorage and cookies
      localStorage.removeItem('token');
      deleteCookie('clientToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put('/api/user/profile', userData);
      
      if (response.data.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: response.data.data.user
        });
        return { success: true, data: response.data.data.user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
