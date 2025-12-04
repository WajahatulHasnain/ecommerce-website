import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

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

  // ✅ Enhanced: Update user function for real-time sync
  const updateUser = useCallback((updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    // Dispatch event for cross-component communication
    window.dispatchEvent(new CustomEvent('profileUpdated', { 
      detail: updatedData 
    }));
  }, []);

  // ✅ Enhanced: Fetch complete user profile
  const fetchUserProfile = useCallback(async (token) => {
    try {
      // Only fetch admin profile, customers don't need profile fetching
      if (user?.role === 'admin') {
        const response = await api.get('/admin/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setUser(prev => ({ ...prev, ...response.data.data }));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't clear token on profile fetch error - might be temporary network issue
    }
  }, [user?.role]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token) {
      // Decode token to get user info
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        setUser({ id: decoded.id, role: decoded.role });
        
        // ✅ Enhanced: Fetch complete profile after setting basic data
        setTimeout(() => {
          fetchUserProfile(token);
        }, 100);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  }, [fetchUserProfile]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    // ✅ Enhanced: Fetch complete profile after login
    setTimeout(() => {
      fetchUserProfile(token);
    }, 100);
  };

  const adminLogin = (token, userData) => {
    localStorage.setItem('adminToken', token);
    setUser(userData);
    // ✅ Enhanced: Fetch complete profile after admin login
    setTimeout(() => {
      fetchUserProfile(token);
    }, 100);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  // ✅ Enhanced: Refresh profile function
  const refreshProfile = useCallback(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token && user) {
      fetchUserProfile(token);
    }
  }, [fetchUserProfile, user]);

  const value = {
    user,
    login,
    adminLogin,
    logout,
    loading,
    updateUser,        // ✅ New: For real-time updates
    fetchUserProfile,  // ✅ New: Manual profile refresh
    refreshProfile     // ✅ New: Quick refresh function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
