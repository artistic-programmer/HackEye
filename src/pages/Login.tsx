import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithCredential, isAuthenticated, intendedDestination, setIntendedDestination } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Destination resolution
  const targetDestination = 
    (location.state as { from?: { pathname?: string; search?: string } | string })?.from ||
    intendedDestination || 
    '/';

  const destinationPath = typeof targetDestination === 'string' 
    ? targetDestination 
    : (targetDestination.pathname || '/') + (targetDestination.search || '');

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(destinationPath, { replace: true });
    }
  }, [isAuthenticated, destinationPath, navigate]);

  // Handle Google OAuth Credential returned by Google Identity Services
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setErrorMessage('Google authentication did not return a valid credential. Please try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginWithCredential(response.credential);
      setIntendedDestination(null);
      navigate(destinationPath, { replace: true });
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMessage(
        err.message || 'Authentication failed. Please check your network and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured in frontend environment.');
      return;
    }

    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnContainerRef.current) {
            google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              width: 360,
            });
          }
        } catch (e) {
          console.error('Error initializing Google Identity Services:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(interval);
        }
      }, 100);
      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  const handleManualGoogleClick = () => {
    setErrorMessage(null);
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt wasn't displayed (e.g. third-party cookie blocked), notify user
          setErrorMessage('Please use the Google Sign-In prompt or enable popups.');
        }
      });
    } else {
      setErrorMessage('Google Identity Services is loading. Please try again in a moment.');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative selection:bg-[#E31E24] selection:text-white"
      style={{ backgroundImage: "url('/assets/backgrounds/login_bg.png')" }}
    >
      {/* Top Navbar matching Login_page.png */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2 group select-none">
          {/* Target/crosshair radar icon matching sample */}
          <div className="w-7 h-7 relative flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-[1.5px] border-[#E31E24] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#E31E24]"></div>
            </div>
            <div className="absolute w-7 h-0.5 bg-[#E31E24]/70 -rotate-45"></div>
          </div>
          <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-gray-950 font-['Outfit']">
            DAILY <span className="text-[#E31E24]">BUGLE</span>
          </span>
        </Link>

        <nav className="flex items-center space-x-8 text-xs sm:text-sm font-semibold text-gray-700">
          <Link to="/" className="text-[#E31E24] hover:text-[#c9181d] transition-colors border-b-2 border-[#E31E24] pb-0.5 font-bold">
            Home
          </Link>
          <a href="/#about" className="hover:text-gray-900 transition-colors">
            About Us
          </a>
          <a href="mailto:dispatch@dailybugle.local" className="hover:text-gray-900 transition-colors">
            Contact
          </a>
        </nav>
      </header>

      {/* Main Login Viewport */}
      <div className="flex-1 flex items-center max-w-7xl w-full mx-auto px-6 sm:px-10 py-12 relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Content Column matching Login_page.png */}
          <div className="lg:col-span-6 max-w-lg">
            {/* Red Accent Dash */}
            <div className="w-8 h-1 bg-[#E31E24] mb-5 rounded-full"></div>

            <div className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-3">
              STAY INFORMED.
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-serif-title tracking-tight leading-[1.05] text-gray-950">
              WELCOME<br />
              <span className="text-[#E31E24]">BACK.</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-gray-600 font-medium max-w-md leading-relaxed">
              Continue helping turn reports into trusted information.
            </p>

            {/* Google Login Action Button with Real Google Sign-In */}
            <div className="mt-9">
              <div className="relative w-full sm:w-[360px]">
                {/* Styled Daily Bugle Button visible to user */}
                <button
                  type="button"
                  onClick={handleManualGoogleClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between px-6 py-4 rounded-full bg-white/95 hover:bg-white border border-gray-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.06)] hover:shadow-xl hover:border-gray-300 transition-all group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Google Multicolor SVG Icon */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800">
                      {isLoading ? 'Verifying with Google...' : 'Continue with Google'}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Real Google Identity Services button container overlaid transparently */}
                <div
                  ref={googleBtnContainerRef}
                  className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer flex items-center justify-center pointer-events-auto"
                  style={{ zIndex: 10 }}
                  title="Sign in with Google"
                />
              </div>

              {/* Error feedback banner */}
              {errorMessage && (
                <div className="mt-3.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-2.5 max-w-[360px] animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right column is intentionally unobstructed so the 3D red cubes, web, and hanging spider from the background image are showcased cleanly */}
          <div className="hidden lg:block lg:col-span-6 min-h-[460px]"></div>

        </div>
      </div>
    </div>
  );
};
