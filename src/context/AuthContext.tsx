import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/report';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithCredential: (credential: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  intendedDestination: string | null;
  setIntendedDestination: (path: string | null) => void;
  login: () => void; // Legacy fallback
}

const STORAGE_KEY_INTENDED = 'dailybugle_intended_dest';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [intendedDestination, setIntendedState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_INTENDED);
    } catch {
      return null;
    }
  });

  // Verify session on application mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const currentUser = await authService.getMe();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const setIntendedDestination = (path: string | null) => {
    setIntendedState(path);
    if (path) {
      localStorage.setItem(STORAGE_KEY_INTENDED, path);
    } else {
      localStorage.removeItem(STORAGE_KEY_INTENDED);
    }
  };

  const loginWithCredential = async (credential: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const authenticatedUser = await authService.loginWithGoogle(credential);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  // Legacy fallback if called without credential
  const login = () => {
    refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        loginWithCredential,
        logout,
        refreshUser,
        intendedDestination,
        setIntendedDestination,
        login,
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
