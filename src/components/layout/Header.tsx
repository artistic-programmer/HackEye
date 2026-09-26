import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  Plus, 
  ShieldCheck, 
  FileText, 
  Wifi, 
  WifiOff,
  User as UserIcon 
} from 'lucide-react';

interface HeaderProps {
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, isSimulatedOffline, toggleSimulateOffline } = useOnlineStatus();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleNavClick = (sectionId?: string) => {
    if (sectionId) {
      if (location.pathname === '/') {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(`/#${sectionId}`);
      }
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleReportCTA = () => {
    if (isAuthenticated) {
      navigate('/report');
    } else {
      navigate('/login', { state: { from: '/report' } });
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all ${
        transparent 
          ? 'bg-white/60 backdrop-blur-md border-b border-gray-200/40' 
          : 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
      }`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E31E24] group-hover:scale-125 transition-transform"></span>
            <span className="font-extrabold tracking-tight text-xl sm:text-2xl text-gray-950 font-['Outfit'] flex items-center">
              DAILY <span className="text-[#E31E24] ml-1.5 font-black">BUGLE</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <Link
              to="/"
              className={`relative px-4 py-2 text-xs lg:text-sm font-bold tracking-wide uppercase transition-colors ${
                isActive('/') && location.hash === '' 
                  ? 'text-gray-950' 
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Home
              {isActive('/') && location.hash === '' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#E31E24] rounded-full"></span>
              )}
            </Link>

            <Link
              to="/reports"
              className={`relative px-4 py-2 text-xs lg:text-sm font-bold tracking-wide uppercase transition-colors ${
                isActive('/reports') 
                  ? 'text-gray-950' 
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Reports
              {isActive('/reports') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#E31E24] rounded-full"></span>
              )}
            </Link>

            <button
              onClick={() => handleNavClick('how-it-works')}
              className="relative px-4 py-2 text-xs lg:text-sm font-bold tracking-wide uppercase text-gray-600 hover:text-gray-950 transition-colors"
            >
              How It Works
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className="relative px-4 py-2 text-xs lg:text-sm font-bold tracking-wide uppercase text-gray-600 hover:text-gray-950 transition-colors"
            >
              About
            </button>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Header Report CTA if on reports or other pages */}
            {location.pathname === '/reports' && (
              <button
                onClick={handleReportCTA}
                className="flex items-center gap-1.5 bg-[#E31E24] hover:bg-[#c9181d] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Report an Incident</span>
              </button>
            )}

            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-gray-100/80 transition-all border border-transparent hover:border-gray-200"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-gray-700 font-bold text-xs">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E31E24] border border-red-100">
                          <ShieldCheck className="w-3 h-3 text-[#E31E24]" />
                          TRUSTED
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-gray-50 text-center">
                        <div>
                          <div className="text-xs font-bold text-gray-900">{user.reputation}</div>
                          <div className="text-[10px] text-gray-400">Reputation</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{user.reportsCount}</div>
                          <div className="text-[10px] text-gray-400">Reports</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-600">{user.verifiedCount}</div>
                          <div className="text-[10px] text-gray-400">Verified</div>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/report"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#E31E24]"
                      >
                        <Plus className="w-4 h-4" />
                        Submit New Report
                      </Link>
                      <Link
                        to="/reports"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#E31E24]"
                      >
                        <FileText className="w-4 h-4" />
                        View Live Reports
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold tracking-wider uppercase text-gray-800 hover:border-gray-900 transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-base font-semibold ${
              isActive('/') ? 'text-[#E31E24] bg-red-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Home
          </Link>
          <Link
            to="/reports"
            className={`block px-3 py-2 rounded-md text-base font-semibold ${
              isActive('/reports') ? 'text-[#E31E24] bg-red-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Reports
          </Link>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            About
          </button>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <button
              onClick={handleReportCTA}
              className="w-full flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Report an Incident
            </button>

            {isAuthenticated && user ? (
              <div className="pt-2">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-xs">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name[0]
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">Reputation: {user.reputation}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full mt-2 flex items-center justify-center gap-2 text-red-600 bg-red-50 py-2 rounded-lg text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full flex items-center justify-center py-2.5 rounded-lg border border-gray-300 text-sm font-bold tracking-wide uppercase text-gray-800 hover:bg-gray-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
