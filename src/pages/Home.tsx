import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLayout } from '../components/layout/PageLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ReportDetailModal } from '../components/reports/ReportDetailModal';
import { ReportItem } from '../types/report';
import { 
  ArrowRight, 
  MapPin, 
  Users, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  UserCheck, 
  Check, 
  BarChart3, 
  CheckSquare, 
  XCircle, 
  Radio, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated, setIntendedDestination } = useAuth();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const handleReportCTA = () => {
    if (isAuthenticated) {
      navigate('/report');
    } else {
      setIntendedDestination('/report');
      navigate('/login', { state: { from: '/report' } });
    }
  };

  // Mock live reports featured on home
  const liveReports: ReportItem[] = [
    {
      id: 'rep-home-01',
      title: 'Suspicious activity near campus',
      description: 'Unidentified individuals seen checking car doors along campus perimeter at late hours.',
      category: 'Safety',
      status: 'UNDER REVIEW',
      location: 'Bhubaneswar • 14:32',
      timeAgo: '14:32',
      timestamp: Date.now() - 35 * 60 * 1000,
      corroboratingCount: 6,
      imageUrl: '/assets/extracted/home_suspicious.png',
      aiTrustScore: 0.72,
    },
    {
      id: 'rep-home-02',
      title: 'Road blockage due to fallen tree',
      description: 'Major banyan tree branch fell across the eastern lane, creating a severe bottleneck.',
      category: 'Environment',
      status: 'VERIFIED',
      location: 'Bhubaneswar • 11:18',
      timeAgo: '11:18',
      timestamp: Date.now() - 120 * 60 * 1000,
      corroboratingCount: 12,
      imageUrl: '/assets/extracted/home_tree.png',
      aiTrustScore: 0.94,
    },
    {
      id: 'rep-home-03',
      title: 'Broken streetlight near hostel 3',
      description: 'Two consecutive sodium streetlights completely dark since storm yesterday.',
      category: 'Infrastructure',
      status: 'REPORTED',
      location: 'Bhubaneswar • 09:41',
      timeAgo: '09:41',
      timestamp: Date.now() - 240 * 60 * 1000,
      corroboratingCount: 3,
      imageUrl: '/assets/extracted/home_streetlight.png',
      aiTrustScore: 0.58,
    },
  ];

  return (
    <PageLayout>
      <div className="relative overflow-hidden">
        
        {/* Subtle background web & constellation overlay */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none"></div>

        {/* 1. HERO SECTION */}
        <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 z-10">
              {/* Red Accent Dash */}
              <div className="w-9 h-1 bg-[#E31E24] mb-6 rounded-full"></div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 font-['Outfit'] uppercase leading-[1.06] tracking-tight">
                EVERY REPORT<br />
                HAS A STORY.<br />
                WE FIND<br />
                THE <span className="text-[#E31E24]">SIGNAL.</span>
              </h1>

              {/* Tagline */}
              <p className="mt-6 text-base sm:text-lg text-gray-600 font-medium max-w-lg">
                AI-assisted incident reporting with human verification.
              </p>

              {/* Call to Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={handleReportCTA}
                  className="inline-flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-7 py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg active:scale-95 group"
                >
                  <span>REPORT AN INCIDENT</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  to="/reports"
                  className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-gray-400 px-6 py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase transition-all active:scale-95 group"
                >
                  <span>EXPLORE REPORTS</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
                </Link>
              </div>

              {/* Bottom Micro-tagline */}
              <div className="mt-12 flex items-center gap-3 text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span className="w-4 h-0.5 bg-gray-300"></span>
                <span>REAL PEOPLE</span>
                <span className="text-gray-300">|</span>
                <span>REAL PLACES</span>
                <span className="text-gray-300">|</span>
                <span>A SAFER TOMORROW</span>
              </div>
            </div>

            {/* Right Graphic / Sentinel with Floating Holographic Badges */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="relative w-full max-w-lg lg:max-w-none">
                
                {/* Holographic Sentinel Artwork */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/80 bg-gradient-to-tr from-gray-900/10 via-transparent to-red-500/10">
                  <img
                    src="/assets/extracted/hero_sentinel.png"
                    alt="Daily Bugle Sentinel overlooking city"
                    className="w-full h-auto object-cover rounded-2xl transform hover:scale-102 transition-transform duration-500"
                  />

                  {/* Floating Hologram 1: Top Right */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white shadow-lg flex items-center gap-2 animate-bounce-slow">
                    <span className="w-2 h-2 rounded-full bg-[#E31E24] animate-ping"></span>
                    <div className="text-[10px] leading-tight font-bold text-gray-800">
                      <div>Real People</div>
                      <div className="text-[#E31E24]">Real Reports Real Change</div>
                    </div>
                  </div>

                  {/* Floating Hologram 2: Mid-Left */}
                  <div className="absolute bottom-16 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white shadow-lg flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#E31E24]" />
                    <span className="text-xs font-bold text-gray-800">Safer Communities</span>
                  </div>
                </div>

                {/* Subtle outer glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 to-blue-500/10 rounded-3xl blur-2xl -z-10"></div>
              </div>
            </div>

          </div>
        </section>


        {/* 2. LIVE REPORTS SECTION */}
        <section className="py-16 bg-white/60 border-t border-b border-gray-100/90 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#E31E24]"></span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
                  LIVE REPORTS
                </h2>
              </div>
              
              <Link
                to="/reports"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#E31E24] transition-colors group"
              >
                <span>EXPLORE ALL REPORTS</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 3 Report Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-gray-200 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-3">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                        <img
                          src={report.imageUrl}
                          alt={report.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#E31E24] transition-colors line-clamp-2 leading-snug">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 text-[#E31E24] shrink-0" />
                          <span className="truncate">{report.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-2 mb-3">
                      <StatusBadge status={report.status} />
                    </div>
                  </div>

                  {/* Footer Corroboration */}
                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {report.corroboratingCount} corroborating reports
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#E31E24] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* 3. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="flex items-center gap-2 mb-14">
            <span className="w-6 h-0.5 bg-[#E31E24]"></span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
              HOW IT WORKS
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line on desktop */}
            <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] -translate-y-6 h-0.5 border-t-2 border-dashed border-gray-200 -z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-red-200 transition-all duration-300">
                  <FileText className="w-7 h-7 text-gray-600 group-hover:text-[#E31E24] transition-colors" />
                </div>
                <div className="text-xs font-mono font-bold text-gray-400 tracking-wider">01</div>
                <h3 className="text-base font-black text-gray-950 font-['Outfit'] uppercase tracking-wide mt-1">
                  REPORT
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
                  Share what you see.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-blue-200 transition-all duration-300">
                  <Cpu className="w-7 h-7 text-blue-600 transition-colors" />
                </div>
                <div className="text-xs font-mono font-bold text-gray-400 tracking-wider">02</div>
                <h3 className="text-base font-black text-gray-950 font-['Outfit'] uppercase tracking-wide mt-1">
                  ANALYZE
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
                  AI finds patterns and key details.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-blue-200 transition-all duration-300">
                  <ShieldCheck className="w-7 h-7 text-blue-600 transition-colors" />
                </div>
                <div className="text-xs font-mono font-bold text-gray-400 tracking-wider">03</div>
                <h3 className="text-base font-black text-gray-950 font-['Outfit'] uppercase tracking-wide mt-1">
                  VERIFY
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
                  Humans review the evidence.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-red-200 transition-all duration-300">
                  <UserCheck className="w-7 h-7 text-red-500 transition-colors" />
                </div>
                <div className="text-xs font-mono font-bold text-gray-400 tracking-wider">04</div>
                <h3 className="text-base font-black text-gray-950 font-['Outfit'] uppercase tracking-wide mt-1">
                  TRUST
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
                  Accurate information for safer communities.
                </p>
              </div>

            </div>
          </div>
        </section>


        {/* 4. AI ASSISTS. HUMANS VERIFY. SECTION */}
        <section id="about" className="py-20 bg-white/70 border-t border-b border-gray-100 relative scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-0.5 bg-[#E31E24]"></span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
                  AI ASSISTS. HUMANS VERIFY.
                </h2>
              </div>
              <p className="text-sm text-gray-500 max-w-xl">
                A combination of technology and real-world judgement for a safer, more informed society.
              </p>
            </div>

            {/* 3-column AI / Sphere / Human layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Left Card: AI Assistance */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-gray-900 font-['Outfit'] uppercase tracking-wide mb-4">
                  AI ASSISTANCE
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Organizes information</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Finds signals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Highlights gaps</span>
                  </li>
                </ul>
              </div>

              {/* Center Holographic Sphere */}
              <div className="flex flex-col items-center justify-center relative py-6">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <img
                    src="/assets/extracted/ai_sphere.png"
                    alt="AI Holographic Core"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(59,130,246,0.35)] animate-pulse"
                  />
                  {/* Orbital pulse ring */}
                  <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-spin" style={{ animationDuration: '12s' }}></div>
                  <div className="absolute -inset-3 rounded-full border border-dashed border-red-400/20 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}></div>
                </div>
                <span className="text-[11px] font-mono font-bold text-gray-400 tracking-wider uppercase mt-4">
                  Spatio-Temporal Verification Core
                </span>
              </div>

              {/* Right Card: Human Review */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-gray-900 font-['Outfit'] uppercase tracking-wide mb-4">
                  HUMAN REVIEW
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Reviews evidence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Investigates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Makes final decision</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </section>


        {/* 5. BUILT ON TRUST SECTION */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-10">
            <span className="w-6 h-0.5 bg-[#E31E24]"></span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
              BUILT ON TRUST
            </h2>
          </div>

          {/* Reputation Stats Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md hover:shadow-xl transition-all">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left: 64 REPUTATION */}
              <div className="md:col-span-4 flex items-center gap-4">
                <span className="text-5xl sm:text-6xl font-black text-gray-950 font-['Outfit'] tracking-tight">
                  64
                </span>
                <div>
                  <BarChart3 className="w-6 h-6 text-[#E31E24] mb-1" />
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest font-['Outfit']">
                    REPUTATION
                  </span>
                </div>
              </div>

              {/* Middle: Reports Breakdowns */}
              <div className="md:col-span-4 md:border-l md:border-r border-gray-100 md:px-8 space-y-2.5">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-700">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>8 REPORTS</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-700">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>6 VERIFIED</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-700">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>1 REJECTED</span>
                </div>
              </div>

              {/* Right: Trusted Reporter */}
              <div className="md:col-span-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100/70 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-gray-950 uppercase tracking-wide font-['Outfit']">
                      TRUSTED REPORTER
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#E31E24]" />
                  </div>
                  {/* Subtle placeholder indicator bars */}
                  <div className="mt-2 space-y-1">
                    <div className="w-28 h-1.5 bg-gray-200 rounded-full"></div>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* 6. BOTTOM BANNER / BRIDGE VIEW */}
        <section className="relative py-24 bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white overflow-hidden">
          {/* Subtle bridge background texture */}
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url('/assets/extracted/form_bg.png')" }}></div>
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Watermark */}
              <div className="hidden lg:block lg:col-span-3 text-[11px] font-mono uppercase tracking-[0.25em] text-gray-500 leading-loose">
                REAL REPORTS<br />
                SAFER CITIES<br />
                STRONGER PEOPLE
              </div>

              {/* Center Content */}
              <div className="lg:col-span-6 text-center">
                <div className="w-8 h-1 bg-[#E31E24] mx-auto mb-6 rounded-full"></div>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-['Outfit'] uppercase leading-tight tracking-tight">
                  YOUR REPORT<br />
                  COULD BE THE <span className="text-[#E31E24]">SIGNAL</span><br />
                  SOMEONE NEEDS.
                </h2>

                <div className="mt-8">
                  <button
                    onClick={handleReportCTA}
                    className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-8 py-4 rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl hover:shadow-red-500/20 active:scale-95 group"
                  >
                    <span>REPORT AN INCIDENT</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Watermark */}
              <div className="hidden lg:block lg:col-span-3 text-right text-[11px] font-mono uppercase tracking-[0.25em] text-gray-500 leading-loose">
                A MORE<br />
                INFORMED<br />
                TOMORROW
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* Modal for viewing report detail */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </PageLayout>
  );
};
