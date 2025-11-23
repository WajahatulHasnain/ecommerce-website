import React, { createContext, useContext, useState } from 'react';

const GuestContext = createContext();

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
};

export const GuestProvider = ({ children }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [authType, setAuthType] = useState('signin'); // 'signin' or 'signup'

  const requireAuth = (action = 'perform this action', type = 'signin') => {
    setAuthModalMessage(`Please sign in to ${action}`);
    setAuthType(type);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthModalMessage('');
    setAuthType('signin');
  };

  const value = {
    showAuthModal,
    authModalMessage,
    authType,
    requireAuth,
    closeAuthModal
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
};