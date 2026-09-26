import React from 'react';
import { ReportStatus } from '../../types/report';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ReportStatus;
  variant?: 'solid' | 'dot' | 'outline';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'dot',
  size = 'sm' 
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  if (status === 'VERIFIED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-emerald-200/80 bg-emerald-50 text-emerald-700 shadow-xs ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Verified
      </span>
    );
  }

  if (status === 'UNDER REVIEW') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-purple-200/80 bg-purple-50 text-purple-700 shadow-xs ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
        Under Review
      </span>
    );
  }

  // REPORTED
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-gray-200 bg-gray-100 text-gray-600 shadow-xs ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
      Reported
    </span>
  );
};
