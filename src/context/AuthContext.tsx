import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/report';
import { INITIAL_USER } from '../data/mockReports';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  intendedDestination: string | null;
  setIntendedDestination: (path: string | null) => void;
}

const STORAGE_KEY_AUTH = 'dailybugle_auth_user';
const STORAGE_KEY_INTENDED = 'dailybugle_intended_dest';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [intendedDestination, setIntendedState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_INTENDED);
    } catch {
      return null;
    }
  });

  const setIntendedDestination = (path: string | null) => {
    setIntendedState(path);
    if (path) {
      localStorage.setItem(STORAGE_KEY_INTENDED, path);
    } else {
      localStorage.removeItem(STORAGE_KEY_INTENDED);
    }
  };

  const login = () => {
    setUser(INITIAL_USER);
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(INITIAL_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        intendedDestination,
        setIntendedDestination,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
