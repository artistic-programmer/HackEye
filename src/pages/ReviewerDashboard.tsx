import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  reviewerService, 
  ReviewerQueueItem, 
  ReviewerStats, 
  ReviewPackage 
} from '../services/reviewer.service';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  MapPin, 
  Camera, 
  FileText, 
  Users, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  Search, 
  RefreshCw, 
  ArrowLeft,
  X,
  ExternalLink,
  Info,
  Maximize2,
  AlertOctagon,
  Eye
} from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Queue state
  const [queue, setQueue] = useState<ReviewerQueueItem[]>([]);
  const [stats, setStats] = useState<ReviewerStats>({
    pendingCount: 0,
    needsInfoCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
    totalFiltered: 0,
  });

  // Filters
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HIGH_TRUST' | 'MODERATE_TRUST' | 'NEEDS_ATTENTION' | 'NEEDS_INFO' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected dossier inspection
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<ReviewPackage | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [evidenceZoom, setEvidenceZoom] = useState(false);

  // Action Modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyNote, setVerifyNote] = useState('Verified by Daily Bugle editorial team');
  const [verifying, setVerifying] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Insufficient evidence');
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoMsg, setRequestInfoMsg] = useState('');
  const [requestingInfo, setRequestingInfo] = useState(false);

  // Fetch queue data
  const fetchQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      let statusParam: string | undefined = 'UNDER_REVIEW';
      let trustLevelParam: string | undefined = undefined;

      switch (activeTab) {
        case 'PENDING':
          statusParam = 'UNDER_REVIEW';
          break;
        case 'HIGH_TRUST':
          statusParam = 'UNDER_REVIEW';
          trustLevelParam = 'HIGH';
          break;
        case 'MODERATE_TRUST':
          statusParam = 'UNDER_REVIEW';
          trustLevelParam = 'MODERATE';
          break;
        case 'NEEDS_ATTENTION':
          statusParam = 'UNDER_REVIEW';
          trustLevelParam = 'LOW';
          break;
        case 'NEEDS_INFO':
          statusParam = 'NEEDS_INFO';
          break;
        case 'VERIFIED':
          statusParam = 'VERIFIED';
          break;
        case 'REJECTED':
          statusParam = 'REJECTED';
          break;
      }

      const res = await reviewerService.getQueue({
        status: statusParam,
        trustLevel: trustLevelParam,
        category: categoryFilter,
        urgency: urgencyFilter,
        limit: 50,
      });

      setQueue(res.reports);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Queue load error:', err);
      setError(err.message || 'Failed to load reviewer queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab, categoryFilter, urgencyFilter]);

  // Load Dossier when a report is selected
  const openDossier = async (id: string) => {
    setSelectedReportId(id);
    setLoadingDossier(true);
    setDossier(null);
    try {
      const pkg = await reviewerService.getPackage(id);
      setDossier(pkg);
    } catch (err: any) {
      console.error('Error fetching dossier:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to load report package' });
      setSelectedReportId(null);
    } finally {
      setLoadingDossier(false);
    }
  };

  const closeDossier = () => {
    setSelectedReportId(null);
    setDossier(null);
    setEvidenceZoom(false);
  };

  // Human Reviewer Actions
  const handleVerifySubmit = async () => {
    if (!selectedReportId) return;
    setVerifying(true);
    try {
      const res = await reviewerService.verifyReport(selectedReportId, verifyNote);
      setShowVerifyModal(false);
      setNotification({
        type: 'success',
        message: `Report successfully verified! (+10 reporter reputation awarded).`,
      });
      // Refresh active dossier and queue
      await openDossier(selectedReportId);
      await fetchQueue(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedReportId) return;
    setRejecting(true);
    try {
      const res = await reviewerService.rejectReport(selectedReportId, rejectReason, rejectNote);
      setShowRejectModal(false);
      setNotification({
        type: 'info',
        message: `Report rejected. Reason: ${rejectReason} (-5 reporter penalty applied).`,
      });
      await openDossier(selectedReportId);
      await fetchQueue(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Rejection failed.' });
    } finally {
      setRejecting(false);
    }
  };

  const handleRequestInfoSubmit = async () => {
    if (!selectedReportId || !requestInfoMsg.trim()) return;
    setRequestingInfo(true);
    try {
      await reviewerService.requestInfo(selectedReportId, requestInfoMsg.trim());
      setShowRequestInfoModal(false);
      setRequestInfoMsg('');
      setNotification({
        type: 'info',
        message: `Clarifying information requested from reporter. Status updated to NEEDS_INFO.`,
      });
      await openDossier(selectedReportId);
      await fetchQueue(true);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to send information request.' });
    } finally {
      setRequestingInfo(false);
    }
  };

  // Filtered queue with local search query
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return queue;
    const q = searchQuery.toLowerCase().trim();
    return queue.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.address.toLowerCase().includes(q) ||
        (item.reporter?.name && item.reporter.name.toLowerCase().includes(q))
    );
  }, [queue, searchQuery]);

  // Color helper for Trust Score
  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">Critical</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-200">High Urgency</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 border border-yellow-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-gray-100 text-gray-700 border border-gray-200">Low</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-gray-900 font-sans flex flex-col">
      {/* Top Reviewer Nav Header */}
      <header className="bg-gray-950 text-white border-b border-gray-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E31E24]"></span>
              <span className="font-extrabold tracking-tight text-lg text-white font-['Outfit']">
                DAILY <span className="text-[#E31E24]">BUGLE</span>
              </span>
            </Link>
            <span className="text-gray-600">/</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E31E24]" />
              <span className="text-xs uppercase font-extrabold tracking-wider bg-red-950/80 text-red-400 border border-red-800/80 px-2.5 py-0.5 rounded-md font-['Outfit']">
                EDITORIAL VERIFICATION DESK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-gray-200">{user?.name}</div>
              <div className="text-[10px] text-gray-400 font-mono">Role: {user?.role}</div>
            </div>
            <button
              onClick={() => fetchQueue(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-colors cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#E31E24]' : ''}`} />
            </button>
            <Link
              to="/"
              className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Public Site
            </Link>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
            notification.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
              : notification.type === 'error'
              ? 'bg-red-900 text-red-100 border-red-700'
              : 'bg-blue-900 text-blue-100 border-blue-700'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertOctagon className="w-4 h-4 text-red-400" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Reviewer Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">
        
        {/* STATS BAR */}
        <section aria-label="Reviewer Statistics" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Outfit']">Pending Review</div>
              <div className="text-2xl font-black text-gray-900 mt-1">{stats.pendingCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Outfit']">Needs Info</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{stats.needsInfoCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Outfit']">Verified Reports</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{stats.verifiedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Outfit']">Rejected Reports</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{stats.rejectedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* QUEUE FILTERS & TABS */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Tab buttons */}
          <div className="flex items-center overflow-x-auto border-b border-gray-100 scrollbar-none">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'border-[#E31E24] text-[#E31E24] bg-red-50/40'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Pending ({stats.pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('HIGH_TRUST')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'HIGH_TRUST'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              High Trust (&gt;70)
            </button>
            <button
              onClick={() => setActiveTab('MODERATE_TRUST')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'MODERATE_TRUST'
                  ? 'border-amber-600 text-amber-700 bg-amber-50/40'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Moderate Trust (40-70)
            </button>
            <button
              onClick={() => setActiveTab('NEEDS_ATTENTION')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'NEEDS_ATTENTION'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/40'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Needs Attention (&lt;40)
            </button>
            <button
              onClick={() => setActiveTab('NEEDS_INFO')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'NEEDS_INFO'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Needs Info ({stats.needsInfoCount})
            </button>
            <button
              onClick={() => setActiveTab('VERIFIED')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'VERIFIED'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Verified ({stats.verifiedCount})
            </button>
            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === 'REJECTED'
                  ? 'border-gray-800 text-gray-900 bg-gray-100'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({stats.rejectedCount})
            </button>
          </div>

          {/* Secondary Filter Controls & Search */}
          <div className="p-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                Filter:
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-red-500 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Safety">Safety</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Traffic">Traffic</option>
                <option value="Environment">Environment</option>
                <option value="Public Service">Public Service</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-red-500 focus:outline-none"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px] max-w-sm w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, description, citizen..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* QUEUE LIST */}
        <section aria-label="Reviewer Queue List" className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#E31E24] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-['Outfit']">
                Loading Editorial Queue...
              </span>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-8 border border-red-200 text-center text-red-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={() => fetchQueue()}
                className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-gray-900">Queue is Clear</h3>
              <p className="text-xs text-gray-500 mt-1">No reports matching the selected filters require action.</p>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const trustScore = item.trustScore ?? 50;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Trust Gauge + Primary Details */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Trust Gauge Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center ${getTrustScoreColor(trustScore)}`}>
                        <span className="text-xs font-bold text-gray-400 uppercase leading-none text-[9px]">TRUST</span>
                        <span className="text-lg font-black leading-tight">{trustScore}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase mt-1 tracking-tight text-gray-500">
                        {item.trustLevel}
                      </span>
                    </div>

                    {/* Metadata & Title */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {item.category}
                        </span>
                        {getUrgencyBadge(item.urgency)}
                        
                        {item.status === 'VERIFIED' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        )}
                        {item.status === 'NEEDS_INFO' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Needs Info
                          </span>
                        )}

                        <span className="text-[11px] text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-950 font-['Outfit'] group-hover:text-[#E31E24] transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Signals & Badges bar */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-[#E31E24]" />
                          <span className="max-w-[200px] truncate">{item.location?.address || 'Location provided'}</span>
                        </span>

                        {item.evidence && (
                          <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            <Camera className="w-3 h-3 text-gray-500" />
                            Evidence Attached
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
                          <Users className="w-3 h-3 text-blue-500" />
                          {item.corroboratingCount} corroboration{item.corroboratingCount === 1 ? '' : 's'}
                        </span>

                        {item.contradictingCount > 0 && (
                          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px] font-bold border border-red-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            {item.contradictingCount} Contradiction flag
                          </span>
                        )}

                        {item.reporter && (
                          <span className="flex items-center gap-1 text-gray-600 text-[11px]">
                            <span>by {item.reporter.name}</span>
                            <span className="font-mono text-gray-800 bg-gray-100 px-1.5 py-0.2 rounded font-bold">
                              Rep: {item.reporter.reputation ?? 0}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Review Dossier Button */}
                  <div className="shrink-0 w-full lg:w-auto flex lg:flex-col items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <button
                      onClick={() => openDossier(item.id)}
                      className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-[#E31E24] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* REVIEW DOSSIER VIEW (SPLIT SCREEN / MODAL)                                */}
      {/* ========================================================================= */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dossier Header */}
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  DOSSIER #{selectedReportId.slice(-6)}
                </span>
                <span className="text-sm font-bold uppercase tracking-wider text-gray-200 font-['Outfit']">
                  Editorial Review Package
                </span>
                {dossier && (
                  <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    dossier.report.status === 'VERIFIED'
                      ? 'bg-emerald-500 text-white'
                      : dossier.report.status === 'REJECTED'
                      ? 'bg-rose-600 text-white'
                      : dossier.report.status === 'NEEDS_INFO'
                      ? 'bg-blue-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {dossier.report.status}
                  </span>
                )}
              </div>

              <button
                onClick={closeDossier}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Close dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Content Body: Two Column Split View */}
            {loadingDossier || !dossier ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-[#E31E24] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-['Outfit']">
                  Compiling Telemetry & Dossier...
                </span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                
                {/* --------------------------------------------------------------- */}
                {/* LEFT PANEL: CITIZEN REPORT (5 Cols)                             */}
                {/* --------------------------------------------------------------- */}
                <div className="lg:col-span-5 p-6 space-y-5 bg-gray-50/60 overflow-y-auto">
                  <div className="border-b border-gray-200 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E31E24] font-['Outfit']">
                      SOURCE: CITIZEN REPORT
                    </span>
                    <h2 className="text-xl font-black text-gray-950 font-['Outfit'] mt-1 leading-snug">
                      {dossier.report.title}
                    </h2>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Submitted: {new Date(dossier.report.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Citizen Reporter Profile Card */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-['Outfit']">
                      Reporter Telemetry
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center font-bold text-gray-700 text-sm">
                        {dossier.report.reporter?.avatar ? (
                          <img src={dossier.report.reporter.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          dossier.report.reporter?.name?.[0] || 'C'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">{dossier.report.reporter?.name || 'Anonymous Citizen'}</div>
                        <div className="text-xs text-gray-500">{dossier.report.reporter?.email || 'No email attached'}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs font-bold font-mono px-2 py-0.5 rounded bg-red-50 text-[#E31E24] border border-red-200">
                          Rep: {dossier.report.reporter?.reputation ?? 0}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {(dossier.report.reporter?.reputation ?? 0) >= 50 ? 'Trusted Citizen' : 'Standard Reporter'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Incident Description */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 font-['Outfit']">
                      Incident Description
                    </h4>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed">
                      {dossier.report.description}
                    </div>
                  </div>

                  {/* Location Information */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 font-['Outfit']">
                      Reported Location
                    </h4>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#E31E24] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-gray-900">{dossier.report.location?.address}</div>
                        {dossier.report.location?.coordinates && (
                          <div className="font-mono text-gray-400 text-[11px] mt-0.5">
                            Lat: {dossier.report.location.coordinates.latitude}, Lng: {dossier.report.location.coordinates.longitude}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evidence Attachment with Zoom / Playback */}
                  {dossier.report.evidence?.url && (() => {
                    const isVideo = dossier.report.evidence.type === 'video' ||
                      dossier.report.evidence.url.endsWith('.mp4') ||
                      dossier.report.evidence.url.endsWith('.webm');

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
                            <span>Submitted Evidence</span>
                            {isVideo && (
                              <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.2 rounded font-mono font-bold">
                                Video
                              </span>
                            )}
                          </h4>
                          {!isVideo && (
                            <button
                              onClick={() => setEvidenceZoom(true)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Maximize2 className="w-3 h-3" /> Zoom
                            </button>
                          )}
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-950 flex items-center justify-center">
                          {isVideo ? (
                            <video
                              src={dossier.report.evidence.url}
                              controls
                              className="w-full max-h-60 object-contain"
                            />
                          ) : (
                            <div 
                              onClick={() => setEvidenceZoom(true)}
                              className="cursor-pointer relative group w-full"
                            >
                              <img
                                src={dossier.report.evidence.url}
                                alt="Evidence"
                                className="w-full max-h-56 object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                Click to enlarge
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* --------------------------------------------------------------- */}
                {/* RIGHT PANEL: REVIEW PACKAGE (7 Cols)                            */}
                {/* --------------------------------------------------------------- */}
                <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
                  
                  {/* A. TRUST SCORE & TELEMETRY BREAKDOWN */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-['Outfit']">
                          DAILY BUGLE TRUST ENGINE
                        </span>
                        <h3 className="text-base font-black text-gray-900 font-['Outfit'] flex items-center gap-2">
                          Trust Signals Telemetry
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-950 font-['Outfit']">
                          {dossier.trustAnalysis.score}<span className="text-sm font-normal text-gray-400">/100</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          dossier.trustAnalysis.score >= 70 ? 'bg-emerald-100 text-emerald-800' :
                          dossier.trustAnalysis.score >= 40 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {dossier.trustAnalysis.level} Trust Strength
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 italic">
                      "{dossier.trustAnalysis.explanation}"
                    </p>

                    {/* Signal Breakdown Weights */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Outfit']">
                        Supporting Signal Strengths
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase block">Reporter Trust</span>
                          <span className="font-bold text-gray-800">
                            {dossier.trustAnalysis.signals.reporterReputation >= 0 ? `+${dossier.trustAnalysis.signals.reporterReputation}` : dossier.trustAnalysis.signals.reporterReputation} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase block">Evidence Quality</span>
                          <span className="font-bold text-emerald-600">
                            +{dossier.trustAnalysis.signals.evidence} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase block">Specificity</span>
                          <span className="font-bold text-gray-800">
                            +{dossier.trustAnalysis.signals.specificity} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase block">Spatial/Location</span>
                          <span className="font-bold text-gray-800">
                            +{dossier.trustAnalysis.signals.location} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase block">Corroboration</span>
                          <span className="font-bold text-blue-600">
                            +{dossier.trustAnalysis.signals.corroboration} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase block">Contradictions</span>
                          <span className={`font-bold ${dossier.trustAnalysis.signals.contradiction < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {dossier.trustAnalysis.signals.contradiction} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Populated Corroborations */}
                    {dossier.corroboration.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-['Outfit'] mb-1.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Corroborating Incident Reports ({dossier.corroboration.length})
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {dossier.corroboration.map((c) => (
                            <div key={c.id} className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate max-w-xs">{c.title}</span>
                              <span className="text-[11px] font-mono text-blue-700 font-bold shrink-0">Trust: {c.trustScore}/100</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Populated Contradictions */}
                    {dossier.contradictions.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 font-['Outfit'] mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          Conflicting / Contradicting Reports ({dossier.contradictions.length})
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {dossier.contradictions.map((ct) => (
                            <div key={ct.id} className="p-2 rounded-lg bg-rose-50/60 border border-rose-200 text-xs flex items-center justify-between">
                              <span className="font-medium text-rose-950 truncate max-w-xs">{ct.title}</span>
                              <span className="text-[11px] font-mono text-rose-700 font-bold shrink-0">{ct.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* B. GEMINI 3.5 FLASH-LITE AI ANALYSIS */}
                  <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white p-5 rounded-xl border border-gray-800 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-red-500" />
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400 block font-['Outfit']">
                            AUTOMATED CITIZEN INTAKE
                          </span>
                          <h3 className="text-base font-black text-white font-['Outfit']">
                            Gemini 3.5 Flash-Lite Analysis
                          </h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                        Urgency: {dossier.aiAnalysis.urgency}
                      </span>
                    </div>

                    {/* AI Executive Summary */}
                    <div className="bg-gray-800/60 p-3.5 rounded-lg border border-gray-700/60 text-xs text-gray-200 leading-relaxed">
                      {dossier.aiAnalysis.summary}
                    </div>

                    {/* Key Facts Extracted */}
                    {dossier.aiAnalysis.keyClaims && dossier.aiAnalysis.keyClaims.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 font-['Outfit']">
                          Extracted Factual Claims
                        </div>
                        <ul className="space-y-1 text-xs text-gray-300">
                          {dossier.aiAnalysis.keyClaims.map((claim, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-red-500 font-bold">•</span>
                              <span>{claim}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Information / Signals */}
                    {dossier.aiAnalysis.missingInformation && dossier.aiAnalysis.missingInformation.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 font-['Outfit']">
                          Information Gaps Detected
                        </div>
                        <ul className="space-y-1 text-xs text-amber-200/80">
                          {dossier.aiAnalysis.missingInformation.map((gap, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suspicious Signals */}
                    {dossier.aiAnalysis.suspiciousSignals && dossier.aiAnalysis.suspiciousSignals.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1 font-['Outfit']">
                          Attention Flags
                        </div>
                        <ul className="space-y-1 text-xs text-rose-300">
                          {dossier.aiAnalysis.suspiciousSignals.map((flag, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* MANDATORY AI DISCLAIMER */}
                    <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-3 text-[11px] text-red-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>EDITORIAL RULE:</strong> AI provides analysis only. Verification decisions are performed exclusively by human editorial reviewers.
                      </span>
                    </div>
                  </div>

                  {/* C. REVIEW HISTORY & AUDIT TRAIL */}
                  {dossier.report.reviewHistory && dossier.report.reviewHistory.length > 0 && (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-['Outfit']">
                        Audit Trail & Prior Decisions
                      </div>
                      <div className="space-y-2">
                        {dossier.report.reviewHistory.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-bold uppercase ${
                                item.action === 'VERIFIED' ? 'text-emerald-700' :
                                item.action === 'REJECTED' ? 'text-rose-700' : 'text-blue-700'
                              }`}>
                                Action: {item.action}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {item.reason && (
                              <div className="text-gray-600 font-medium">Reason: {item.reason}</div>
                            )}
                            {item.note && (
                              <div className="text-gray-500 italic mt-0.5">Note: "{item.note}"</div>
                            )}
                            {item.reviewer?.name && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                Reviewer: {item.reviewer.name} ({item.reviewer.role || 'Reviewer'})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Review Request if NEEDS_INFO */}
                  {dossier.report.reviewRequest && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">
                      <div className="font-bold uppercase text-[10px] text-blue-700 font-['Outfit'] mb-1">
                        Active Information Request to Citizen
                      </div>
                      <p className="italic font-medium">"{dossier.report.reviewRequest.message}"</p>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ACTION BAR: STICKY AT BOTTOM */}
            {dossier && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  <span className="font-bold text-gray-700">Target Report:</span> {dossier.report.title}
                </div>

                <div className="flex items-center gap-3">
                  {/* REQUEST INFO BUTTON */}
                  <button
                    onClick={() => setShowRequestInfoModal(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Request Info</span>
                  </button>

                  {/* REJECT BUTTON */}
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Report</span>
                  </button>

                  {/* VERIFY BUTTON */}
                  <button
                    onClick={() => setShowVerifyModal(true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTION DIALOGS                                                            */}
      {/* ========================================================================= */}

      {/* 1. VERIFY CONFIRMATION DIALOG */}
      {showVerifyModal && dossier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-black font-['Outfit'] text-gray-900">
                Confirm Human Verification
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              You are certifying this civic incident as <strong>VERIFIED</strong>. This decision is made exclusively by human editorial authority.
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
              ✓ Citizen <strong>{dossier.report.reporter?.name || 'reporter'}</strong> will be awarded <strong>+10 Reputation points</strong>.
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Editorial Review Note (Public)
              </label>
              <input
                type="text"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Verified by Daily Bugle editorial desk"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySubmit}
                disabled={verifying}
                className="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECT CONFIRMATION DIALOG */}
      {showRejectModal && dossier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-black font-['Outfit'] text-gray-900">
                Reject Civic Report
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Rejecting will mark the report as <strong>REJECTED</strong>. A -5 reputation penalty will be applied to the reporter.
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Rejection Reason Category
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
              >
                <option value="Insufficient evidence">Insufficient evidence</option>
                <option value="Unable to corroborate">Unable to corroborate</option>
                <option value="Duplicate report">Duplicate report</option>
                <option value="Outdated / resolved incident">Outdated / resolved incident</option>
                <option value="False / inaccurate information">False / inaccurate information</option>
                <option value="Spam / malicious submission">Spam / malicious submission</option>
                <option value="Outside coverage area">Outside coverage area</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Internal Reviewer Note (Audit Trail)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                placeholder="Optional editorial rationale or context..."
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejecting}
                className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {rejecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REQUEST INFORMATION DIALOG */}
      {showRequestInfoModal && dossier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <HelpCircle className="w-6 h-6" />
              <h3 className="text-lg font-black font-['Outfit'] text-gray-900">
                Request Clarification from Citizen
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              This updates the status to <strong>NEEDS_INFO</strong> without penalizing reporter reputation. Specify exactly what information is missing (e.g. clearer photo, exact cross-street, or timestamp confirmation).
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Message to Citizen Reporter
              </label>
              <textarea
                value={requestInfoMsg}
                onChange={(e) => setRequestInfoMsg(e.target.value)}
                rows={3}
                placeholder="e.g. Please provide a clear photograph showing the street corner or exact block number."
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRequestInfoModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfoSubmit}
                disabled={requestingInfo || !requestInfoMsg.trim()}
                className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {requestingInfo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EVIDENCE LIGHTBOX ZOOM MODAL */}
      {evidenceZoom && dossier?.report.evidence?.url && (
        <div 
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setEvidenceZoom(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
            <button
              onClick={() => setEvidenceZoom(false)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={dossier.report.evidence.url}
              alt="Evidence Full View"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ReviewerDashboard;
