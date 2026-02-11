import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      setCurrentUser(user);

      if (user) {
        const data = await authService.getCurrentUserData();
        setUserData(data);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

 
  // useEffect(() => {
  //   if (!loading && currentUser && !currentUser.emailVerified) {
  //     if (window.location.pathname !== '/verify-email') {
  //       window.location.href = '/verify-email';
  //     }
  //   }
  // }, [currentUser, loading]);
  

  const value = {
    currentUser,
    userData,
    loading,
    register: authService.register,
    login: authService.login,
    loginWithGoogle: authService.loginWithGoogle,
    logout: authService.logout,
    resendEmailVerification: authService.resendEmailVerification,
    isCurrentUserEmailVerified: authService.isCurrentUserEmailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};