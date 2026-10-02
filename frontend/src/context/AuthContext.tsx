import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRecord, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: UserRecord | null;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  login: (user: UserRecord) => void;
  logout: () => void;
  resetAllDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(api.getCurrentUser());

  useEffect(() => {
    if (!user) {
      const defaultUser = api.getCurrentUser();
      if (defaultUser) setUser(defaultUser);
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    const switchedUser = api.switchRole(newRole);
    setUser(switchedUser);
  };

  const login = (newUser: UserRecord) => {
    api.setCurrentUser(newUser);
    setUser(newUser);
  };

  const logout = () => {
    api.setCurrentUser(null);
    setUser(null);
  };

  const resetAllDemoData = () => {
    api.resetAllToDefaults();
    const defaultUser = api.getCurrentUser();
    setUser(defaultUser);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'client',
        switchRole,
        login,
        logout,
        resetAllDemoData,
      }}
    >
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
