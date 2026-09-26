import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <PageLayout 
      minimalFooter 
      transparentHeader
      className="bg-[url('/assets/backgrounds/notfound_404_bg.png')] bg-top bg-cover bg-no-repeat min-h-screen"
    >
      <div className="relative pt-64 sm:pt-72 md:pt-80 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center">
        {/* 404 Numbers */}
        <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-950 font-['Outfit'] tracking-tight leading-none drop-shadow-sm">
          404
        </div>

        {/* SIGNAL LOST Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight mt-3">
          SIGNAL <span className="text-[#E31E24]">LOST</span>
        </h1>

        {/* Red accent line */}
        <div className="w-8 h-1 bg-[#E31E24] mx-auto mt-4 mb-4 rounded-full"></div>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 max-w-md font-medium leading-relaxed">
          The page you're looking for doesn't exist<br />
          or may have been moved.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>BACK HOME</span>
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-2 bg-white/95 hover:bg-white text-gray-800 border border-gray-300 px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95 group cursor-pointer"
          >
            <span>REPORTS</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};
