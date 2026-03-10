// useAuthCheck Hook - Authentication check and login modal management

import { useState, useCallback } from 'react';

interface UseAuthCheckReturn {
  requireAuth: (callback: () => void) => void;
  showLoginModal: boolean;
  handleLoginSuccess: () => void;
  closeLoginModal: () => void;
}

export const useAuthCheck = (): UseAuthCheckReturn => {
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const requireAuth = useCallback((callback: () => void) => {
    // Check if user is logged in
    const userInfo = localStorage.getItem('userInfo');
    const accessToken = localStorage.getItem('accessToken');
    
    if (userInfo && accessToken) {
      // User is logged in, execute callback
      callback();
    } else {
      // User is not logged in, show login modal
      setShowLoginModal(true);
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLoginModal(false);
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChanged'));
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  return {
    requireAuth,
    showLoginModal,
    handleLoginSuccess,
    closeLoginModal
  };
};
