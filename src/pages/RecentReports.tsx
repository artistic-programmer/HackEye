import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLayout } from '../components/layout/PageLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ReportDetailModal } from '../components/reports/ReportDetailModal';
import { ReportItem, ReportCategory, ReportStatus } from '../types/report';
import { getStoredReports } from '../data/mockReports';
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  ArrowRight, 
  Plus, 
  Filter, 
  SlidersHorizontal, 
  ShieldCheck, 
  Map as MapIcon, 
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const CATEGORIES: ('All' | ReportCategory)[] = [
  'All',
  'Safety',
  'Infrastructure',
  'Traffic',
  'Environment',
  'Public Service',
];

export const RecentReports: React.FC = () => {
  const { isAuthenticated, setIntendedDestination } = useAuth();
  const navigate = useNavigate();

  // State
  const [reports, setReports] = useState<ReportItem[]>(getStoredReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ReportCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'corroborated' | 'trust'>('recent');

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [showFullMapModal, setShowFullMapModal] = useState(false);

  const handleReportCTA = () => {
    if (isAuthenticated) {
      navigate('/report');
    } else {
      setIntendedDestination('/report');
      navigate('/login', { state: { from: '/report' } });
    }
  };

  // Filtered and sorted reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchDesc = r.description.toLowerCase().includes(q);
          const matchLoc = r.location.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc) return false;
        }

        // Category
        if (selectedCategory !== 'All' && r.category !== selectedCategory) {
          return false;
        }

        // Status
        if (selectedStatus !== 'All' && r.status !== selectedStatus) {
          return false;
        }

        // Location
        if (selectedLocation !== 'All' && !r.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'corroborated') {
          return b.corroboratingCount - a.corroboratingCount;
        }
        if (sortBy === 'trust') {
          return (b.aiTrustScore || 0) - (a.aiTrustScore || 0);
        }
        return b.timestamp - a.timestamp;
      });
  }, [reports, searchQuery, selectedCategory, selectedStatus, selectedLocation, sortBy]);

  // Featured report: first verified or featured report, or first item
  const featuredReport = useMemo(() => {
    return filteredReports.find((r) => r.isFeatured) || filteredReports[0];
  }, [filteredReports]);

  // Grid reports: exclude featured report from grid if featured is displayed
  const gridReports = useMemo(() => {
    if (!featuredReport) return [];
    return filteredReports.filter((r) => r.id !== featuredReport.id);
  }, [filteredReports, featuredReport]);

  const handleCorroborate = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, corroboratingCount: r.corroboratingCount + 1 } : r))
    );
  };

  return (
    <PageLayout>
      <div className="relative py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-cyber-grid opacity-25 pointer-events-none -z-10"></div>

        {/* Top Header Banner matching recent_reports.png */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-gray-200/80 gap-6">
          <div>
            <div className="text-[11px] font-mono font-bold tracking-widest text-gray-400 uppercase mb-2">
              CIVIC REPORTS. STRONGER CITIES.
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
              RECENT <span className="text-[#E31E24]">REPORTS</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600 font-medium">
              See what's happening, where it's happening, and what's being verified.
            </p>

            {/* Live Stats Pill Bar */}
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 sm:gap-4 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs shadow-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE REPORTS
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600 font-medium">
                <strong className="text-gray-900">{reports.length + 115}</strong> reports submitted recently
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                Last updated moments ago
              </span>
            </div>
          </div>

          {/* Right Watermark */}
          <div className="hidden lg:block text-right text-[11px] font-mono uppercase tracking-[0.25em] text-gray-400 leading-loose select-none">
            PEOPLE<br />
            REPORT<br />
            CITIES<br />
            IMPROVE
          </div>
        </div>

        {/* Search & Filter Bar Section */}
        <div className="space-y-4 mb-8">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports, locations, or incidents..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24] shadow-xs transition-all"
            />
          </div>

          {/* Filter Pills & Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1 hidden sm:inline">
                CATEGORY:
              </span>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#E31E24] text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Dropdowns: Status, Location, Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer shadow-xs"
                >
                  <option value="All">All Status</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="UNDER REVIEW">Under Review</option>
                  <option value="REPORTED">Reported</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Location Filter */}
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer shadow-xs"
                >
                  <option value="All">📍 All Locations</option>
                  <option value="KIIT">KIIT Square</option>
                  <option value="Patia">Patia</option>
                  <option value="Chandaka">Chandaka</option>
                  <option value="IIIT">IIIT Campus</option>
                  <option value="BPUT">BPUT</option>
                  <option value="Unit-1">Unit-1 Power House</option>
                  <option value="Utkal">Utkal Hospital</option>
                  <option value="Infocity">Infocity</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-gray-900 cursor-pointer shadow-xs"
                >
                  <option value="recent">⇅ Most Recent</option>
                  <option value="corroborated">👥 Most Corroborated</option>
                  <option value="trust">⚡ Highest AI Trust</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>
        </div>

        {/* Featured Report Card matching recent_reports.png */}
        {featuredReport && (
          <div className="mb-8">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left Photo with FEATURED REPORT tag */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden h-52 sm:h-60 bg-gray-100">
                  <img
                    src={featuredReport.imageUrl || '/assets/extracted/featured_potholes.png'}
                    alt={featuredReport.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#E31E24] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    FEATURED REPORT
                  </div>
                </div>

                {/* Right Info */}
                <div className="lg:col-span-7 flex flex-col justify-between h-full py-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {featuredReport.category}
                      </span>
                      <StatusBadge status={featuredReport.status} />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] leading-snug">
                      {featuredReport.title}
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-3">
                      {featuredReport.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-semibold text-gray-800">
                        <MapPin className="w-3.5 h-3.5 text-[#E31E24]" />
                        {featuredReport.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {featuredReport.timeAgo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {featuredReport.corroboratingCount} corroborating reports
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedReport(featuredReport)}
                      className="inline-flex items-center gap-1.5 bg-[#E31E24] hover:bg-[#c9181d] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all"
                    >
                      <span>VIEW REPORT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 my-8">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#E31E24] flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase text-gray-900 font-['Outfit']">No Reports Match Your Search</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Try adjusting your category, status, or location filters to see more citizen dispatches.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedLocation('All');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Report Card Grid (4 columns desktop, 2 tablet, 1 mobile) */}
        {gridReports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {gridReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header & Thumbnail */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-18 h-18 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block truncate">
                        {report.category}
                      </span>
                      <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#E31E24] transition-colors line-clamp-2 leading-tight mt-0.5">
                        {report.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-1">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  {/* Location & Time */}
                  <div className="space-y-1 text-[11px] text-gray-500 pt-1">
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin className="w-3 h-3 text-[#E31E24] shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{report.timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Status Badge & View Link */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <StatusBadge status={report.status} />
                  <span className="text-[11px] font-bold text-gray-500 group-hover:text-[#E31E24] flex items-center gap-1 transition-colors">
                    View Report →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS NEAR YOU Section matching recent_reports.png */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-0.5 bg-[#E31E24]"></span>
                <h3 className="text-lg font-black font-['Outfit'] uppercase text-gray-950">
                  REPORTS NEAR YOU
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                Explore incidents by location across Bhubaneswar district.
              </p>
            </div>

            <button
              onClick={() => setShowFullMapModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-800 transition-all shadow-xs"
            >
              <MapIcon className="w-3.5 h-3.5 text-[#E31E24]" />
              <span>OPEN FULL MAP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Map Preview Graphic */}
          <div 
            onClick={() => setShowFullMapModal(true)}
            className="rounded-2xl overflow-hidden border border-gray-200 relative cursor-pointer group shadow-inner"
          >
            <img
              src="/assets/extracted/bhubaneswar_map.png"
              alt="Bhubaneswar Incident Map"
              className="w-full h-auto object-cover group-hover:scale-101 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                <ExternalLink className="w-3.5 h-3.5" />
                Click to explore interactive spatial radar
              </span>
            </div>
          </div>
        </section>

      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onCorroborate={handleCorroborate}
      />

      {/* Full Map Modal */}
      {showFullMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-[#E31E24]" />
                <h3 className="font-black text-sm uppercase tracking-wide font-['Outfit']">
                  Bhubaneswar Sentinel Spatial Incident Map
                </h3>
              </div>
              <button
                onClick={() => setShowFullMapModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src="/assets/extracted/bhubaneswar_map.png"
                  alt="Full Map"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Pin Hotspots */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs">
                  <div className="font-bold text-[#E31E24]">Safety Clusters</div>
                  <div className="text-gray-500 text-[11px]">Chandaka • IIIT Campus</div>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                  <div className="font-bold text-blue-600">Infrastructure</div>
                  <div className="text-gray-500 text-[11px]">KIIT Sq • Infocity</div>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                  <div className="font-bold text-emerald-600">Environment</div>
                  <div className="text-gray-500 text-[11px]">Utkal Hosp • IIIT Area</div>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs">
                  <div className="font-bold text-amber-600">Traffic Congestion</div>
                  <div className="text-gray-500 text-[11px]">Patia Jn • Power House</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowFullMapModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider"
              >
                Close Map View
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
