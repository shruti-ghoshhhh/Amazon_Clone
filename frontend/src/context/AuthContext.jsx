// AuthContext.jsx — Global Authentication State Provider
//
// This context manages all client-side authentication states.
// It provides:
//   - user: The currently logged-in user object (id, name, email)
//   - token: The active JWT token
//   - loading: True while checking existing sessions on mount
//   - login(email, password): Authenticates user against backend API
//   - signup(name, email, password): Registers a new user account
//   - logout(): Clears session storage and resets all states
//
// Keeps authentication token synced in localStorage for persistence.

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // 1. On mount, verify if the stored token is still valid
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Verify token by querying the profile endpoint
          const { data } = await api.get('/auth/me');
          if (data?.success && data?.data?.user) {
            setUser(data.data.user);
          } else {
            // Clean up if the response was malformed
            handleLogoutCleanups();
          }
        } catch (err) {
          console.warn('⚠️ [Auth Context] Token validation failed or expired:', err.message);
          handleLogoutCleanups();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Helper to purge local auth credentials
  const handleLogoutCleanups = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  // 2. Perform Login
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      if (data?.success && data?.token) {
        const loggedUser = data.data.user;
        const jwtToken = data.token;

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));

        setToken(jwtToken);
        setUser(loggedUser);
        return { success: true };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err) {
      console.error('❌ [Auth Context] Login error:', err);
      const errorMsg = err.response?.data?.message || 'Invalid email or password.';
      return { success: false, error: errorMsg };
    }
  };

  // 3. Perform Signup
  const signup = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/signup', { name, email, password });
      
      if (data?.success && data?.token) {
        const loggedUser = data.data.user;
        const jwtToken = data.token;

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));

        setToken(jwtToken);
        setUser(loggedUser);
        return { success: true };
      }
      return { success: false, error: 'Signup failed. Please try again.' };
    } catch (err) {
      console.error('❌ [Auth Context] Signup error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create account.';
      return { success: false, error: errorMsg };
    }
  };

  // 4. Perform Logout
  const logout = () => {
    handleLogoutCleanups();
    // Redirect to home page or login page
    window.location.href = '/';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom React hook for easy hook consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider');
  }
  return context;
};
