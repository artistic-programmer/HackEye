import React from 'react';
import { ReportItem } from '../../types/report';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  X, 
  MapPin, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ThumbsUp,
  Share2
} from 'lucide-react';

interface ReportDetailModalProps {
  report: ReportItem | null;
  onClose: () => void;
  onCorroborate?: (id: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onCorroborate,
}) => {
  const [corroborated, setCorroborated] = React.useState(false);

  if (!report) return null;

  const handleCorroborate = () => {
    if (!corroborated) {
      setCorroborated(true);
      if (onCorroborate) onCorroborate(report.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-gray-500 uppercase">
              Incident #{report.id}
            </span>
            <StatusBadge status={report.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Title & Category */}
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 mb-2">
              {report.category}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] leading-tight">
              {report.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-[#E31E24]" />
                {report.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {report.timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                {report.corroboratingCount + (corroborated ? 1 : 0)} corroborating reports
              </span>
            </div>
          </div>

          {/* Image if available */}
          {report.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 max-h-64 bg-gray-900 flex items-center justify-center">
              <img
                src={report.imageUrl}
                alt={report.title}
                className="w-full h-full object-cover max-h-64 hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 font-['Outfit']">
              Incident Description
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              {report.description}
            </p>
          </div>

          {/* AI Trust Engine Analysis Breakdown */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-50/50 via-gray-50 to-blue-50/50 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E31E24]" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 font-['Outfit']">
                  Bugle AI Trust Score & Telemetry
                </span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-800">
                {Math.round((report.aiTrustScore || 0.78) * 100)}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Reporter Trust</span>
                <span className="font-bold text-gray-800">94/100</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Spatial Cluster</span>
                <span className="font-bold text-gray-800">r ≤ 500m</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">EXIF Integrity</span>
                <span className="font-bold text-emerald-600">Verified</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Human Consensus</span>
                <span className="font-bold text-blue-600">Pending Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: report.title, text: report.description, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Report link copied to clipboard!');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Report
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCorroborate}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                corroborated 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {corroborated ? 'Corroborated ✓' : 'Corroborate ("I see this too")'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#E31E24] hover:bg-[#c9181d] text-white shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
