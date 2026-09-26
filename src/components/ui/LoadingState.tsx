import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Scanning Bugle Signal Network...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[#E31E24] border-t-transparent animate-spin"></div>
        <div className="absolute inset-3 rounded-full bg-red-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E31E24] animate-ping"></div>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-700 font-['Outfit'] tracking-wide uppercase">{message}</p>
      <p className="text-xs text-gray-400 mt-1">Cross-referencing verified spatio-temporal nodes</p>
    </div>
  );
};
