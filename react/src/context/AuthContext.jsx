import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setupAuthInterceptor } from '../api/interceptors';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';
import { getProfile } from '../api/profile';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY) || null;
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = useCallback(() => token, [token]);

  useEffect(() => {
    setupAuthInterceptor(getToken);
  }, [getToken]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiLogin({ username, password });
      setToken(response.token);
      setUser({ id: response.id, username: response.username });
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Ошибка входа';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRegister({ username, password });
      setToken(response.token);
      setUser({ id: response.id, username: response.username });
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.username?.[0] || 
                          err.response?.data?.password?.[0] || 
                          'Ошибка регистрации';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!token) return null;
    
    setIsLoading(true);
    try {
      const profile = await getProfile();
      setUser({ id: profile.id, username: profile.username });
      return profile;
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        setUser(null);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    token,
    user,
    isLoading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    refreshProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
