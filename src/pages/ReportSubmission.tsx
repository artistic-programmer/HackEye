import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLayout } from '../components/layout/PageLayout';
import { ReportCategory, ReportItem, ReportDraft } from '../types/report';
import { reportService } from '../services/report.service';
import { 
  getStoredDraft, 
  saveStoredDraft, 
  clearStoredDraft, 
  saveStoredReport, 
  setLastFailedReport 
} from '../data/mockReports';
import { 
  Building2, 
  ShieldAlert, 
  Leaf, 
  Car, 
  Users, 
  MoreHorizontal, 
  MapPin, 
  Navigation, 
  Upload, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle2,
  Map as MapIcon,
  Video,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

const CATEGORIES: { label: ReportCategory; icon: React.FC<{ className?: string }> }[] = [
  { label: 'Infrastructure', icon: Building2 },
  { label: 'Safety', icon: ShieldAlert },
  { label: 'Environment', icon: Leaf },
  { label: 'Traffic', icon: Car },
  { label: 'Public Service', icon: Users },
  { label: 'Other', icon: MoreHorizontal },
];

export const ReportSubmission: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load existing draft or initialize
  const savedDraft = getStoredDraft();

  const [description, setDescription] = useState(savedDraft?.description || '');
  const [location, setLocation] = useState(savedDraft?.location || '');
  const [category, setCategory] = useState<ReportCategory>(savedDraft?.category || 'Safety');
  
  // Real File state for multipart upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceName, setEvidenceName] = useState<string | undefined>(savedDraft?.evidenceName);
  const [evidencePreview, setEvidencePreview] = useState<string | undefined>(savedDraft?.evidencePreview);
  const [evidenceType, setEvidenceType] = useState<'image' | 'video' | null>(null);
  const [evidenceSizeStr, setEvidenceSizeStr] = useState<string | null>(null);
  
  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Form errors & submission states
  const [errors, setErrors] = useState<{ description?: string; location?: string; evidence?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>('');

  // Dev simulation control: URL query param (?mockResult=failure) or internal selector
  const forceResult = searchParams.get('mockResult');
  const [simulatedResult, setSimulatedResult] = useState<'success' | 'failure'>(
    forceResult === 'failure' ? 'failure' : 'success'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save draft on every change
  useEffect(() => {
    const draft: ReportDraft = {
      description,
      location,
      category,
      evidenceName,
      evidencePreview,
      timestamp: Date.now(),
    };
    saveStoredDraft(draft);
  }, [description, location, category, evidenceName, evidencePreview]);

  // Geolocation handler
  const handleUseMyLocation = () => {
    setIsLocating(true);
    setGeoNotice(null);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocation('KIIT Road, Patia, Bhubaneswar');
      setGeoNotice('Geolocation not supported by browser. Defaulted to Bhubaneswar.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setLocation(`Patia, Bhubaneswar (${lat}, ${lng})`);
        setGeoNotice('GPS coordinates captured accurately.');
      },
      (err) => {
        setIsLocating(false);
        // Fallback to realistic civic location
        setLocation('Janpath, Unit 3, Bhubaneswar');
        setGeoNotice('Location permission denied or unavailable. Fallback applied.');
      },
      { timeout: 8000 }
    );
  };

  // Evidence file handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setErrors((prev) => ({
        ...prev,
        evidence: 'Unsupported file format. Please upload an image (JPG, PNG, WEBP) or video (MP4, WEBM).',
      }));
      return;
    }

    if (isVideo && file.size > 60 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, evidence: 'Video file size must be less than 60MB.' }));
      return;
    }

    if (isImage && file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, evidence: 'Image file size must be less than 15MB.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, evidence: undefined }));
    setSelectedFile(file);
    setEvidenceName(file.name);
    setEvidenceType(isVideo ? 'video' : 'image');

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setEvidenceSizeStr(formattedSize);

    const previewUrl = URL.createObjectURL(file);
    setEvidencePreview(previewUrl);
  };

  const handleRemoveFile = () => {
    if (evidencePreview && evidencePreview.startsWith('blob:')) {
      URL.revokeObjectURL(evidencePreview);
    }
    setSelectedFile(null);
    setEvidenceName(undefined);
    setEvidencePreview(undefined);
    setEvidenceType(null);
    setEvidenceSizeStr(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit report handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { description?: string; location?: string } = {};
    if (!description.trim()) {
      newErrors.description = 'Please describe what happened.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters describing the incident.';
    }

    if (!location.trim()) {
      newErrors.location = 'Please provide a location or use GPS.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress('Submitting incident details to editorial desk...');

    const submitToBackend = async () => {
      try {
        // Step 1: Create report in backend
        const createdReport = await reportService.createReport({
          title: description.slice(0, 60) + (description.length > 60 ? '...' : ''),
          description,
          category,
          location: {
            address: location,
            latitude: 20.35,
            longitude: 85.82,
          },
        });

        // Step 2: Upload evidence if attached
        if (selectedFile && createdReport?._id) {
          setSubmissionProgress('Uploading and analyzing supporting evidence...');
          try {
            await reportService.uploadEvidence(createdReport._id, selectedFile);
          } catch (uploadErr: any) {
            console.warn('Evidence upload failed, but report was created:', uploadErr);
          }
        }

        clearStoredDraft();
        setIsSubmitting(false);
        navigate('/reports');
      } catch (err: any) {
        console.error('Submission error:', err);
        setIsSubmitting(false);
        // Fallback to local offline storage if backend is unreachable
        saveStoredReport({
          id: `rep-${Date.now().toString(36)}`,
          title: description.slice(0, 60) + (description.length > 60 ? '...' : ''),
          description: description,
          category: category,
          status: 'UNDER_REVIEW',
          location: location,
          timeAgo: 'Just now',
          timestamp: Date.now(),
          corroboratingCount: 1,
          imageUrl: evidencePreview || '/assets/extracted/card_signal.png',
          reporterName: user?.name || 'Citizen Reporter',
          aiTrustScore: 0.68,
        });
        clearStoredDraft();
        navigate('/reports');
      }
    };

    submitToBackend();
  };

  return (
    <PageLayout 
      transparentHeader
      className="bg-[url('/assets/backgrounds/city_pier_bg.png')] bg-top bg-cover bg-no-repeat min-h-screen"
    >
      <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Page Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="w-8 h-1 bg-[#E31E24] mx-auto mb-4 rounded-full"></div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 font-['Outfit'] uppercase tracking-tight">
            SUBMIT A <span className="text-[#E31E24]">REPORT</span>
          </h1>
          <p className="mt-3 text-sm text-gray-600 font-medium">
            Every report starts with a signal.<br className="hidden sm:inline" />
            Give us the details. We'll help verify the rest.
          </p>
        </div>

        {/* Floating Side Ambient Quotes matching Form_Submission_page.png */}
        <div className="hidden xl:block absolute left-8 top-44 max-w-[210px] text-gray-400 space-y-8 select-none pointer-events-none">
          <div className="text-[10px] font-mono tracking-widest uppercase leading-loose border-l-2 border-red-500/40 pl-3">
            REAL PEOPLE<br />
            REAL PLACES<br />
            A SAFER TOMORROW
          </div>
          <div className="text-sm font-black font-['Outfit'] uppercase leading-snug text-gray-700">
            A SAFER MORE INFORMED <span className="text-[#E31E24]">TOMORROW.</span>
            <p className="text-xs font-normal normal-case text-gray-500 mt-2">
              Your report helps build safer, stronger communities.
            </p>
          </div>
        </div>

        <div className="hidden xl:block absolute right-8 top-44 max-w-[210px] text-gray-400 space-y-6 select-none pointer-events-none">
          <div className="text-[10px] font-mono tracking-widest uppercase leading-loose border-r-2 border-red-500/40 pr-3 text-right">
            CITIZEN REPORTS<br />
            STRONGER<br />
            COMMUNITIES
          </div>

          <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-100 shadow-md">
            <MapPin className="w-4 h-4 text-[#E31E24] mb-2" />
            <div className="text-xs font-bold text-gray-800 leading-tight">
              Spot it.<br />Report it.<br />Make a difference.
            </div>
            <div className="w-4 h-0.5 bg-[#E31E24] mt-2"></div>
          </div>

          <div className="text-[10px] font-mono tracking-widest uppercase text-gray-400 text-right">
            CIVIC INTELLIGENCE<br />FOR SAFER CITIES
          </div>
        </div>

        {/* Central Form Container Card */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 p-6 sm:p-10 relative z-10">
          
          {/* Dev Submission Simulator Switch */}
          <div className="mb-6 p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
            <span className="font-mono text-gray-600 font-bold">⚡ Simulation Mode:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSimulatedResult('success')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  simulatedResult === 'success' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                Simulate Success
              </button>
              <button
                type="button"
                onClick={() => setSimulatedResult('failure')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  simulatedResult === 'failure' 
                    ? 'bg-red-600 text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
                }`}
              >
                Simulate Failure
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Step 1: WHAT HAPPENED? */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-900 font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <label htmlFor="description" className="text-sm font-black font-['Outfit'] uppercase tracking-wide text-gray-900">
                  WHAT HAPPENED?
                </label>
              </div>

              <div className="relative">
                <textarea
                  id="description"
                  rows={4}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: undefined });
                  }}
                  placeholder="Describe the incident clearly..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all resize-y ${
                    errors.description 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]'
                  }`}
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                  {errors.description ? (
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description}
                    </span>
                  ) : <span></span>}
                  <span>{description.length} / 1000 characters</span>
                </div>
              </div>
            </div>

            {/* Step 2: LOCATION */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-900 font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <label htmlFor="location" className="text-sm font-black font-['Outfit'] uppercase tracking-wide text-gray-900">
                  LOCATION
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (errors.location) setErrors({ ...errors, location: undefined });
                      }}
                      placeholder="Search or enter location"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all ${
                        errors.location 
                          ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shrink-0"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'Use my location'}</span>
                  </button>
                </div>

                {geoNotice && (
                  <p className="text-[11px] text-blue-600 font-medium pl-1">
                    {geoNotice}
                  </p>
                )}
                {errors.location && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 pl-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.location}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3: CATEGORY */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-900 font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <label className="text-sm font-black font-['Outfit'] uppercase tracking-wide text-gray-900">
                  CATEGORY
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(({ label, icon: Icon }) => {
                  const isSelected = category === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCategory(label)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        isSelected
                          ? 'border-[#E31E24] bg-red-50/60 text-[#E31E24] shadow-xs ring-1 ring-[#E31E24]'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#E31E24]' : 'text-gray-500'}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: EVIDENCE */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-900 font-mono font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <label className="text-sm font-black font-['Outfit'] uppercase tracking-wide text-gray-900">
                  EVIDENCE
                </label>
              </div>
              <p className="text-xs text-gray-400 mb-3 ml-8">
                Add photos, videos, or documents that support your report.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              {errors.evidence && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.evidence}</span>
                </div>
              )}

              {evidenceName ? (
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {evidenceType === 'video' ? (
                        <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                          <Video className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-900 max-w-[240px] truncate">{evidenceName}</p>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {evidenceSizeStr || 'Media attached'} • {evidenceType === 'video' ? 'Video File' : 'Image File'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preview container */}
                  {evidencePreview && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-950 flex items-center justify-center">
                      {evidenceType === 'video' ? (
                        <video
                          src={evidencePreview}
                          controls
                          className="w-full max-h-52 object-contain"
                        />
                      ) : (
                        <img
                          src={evidencePreview}
                          alt="Evidence Preview"
                          className="w-full max-h-52 object-contain"
                        />
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evidence attached — will boost Trust Engine verification priority (+10 pts).</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-[#E31E24]/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-red-50/10 group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-black uppercase tracking-wider text-gray-800 font-['Outfit']">
                    ATTACH PHOTO OR VIDEO
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 mt-1">
                    JPG • PNG • WEBP • MP4 • WEBM (Max 60MB)
                  </div>
                </div>
              )}
            </div>

            {/* Submission Progress Indicator */}
            {isSubmitting && (
              <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-[#E31E24] animate-spin shrink-0" />
                <div className="text-xs font-bold text-gray-800">
                  {submissionProgress || 'Processing submission with Daily Bugle Trust Engine...'}
                </div>
              </div>
            )}

            {/* AI Disclaimer Callout Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-snug">
                  Your report will be analyzed by AI before human verification.
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  AI assists the review — it does not decide the truth.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E31E24] hover:bg-[#c9181d] text-white px-10 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'PROCESSING SIGNAL...' : 'SUBMIT REPORT'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-gray-400 mt-4">
                Your identity and evidence are handled according to our{' '}
                <span className="underline hover:text-gray-600 cursor-pointer">privacy policy</span>.
              </p>
            </div>

          </form>
        </div>

      </div>
    </PageLayout>
  );
};
