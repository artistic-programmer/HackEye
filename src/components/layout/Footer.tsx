import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  minimal?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false }) => {
  if (minimal) {
    return (
      <footer className="w-full py-8 mt-auto text-center z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="w-full border-t border-gray-200/50 mb-6"></div>
          {/* Brand */}
          <div className="flex items-center justify-center gap-1 mb-1 select-none">
            <span className="font-black text-xs sm:text-sm tracking-wider text-gray-950 font-['Outfit']">
              DAILY <span className="text-[#E31E24]">BUGLE</span>
            </span>
          </div>
          {/* Tagline */}
          <p className="text-[11px] text-gray-500 font-medium">
            Every report has a story.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full py-10 bg-white/70 border-t border-gray-200/60 backdrop-blur-sm mt-auto text-center z-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Red accent line indicator */}
        <div className="w-7 h-0.5 bg-[#E31E24] mx-auto mb-4 rounded-full"></div>

        {/* Brand */}
        <div className="flex items-center justify-center gap-1 mb-1 select-none">
          <span className="font-black text-sm tracking-wider text-gray-950 font-['Outfit']">
            DAILY <span className="text-[#E31E24]">BUGLE</span>
          </span>
        </div>

        {/* Tagline */}
        <p className="text-xs text-gray-400 font-normal tracking-wide">
          Every report has a story.
        </p>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>•</span>
          <Link to="/reports" className="hover:text-gray-700 transition-colors">Live Reports</Link>
          <span>•</span>
          <Link to="/report" className="hover:text-gray-700 transition-colors">Submit Report</Link>
          <span>•</span>
          <span className="text-gray-300">AI Trust Layer v2.4</span>
        </div>
      </div>
    </footer>
  );
};
