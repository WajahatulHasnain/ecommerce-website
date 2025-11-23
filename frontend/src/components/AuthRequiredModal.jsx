import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuest } from '../context/GuestContext';

const AuthRequiredModal = () => {
  const { showAuthModal, authModalMessage, authType, closeAuthModal } = useGuest();
  const navigate = useNavigate();

  if (!showAuthModal) return null;

  const handleSignIn = () => {
    closeAuthModal();
    navigate('/auth?mode=signin');
  };

  const handleSignUp = () => {
    closeAuthModal();
    navigate('/auth?mode=signup');
  };

  const handleClose = () => {
    closeAuthModal();
  };

  return (
    <div className="modal-overlay-auth" onClick={handleClose}>
      <div className="modal-content-auth" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-auth">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-etsy-orange to-etsy-orange-dark rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="modal-title-auth">Sign In Required</h3>
          <p className="modal-subtitle-auth">
            {authModalMessage || 'Please sign in to continue'}
          </p>
          <div className="mt-4 p-3 bg-warm-cream rounded-lg border border-etsy-orange/20">
            <p className="text-sm text-warm-gray-700">
              ✨ <strong>Join us to unlock:</strong> Shopping cart, wishlists, order tracking, and exclusive deals!
            </p>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-warm-gray-500">
              Already have an account? Click Sign In • New here? Click Sign Up
            </p>
          </div>
        </div>

        <div className="modal-actions-auth">
          <button
            onClick={handleClose}
            className="modal-btn-auth modal-btn-secondary-auth"
          >
            Cancel
          </button>
          <button
            onClick={handleSignIn}
            className="modal-btn-auth modal-btn-primary-auth"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            className="modal-btn-auth bg-green-600 hover:bg-green-700 text-white"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;