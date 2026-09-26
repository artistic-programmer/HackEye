import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ReportSubmission } from './pages/ReportSubmission';
import { RecentReports } from './pages/RecentReports';
import { ReportFailed } from './pages/ReportFailed';
import { Offline } from './pages/Offline';
import { NotFound } from './pages/NotFound';
import { useOnlineStatus } from './hooks/useOnlineStatus';

// ScrollToTop on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  React.useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

// Global connectivity monitor component
function ConnectivityMonitor() {
  const { isOnline } = useOnlineStatus();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If connection drops and we are not already on the offline screen
    if (!isOnline && location.pathname !== '/offline') {
      navigate('/offline', { state: { from: location.pathname + location.search } });
    }
  }, [isOnline, location, navigate]);

  return null;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ConnectivityMonitor />
        <Routes>
          {/* Page 1: Home */}
          <Route path="/" element={<Home />} />

          {/* Page 2: Login */}
          <Route path="/login" element={<Login />} />

          {/* Page 3: Report Submission (Protected) */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportSubmission />
              </ProtectedRoute>
            }
          />

          {/* Page 4: Recent Reports */}
          <Route path="/reports" element={<RecentReports />} />

          {/* Page 5: Report Not Sent */}
          <Route path="/report/failed" element={<ReportFailed />} />

          {/* Page 6: Signal Offline */}
          <Route path="/offline" element={<Offline />} />

          {/* Page 7: Error 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
