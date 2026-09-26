import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, setIntendedDestination } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#E31E24] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-['Outfit']">
            Verifying Session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination
    setIntendedDestination(location.pathname + location.search);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : null;
};
