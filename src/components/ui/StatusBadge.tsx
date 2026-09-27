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
        Verified by Bugle
      </span>
    );
  }

  if (status === 'UNDER_REVIEW' || status === 'UNDER REVIEW') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-amber-200/80 bg-amber-50 text-amber-800 shadow-xs ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Under Review
      </span>
    );
  }

  if (status === 'NEEDS_INFO') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-blue-200/80 bg-blue-50 text-blue-700 shadow-xs ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Needs Info
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border border-rose-200/80 bg-rose-50 text-rose-700 shadow-xs ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Rejected
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
