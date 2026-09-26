import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isAuthenticated, intendedDestination, setIntendedDestination } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');

  // Destination resolution
  const targetDestination = 
    (location.state as { from?: { pathname?: string; search?: string } | string })?.from ||
    intendedDestination || 
    '/';

  const destinationPath = typeof targetDestination === 'string' 
    ? targetDestination 
    : (targetDestination.pathname || '/') + (targetDestination.search || '');

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(destinationPath, { replace: true });
    }
  }, [isAuthenticated, destinationPath, navigate]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      login();
      setIsLoading(false);
      setIntendedDestination(null);
      navigate(destinationPath, { replace: true });
    }, 600);
  };

  const handleSimulateSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login();
      setIsLoading(false);
      setShowSignUpModal(false);
      setIntendedDestination(null);
      navigate(destinationPath, { replace: true });
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] relative overflow-hidden selection:bg-[#E31E24] selection:text-white">
      
      {/* Top Navbar matching Login_page.png */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Target/crosshair radar icon */}
          <div className="w-6 h-6 rounded-full border-2 border-[#E31E24] flex items-center justify-center relative">
            <div className="w-2 h-2 rounded-full bg-[#E31E24]"></div>
            <div className="absolute inset-0 border border-gray-400/40 rounded-full scale-125"></div>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gray-950 font-['Outfit']">
            DAILY <span className="text-[#E31E24]">BUGLE</span>
          </span>
        </Link>

        <nav className="flex items-center space-x-8 text-xs font-semibold text-gray-700">
          <Link to="/" className="text-[#E31E24] hover:text-[#c9181d] transition-colors border-b border-[#E31E24] pb-0.5">
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
      <div className="flex-1 flex items-center max-w-7xl w-full mx-auto px-6 py-12 lg:py-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Hero / Login Card */}
          <div className="lg:col-span-6 max-w-xl">
            {/* Red Accent Dash */}
            <div className="w-10 h-1 bg-[#E31E24] mb-6 rounded-full"></div>

            <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">
              STAY INFORMED.
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 font-serif-title tracking-tight leading-[1.05]">
              WELCOME<br />
              <span className="text-[#E31E24]">BACK.</span>
            </h1>

            <p className="mt-6 text-sm sm:text-base text-gray-600 font-medium max-w-md">
              Continue helping turn reports into trusted information.
            </p>

            {/* Google Login Action Button */}
            <div className="mt-10">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full sm:w-[380px] flex items-center justify-between px-6 py-4 rounded-full bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-lg hover:border-gray-300 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
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
                  <span className="text-sm font-bold text-gray-800">
                    {isLoading ? 'Verifying with Bugle Network...' : 'Continue with Google'}
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
              </button>

              <div className="mt-6 text-xs text-gray-500 font-medium pl-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowSignUpModal(true)}
                  className="text-[#E31E24] hover:underline font-bold inline-flex items-center gap-1 group"
                >
                  Sign up
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Trust badge */}
            <div className="mt-14 flex items-center gap-3 p-3.5 rounded-xl bg-white/80 border border-gray-100 max-w-sm shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#E31E24] shrink-0" />
              <div className="text-xs text-gray-500 leading-tight">
                Simulated Sandbox Demo • Ready for Express / OAuth Backend Integration
              </div>
            </div>
          </div>

          {/* Right Visual / 3D Red Cubes & Spider Web Graphic */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              
              {/* Use the extracted login visual asset with hanging spider & red cubes */}
              <div className="relative overflow-hidden rounded-3xl">
                <img
                  src="/assets/extracted/login_visual.png"
                  alt="Daily Bugle Red Holographic Network"
                  className="w-full h-auto object-contain transform hover:scale-103 transition-transform duration-500"
                />
              </div>

              {/* Glowing red ambience in background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#E31E24]/15 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            </div>
          </div>

        </div>
      </div>

      {/* Sign Up Modal for simulated signup */}
      {showSignUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowSignUpModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E31E24] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>

            <h2 className="text-xl font-black text-gray-950 font-['Outfit'] uppercase">
              Join Daily Bugle Desk
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Create your citizen reporter profile to submit verified incidents.
            </p>

            <form onSubmit={handleSimulateSignUp} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anshu"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@dailybugle.local"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]"
                />
              </div>

              <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 text-xs text-gray-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E31E24] shrink-0 mt-0.5" />
                <span>New reporters start with initial Karma Level 1 and community review status.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-[#E31E24] hover:bg-[#c9181d] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? 'Creating Citizen Profile...' : 'Complete Sign Up'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-gray-400 border-t border-gray-100/60">
        <span className="font-bold text-gray-600 font-['Outfit']">DAILY <span className="text-[#E31E24]">BUGLE</span></span> — Every report has a story.
      </footer>
    </div>
  );
};
