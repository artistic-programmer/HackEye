import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  minimal?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false }) => {
  return (
    <footer className="w-full py-10 bg-white/60 border-t border-gray-100/80 backdrop-blur-sm mt-auto text-center">
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

        {!minimal && (
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
            <Link to="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span>•</span>
            <Link to="/reports" className="hover:text-gray-700 transition-colors">Live Reports</Link>
            <span>•</span>
            <Link to="/report" className="hover:text-gray-700 transition-colors">Submit Report</Link>
            <span>•</span>
            <span className="text-gray-300">AI Trust Layer v2.4</span>
          </div>
        )}
      </div>
    </footer>
  );
};
