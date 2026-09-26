import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { RotateCw, WifiOff, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Offline: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, isSimulatedOffline, setSimulatedOffline } = useOnlineStatus();

  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Return route from location state or default to '/'
  const returnTo = (location.state as { from?: string })?.from || '/';

  const handleTryAgain = () => {
    setIsChecking(true);
    setStatusMessage(null);

    setTimeout(() => {
      setIsChecking(false);
      if (isOnline) {
        setStatusMessage('Signal restored! Returning to previous screen...');
        setTimeout(() => {
          navigate(returnTo, { replace: true });
        }, 600);
      } else {
        setStatusMessage('Still unable to reach Bugle Signal Network. Please check your WiFi or mobile data.');
      }
    }, 800);
  };

  const handleSimulateRestore = () => {
    setSimulatedOffline(false);
    setStatusMessage('Simulated offline disabled. Network connection restored!');
    setTimeout(() => {
      navigate(returnTo, { replace: true });
    }, 500);
  };

  return (
    <PageLayout minimalFooter>
      <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none -z-10"></div>

        {/* 3D Holographic Diagram matching Signaloffline.png */}
        <div className="w-full max-w-2xl mb-8 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <img
            src="/assets/extracted/offline_diagram.png"
            alt="Signal Connection Severed"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          CONNECTION OFFLINE
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight leading-tight">
          SIGNAL<br />
          <span className="text-[#E31E24]">OFFLINE</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-md font-medium">
          You're currently offline.<br />
          Check your internet connection and try again.
        </p>

        {/* Try Again Button */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          <button
            onClick={handleTryAgain}
            disabled={isChecking}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Reconnecting...' : 'TRY AGAIN'}</span>
          </button>

          {/* Dev Simulation Reset Button */}
          {isSimulatedOffline && (
            <button
              onClick={handleSimulateRestore}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Restore Connection (Dev Toggle)</span>
            </button>
          )}
        </div>

        {/* Dynamic status feedback notice */}
        {statusMessage && (
          <div className={`mt-4 max-w-md p-3 rounded-xl text-xs font-medium ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Offline Callout Box matching Signaloffline.png */}
        <div className="mt-8 max-w-md w-full p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center gap-3 text-left">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Your connection appears to be offline.</p>
            <p className="text-xs text-gray-600">Check your Wi-Fi or mobile data connection.</p>
          </div>
        </div>

      </div>
    </PageLayout>
  );
};
