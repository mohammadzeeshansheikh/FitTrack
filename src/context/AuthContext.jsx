import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem('fittrack_admin');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('fittrack_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      localStorage.setItem('fittrack_admin', JSON.stringify(admin));
    } else {
      localStorage.removeItem('fittrack_admin');
    }
  }, [admin]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('fittrack_token', token);
    } else {
      localStorage.removeItem('fittrack_token');
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admins', {
        params: { email: email.trim().toLowerCase() }
      });

      const foundAdmin = response.data.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!foundAdmin) {
        throw new Error('No admin account registered with this email.');
      }

      if (foundAdmin.password !== password) {
        throw new Error('Invalid password. Please check your credentials.');
      }

      const generatedToken = `fittrack_admin_jwt_${foundAdmin.id}_${Date.now()}`;
      setAdmin(foundAdmin);
      setToken(generatedToken);
      return foundAdmin;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('fittrack_admin');
    localStorage.removeItem('fittrack_token');
  };

  const value = {
    admin,
    token,
    loading,
    isAuthenticated: Boolean(admin && token),
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
