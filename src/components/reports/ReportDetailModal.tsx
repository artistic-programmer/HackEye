import React from 'react';
import { ReportItem } from '../../types/report';
import { StatusBadge } from '../ui/StatusBadge';
import { reportService } from '../../services/report.service';
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
  Share2,
  Calendar,
  Layers,
  ArrowRight
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
  const [correlations, setCorrelations] = React.useState<any>(null);

  React.useEffect(() => {
    if (report?.id) {
      reportService.getReportCorrelations(report.id)
        .then((res) => setCorrelations(res))
        .catch(() => setCorrelations(null));
    }
  }, [report?.id]);

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

          {/* EVIDENCE SECTION (Image or Video) */}
          {(() => {
            const evidenceObj = typeof report.evidence === 'object' ? report.evidence : null;
            const evidenceUrl = evidenceObj?.url || (typeof report.evidence === 'string' ? report.evidence : report.imageUrl);
            const isVideo = evidenceObj?.resourceType === 'video' || (evidenceUrl && (evidenceUrl.endsWith('.mp4') || evidenceUrl.endsWith('.webm')));

            if (!evidenceUrl) return null;

            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider font-['Outfit']">
                  <span>SUPPORTING EVIDENCE</span>
                  {isVideo ? (
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-mono font-bold">VIDEO</span>
                  ) : (
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold">IMAGE</span>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-950 flex items-center justify-center max-h-72">
                  {isVideo ? (
                    <video
                      src={evidenceUrl}
                      controls
                      className="w-full max-h-72 object-contain"
                    />
                  ) : (
                    <img
                      src={evidenceUrl}
                      alt={report.title}
                      className="w-full h-full object-cover max-h-72 hover:scale-102 transition-transform duration-300"
                    />
                  )}
                </div>
              </div>
            );
          })()}

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 font-['Outfit']">
              Incident Description
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              {report.description}
            </p>
          </div>

          {/* REAL-WORLD INCIDENT CLUSTER & CORROBORATION TIMELINE */}
          {correlations?.incident && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-gray-900 font-['Outfit']">
                    INCIDENT CLUSTER #{correlations.incident._id?.slice(-6)}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {correlations.incident.independentReportersCount} Independent Citizen Reports
                </span>
              </div>

              {correlations.incident.timeline?.length > 1 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 font-['Outfit'] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Citizen Report Timeline</span>
                  </div>
                  <div className="space-y-2 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {correlations.incident.timeline.map((entry: any, idx: number) => (
                      <div key={idx} className="relative pl-3 text-xs">
                        <span className="absolute -left-[14px] top-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800">{entry.reporterName || 'Citizen'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px] line-clamp-1 mt-0.5">"{entry.title}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONFLICTING / CONTRADICTING REPORTS BANNER */}
              {correlations.hasContradiction && correlations.contradictingReports?.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-1.5 animate-pulse">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold uppercase tracking-wider text-[11px] font-['Outfit']">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>CONFLICTING REPORTS DETECTED</span>
                  </div>
                  <p className="text-rose-700 text-[11px]">
                    Citizen reports in this cluster contain conflicting claims regarding the status of this incident. The human reviewer desk has flagged this for inspection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Daily Bugle Trust Engine Telemetry */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-50/50 via-gray-50 to-blue-50/50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E31E24]" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 font-['Outfit']">
                  Daily Bugle Trust Signals
                </span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-800">
                Trust Score: {report.aiTrustScore && report.aiTrustScore <= 1 ? Math.round(report.aiTrustScore * 100) : (report.aiTrustScore || 75)}/100
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Reporter Signal</span>
                <span className="font-bold text-gray-800">Active</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Spatial Cluster</span>
                <span className="font-bold text-gray-800">r ≤ 500m</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Corroboration</span>
                <span className="font-bold text-blue-600">{report.corroboratingCount} Supporting</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-[10px] text-gray-400 block">Human Review</span>
                <span className={`font-bold ${
                  report.status === 'VERIFIED' ? 'text-emerald-600' :
                  report.status === 'REJECTED' ? 'text-rose-600' :
                  report.status === 'NEEDS_INFO' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {report.status === 'VERIFIED' ? 'Verified by Bugle' :
                   report.status === 'REJECTED' ? 'Rejected' :
                   report.status === 'NEEDS_INFO' ? 'Clarification Requested' : 'Pending Human Review'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 bg-white/70 p-2 rounded-lg border border-gray-100 italic">
              Verification decisions are made exclusively by Daily Bugle human reviewers. AI and Trust Engine provide signal telemetry only.
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
