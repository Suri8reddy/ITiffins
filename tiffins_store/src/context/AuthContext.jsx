import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('tiffin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('tiffin_auth_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          localStorage.setItem('tiffin_user', JSON.stringify(userData));
        } catch (err) {
          console.error("Failed to restore session:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('tiffin_auth_token', data.token);
    localStorage.setItem('tiffin_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('tiffin_auth_token');
    localStorage.removeItem('tiffin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isManager: user?.role === 'MANAGER', isCashier: user?.role === 'CASHIER' || user?.role === 'MANAGER' }}>
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
