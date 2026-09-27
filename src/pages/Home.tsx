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
} from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated, setIntendedDestination } = useAuth();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const handleReportCTA = () => {
    navigate('/report');
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

        {/* 1. HERO SECTION matching Home_Page.png */}
        <section 
          className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 bg-[url('/assets/backgrounds/home_hero_bg.png')] bg-cover bg-[position:80%_center] lg:bg-center overflow-hidden border-b border-gray-200/50"
        >
          {/* Subtle gradient overlay to guarantee extreme text readability on smaller screens */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent lg:via-white/40 pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Content */}
              <div className="lg:col-span-6 z-10 max-w-xl">
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
                <p className="mt-6 text-base sm:text-lg text-gray-700 font-medium max-w-lg leading-relaxed">
                  AI-assisted incident reporting with human verification.
                </p>

                {/* Call to Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleReportCTA}
                    className="inline-flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-7 py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg active:scale-95 group cursor-pointer"
                  >
                    <span>REPORT AN INCIDENT</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <Link
                    to="/reports"
                    className="inline-flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-gray-800 border border-gray-300 hover:border-gray-400 px-6 py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-wider uppercase transition-all active:scale-95 group shadow-xs cursor-pointer"
                  >
                    <span>EXPLORE REPORTS</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-900 transition-all" />
                  </Link>
                </div>

                {/* Bottom Micro-tagline */}
                <div className="mt-12 flex items-center gap-3 text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <span className="w-4 h-0.5 bg-[#E31E24]"></span>
                  <span>REAL PEOPLE</span>
                  <span className="text-gray-400">|</span>
                  <span>REAL PLACES</span>
                  <span className="text-gray-400">|</span>
                  <span>A SAFER TOMORROW</span>
                </div>
              </div>

              {/* Right column allows the Sentinel from the background to remain fully visible */}
              <div className="hidden lg:block lg:col-span-6 min-h-[380px]"></div>

            </div>
          </div>
        </section>


        {/* 2. LIVE REPORTS SECTION */}
        <section className="py-16 bg-white/70 border-b border-gray-200/60 relative">
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
                  className="group bg-white rounded-2xl p-4 border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-gray-300 transition-all cursor-pointer flex flex-col justify-between"
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


        {/* 4. AI ASSISTS. HUMANS VERIFY. SECTION matching Home_Page.png */}
        <section id="about" className="py-20 bg-[#FBFDFF] border-t border-b border-gray-100 relative scroll-mt-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Editorial Headline & Subtitle matching Home_Page.png */}
              <div className="lg:col-span-5 max-w-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-1 bg-[#E31E24] rounded-full"></span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-gray-950 font-['Outfit'] uppercase tracking-tight leading-[1.12] mb-4">
                  AI ASSISTS.<br />
                  <span className="text-gray-950">HUMANS VERIFY.</span>
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-sm">
                  A combination of technology and real-world judgement for a safer, more informed society.
                </p>
              </div>

              {/* Right Column: Unified Verification Flow Widget matching Home_Page.png */}
              <div className="lg:col-span-7">
                <div className="relative rounded-3xl bg-gradient-to-r from-[#F0F5FA]/90 via-[#F6F9FD]/95 to-[#F0F5FA]/90 border border-blue-100/80 p-4 sm:p-7 shadow-[0_10px_35px_rgba(20,50,95,0.05)] overflow-hidden">
                  
                  {/* Subtle ambient cyan/blue radial glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Connecting circuit lines behind cards */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" xmlns="http://www.w3.org/2000/svg">
                    <line x1="25%" y1="50%" x2="50%" y2="50%" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                    <line x1="50%" y1="50%" x2="75%" y2="50%" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                  </svg>

                  {/* Inner Content Grid */}
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 z-10">
                    
                    {/* Left Sub-Card: AI ASSISTANCE */}
                    <div className="w-full md:flex-1 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center mb-3.5 shadow-xs">
                        <Cpu className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-gray-950 font-['Outfit'] uppercase tracking-wider mb-3.5">
                        AI ASSISTANCE
                      </h3>
                      <ul className="space-y-2.5 text-xs sm:text-[13px] text-gray-600 font-medium">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                          <span>Organizes information</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                          <span>Finds signals</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                          <span>Highlights gaps</span>
                        </li>
                      </ul>
                    </div>

                    {/* Center Holographic Verification Core */}
                    <div className="relative flex flex-col items-center justify-center shrink-0 w-32 sm:w-40 py-2">
                      <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                        <img
                          src="/assets/extracted/ai_sphere.png"
                          alt="AI Verification Core"
                          className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(59,130,246,0.35)] select-none pointer-events-none"
                        />
                        {/* Orbital animated rings */}
                        <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-spin" style={{ animationDuration: '14s' }} />
                        <div className="absolute -inset-2 rounded-full border border-dashed border-red-400/20 animate-spin" style={{ animationDuration: '22s', animationDirection: 'reverse' }} />
                      </div>
                    </div>

                    {/* Right Sub-Card: HUMAN REVIEW */}
                    <div className="w-full md:flex-1 bg-white rounded-2xl p-5 sm:p-6 border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center mb-3.5 shadow-xs">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-black text-gray-950 font-['Outfit'] uppercase tracking-wider mb-3.5">
                        HUMAN REVIEW
                      </h3>
                      <ul className="space-y-2.5 text-xs sm:text-[13px] text-gray-600 font-medium">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                          <span>Reviews evidence</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                          <span>Investigates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2.5} />
                          <span>Makes final decision</span>
                        </li>
                      </ul>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>


        {/* 5. BUILT ON TRUST SECTION */}
        {/* 5 & 6. BUILT ON TRUST & BOTTOM PIER CTA SECTION matching Home_Page.png */}
        <section 
          className="relative pt-16 pb-28 sm:pb-36 bg-[url('/assets/backgrounds/home_bottom_bg.png')] bg-cover bg-bottom border-t border-gray-200/50 overflow-hidden"
        >
          {/* Subtle light gradient to ensure crisp contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            
            {/* Section 5: BUILT ON TRUST */}
            <div className="mb-20">
              <div className="flex items-center gap-2 mb-8">
                <span className="w-6 h-0.5 bg-[#E31E24]"></span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
                  BUILT ON TRUST
                </h2>
              </div>

              {/* Reputation Stats Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.06)] hover:shadow-xl transition-all">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Left: 64 REPUTATION */}
                  <div className="md:col-span-4 flex items-center gap-4">
                    <span className="text-5xl sm:text-6xl font-black text-gray-950 font-['Outfit'] tracking-tight">
                      64
                    </span>
                    <div>
                      <BarChart3 className="w-6 h-6 text-[#E31E24] mb-1" />
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest font-['Outfit']">
                        REPUTATION
                      </span>
                    </div>
                  </div>

                  {/* Middle: Reports Breakdowns */}
                  <div className="md:col-span-4 md:border-l md:border-r border-gray-100 md:px-8 space-y-2.5">
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-800">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>8 REPORTS</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-800">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>6 VERIFIED</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-800">
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
            </div>

            {/* Section 6: YOUR REPORT COULD BE THE SIGNAL SOMEONE NEEDS */}
            <div className="pt-6 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Watermark */}
                <div className="hidden lg:block lg:col-span-3 text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-gray-600 leading-loose">
                  REAL REPORTS<br />
                  SAFER CITIES<br />
                  STRONGER PEOPLE
                  <div className="w-5 h-0.5 bg-[#E31E24] mt-2"></div>
                </div>

                {/* Center Content */}
                <div className="lg:col-span-6 text-center">
                  <div className="w-8 h-1 bg-[#E31E24] mx-auto mb-6 rounded-full"></div>
                  
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] uppercase leading-tight tracking-tight text-gray-950">
                    YOUR REPORT<br />
                    COULD BE THE <span className="text-[#E31E24]">SIGNAL</span><br />
                    SOMEONE NEEDS.
                  </h2>

                  <div className="mt-8">
                    <button
                      onClick={handleReportCTA}
                      className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-8 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl hover:shadow-red-500/25 active:scale-95 group cursor-pointer"
                    >
                      <span>REPORT AN INCIDENT</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Right Watermark */}
                <div className="hidden lg:block lg:col-span-3 text-right text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-gray-600 leading-loose">
                  A MORE<br />
                  INFORMED<br />
                  TOMORROW
                  <div className="w-5 h-0.5 bg-[#E31E24] mt-2 ml-auto"></div>
                </div>

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
