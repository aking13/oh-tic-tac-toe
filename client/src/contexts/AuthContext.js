import React, { createContext, useContext, useState, useEffect } from 'react';

// API URL - adjust if needed
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:12000/api' 
  : '/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMsg = 'Registration failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMsg = 'Login failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user data in context
        setUser(prev => ({
          ...prev,
          displayName: profileData.displayName || prev.displayName,
          email: profileData.email || prev.email
        }));
        return { success: true };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMsg = 'Profile update failed. Please try again.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const getUserStats = async () => {
    try {
      const response = await fetch(`${API_URL}/user/stats`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.stats;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return null;
    }
  };

  const getUserGames = async (limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/user/games?limit=${limit}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.games;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch user games:', error);
      return [];
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    getUserStats,
    getUserGames,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};