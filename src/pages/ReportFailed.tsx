import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { 
  getStoredDraft, 
  getLastFailedReport, 
  saveStoredReport, 
  clearStoredDraft, 
  clearLastFailedReport 
} from '../data/mockReports';
import { ReportItem } from '../types/report';
import { 
  RotateCw, 
  FileEdit, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle,
  Server,
  Terminal
} from 'lucide-react';

export const ReportFailed: React.FC = () => {
  const navigate = useNavigate();
  const draft = getLastFailedReport() || getStoredDraft();
  
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // If no draft exists at all, redirect to /report
  React.useEffect(() => {
    if (!draft) {
      navigate('/report', { replace: true });
    }
  }, [draft, navigate]);

  if (!draft) return null;

  const handleTryAgain = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      // Simulate successful retry
      const newReport: ReportItem = {
        id: `rep-${Date.now().toString(36)}`,
        title: draft.description.slice(0, 60) + (draft.description.length > 60 ? '...' : ''),
        description: draft.description,
        category: draft.category,
        status: 'UNDER REVIEW', // Never automatically marked as VERIFIED
        location: draft.location,
        timeAgo: 'Just now',
        timestamp: Date.now(),
        corroboratingCount: 1,
        imageUrl: draft.evidencePreview || '/assets/extracted/card_signal.png',
        aiTrustScore: 0.65,
      };

      saveStoredReport(newReport);
      clearStoredDraft();
      clearLastFailedReport();
      navigate('/reports');
    }, 1000);
  };

  const handleEditReport = () => {
    // Draft is already preserved in localStorage, return to /report to edit
    navigate('/report');
  };

  return (
    <PageLayout minimalFooter>
      <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none -z-10"></div>

        {/* Top Tracker */}
        <div className="w-8 h-1 bg-[#E31E24] mb-3 rounded-full"></div>
        <div className="text-[11px] font-mono font-bold tracking-widest text-gray-400 uppercase mb-6">
          REPORT SUBMISSION
        </div>

        {/* 3D Holographic Failure Diagram matching Report not sent.png */}
        <div className="w-full max-w-xl mb-8 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <img
            src="/assets/extracted/failed_diagram.png"
            alt="Report Submission Interrupted"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E31E24] text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-[#E31E24] animate-ping"></span>
          SUBMISSION FAILED
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
          REPORT <span className="text-[#E31E24]">NOT SENT</span>
        </h1>

        {/* Description */}
        <div className="mt-4 text-sm sm:text-base text-gray-600 max-w-md space-y-1">
          <p className="font-bold text-gray-900">We couldn't submit your report.</p>
          <p>Your report has not been published.</p>
          <p>Please try again.</p>
        </div>

        {/* Your Report is Still Safe Callout Box */}
        <div className="mt-8 max-w-md w-full p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center gap-3 text-left">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Your report is still safe.</p>
            <p className="text-xs text-gray-600">Nothing has been published yet.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={handleTryAgain}
            disabled={isRetrying}
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying Transmission...' : 'TRY AGAIN'}</span>
          </button>

          <button
            onClick={handleEditReport}
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs active:scale-95"
          >
            <FileEdit className="w-4 h-4 text-gray-600" />
            <span>EDIT REPORT</span>
          </button>
        </div>

        {/* Expandable Technical Details */}
        <div className="mt-8 w-full max-w-md">
          <button
            type="button"
            onClick={() => setTechDetailsOpen(!techDetailsOpen)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
          >
            <span>Technical details</span>
            {techDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {techDetailsOpen && (
            <div className="mt-3 p-4 bg-gray-900 text-gray-300 rounded-xl text-left font-mono text-xs space-y-2 border border-gray-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-gray-400 border-b border-gray-800 pb-2">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-red-400" />
                  DIAGNOSTIC TELEMETRY
                </span>
                <span className="text-red-400 font-bold">STATUS 504</span>
              </div>
              <p><span className="text-gray-500">Error:</span> GATEWAY_TIMEOUT_CLUSTER_SYNC</p>
              <p><span className="text-gray-500">Target Node:</span> bugle-verif-node-bhubaneswar-01</p>
              <p><span className="text-gray-500">Draft Category:</span> {draft.category}</p>
              <p><span className="text-gray-500">Location Tag:</span> {draft.location}</p>
              <p className="text-gray-400 text-[11px] truncate">
                <span className="text-gray-500">Payload:</span> "{draft.description.slice(0, 40)}..."
              </p>
              <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-800">
                Draft securely retained in local storage cache.
              </p>
            </div>
          )}
        </div>

        {/* Back to reports link */}
        <div className="mt-8">
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-gray-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO REPORTS</span>
          </Link>
        </div>

      </div>
    </PageLayout>
  );
};
