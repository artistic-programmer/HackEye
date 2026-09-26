import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <PageLayout minimalFooter>
      <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none -z-10"></div>

        {/* 3D Spider Illustration matching Error_404_page.png */}
        <div className="relative w-72 sm:w-80 mb-2 flex items-center justify-center">
          <img
            src="/assets/extracted/spider_404.png"
            alt="Bugle Drone Spider Lost Signal"
            className="w-full h-auto object-contain animate-bounce-slow"
          />
          {/* Subtle red eye glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#E31E24]/10 rounded-full blur-xl -z-10"></div>
        </div>

        {/* 404 Numbers */}
        <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-950 font-['Outfit'] tracking-tight leading-none">
          404
        </div>

        {/* SIGNAL LOST Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight mt-2">
          SIGNAL <span className="text-[#E31E24]">LOST</span>
        </h1>

        {/* Red accent line */}
        <div className="w-8 h-1 bg-[#E31E24] mx-auto mt-4 mb-4 rounded-full"></div>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 max-w-md font-medium">
          The page you're looking for doesn't exist<br />
          or may have been moved.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>BACK HOME</span>
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 group"
          >
            <span>REPORTS</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
          </Link>
        </div>

      </div>
    </PageLayout>
  );
};
