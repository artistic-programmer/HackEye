export type ReportCategory = 
  | 'Safety' 
  | 'Infrastructure' 
  | 'Traffic' 
  | 'Environment' 
  | 'Public Service' 
  | 'Other';

export type ReportStatus = 
  | 'UNDER_REVIEW'
  | 'VERIFIED' 
  | 'REJECTED'
  | 'NEEDS_INFO'
  | 'UNDER REVIEW' 
  | 'REPORTED';

export interface EvidenceMeta {
  url: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw';
  mimeType?: string;
  originalName?: string;
  size?: number;
}

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timeAgo: string;
  timestamp: number;
  corroboratingCount: number;
  imageUrl?: string;
  videoUrl?: string;
  evidence?: EvidenceMeta | string;
  reporterName?: string;
  isFeatured?: boolean;
  aiTrustScore?: number; // e.g. 0.85
  upvotes?: number;
  downvotes?: number;
}

export interface ReportDraft {
  description: string;
  location: string;
  category: ReportCategory;
  evidenceName?: string;
  evidenceType?: string;
  evidenceSize?: string;
  evidencePreview?: string;
  timestamp?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  reputation: number;
  reportsCount?: number;
  verifiedCount?: number;
  rejectedCount?: number;
  isTrustedReporter?: boolean;
}
