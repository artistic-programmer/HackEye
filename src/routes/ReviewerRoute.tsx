import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ReviewerRouteProps {
  children?: React.ReactNode;
}

export const ReviewerRoute: React.FC<ReviewerRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading, setIntendedDestination } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#E31E24] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-['Outfit']">
            Verifying Reviewer Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setIntendedDestination(location.pathname + location.search);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isReviewerOrAdmin = user?.role === 'REVIEWER' || user?.role === 'ADMIN';

  if (!isReviewerOrAdmin) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          accessDenied: true,
          message: 'Access restricted to verified Daily Bugle reviewers.',
        }}
      />
    );
  }

  return children ? <>{children}</> : null;
};
