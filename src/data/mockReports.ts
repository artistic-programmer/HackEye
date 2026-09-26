import { ReportItem, ReportDraft, UserProfile } from '../types/report';

export const INITIAL_USER: UserProfile = {
  id: 'usr_anshu_01',
  name: 'Anshu',
  email: 'anshu@dailybugle.local',
  reputation: 64,
  reportsCount: 8,
  verifiedCount: 6,
  rejectedCount: 1,
  isTrustedReporter: true,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
};

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-kiit-01',
    title: 'Major road damage reported near KIIT Square',
    description: 'Large potholes and damaged road surface causing traffic issues. Multiple commuters have reported the same problem.',
    category: 'Infrastructure',
    status: 'VERIFIED',
    location: 'KIIT Square, Bhubaneswar',
    coordinates: { lat: 20.3533, lng: 85.8195 },
    timeAgo: '2 hours ago',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    corroboratingCount: 12,
    imageUrl: '/assets/extracted/featured_potholes.png',
    reporterName: 'Anshu',
    isFeatured: true,
    aiTrustScore: 0.92,
  },
  {
    id: 'rep-st-02',
    title: 'Streetlight outage near campus road',
    description: 'Multiple streetlights not working since last week, making the area dark and unsafe for pedestrians.',
    category: 'Safety',
    status: 'VERIFIED',
    location: 'Chandaka, Bhubaneswar',
    coordinates: { lat: 20.3450, lng: 85.7890 },
    timeAgo: '18 min ago',
    timestamp: Date.now() - 18 * 60 * 1000,
    corroboratingCount: 8,
    imageUrl: '/assets/extracted/card_streetlight.png',
    reporterName: 'Priya M.',
    aiTrustScore: 0.88,
  },
  {
    id: 'rep-gb-03',
    title: 'Overflowing garbage bins near hostel area',
    description: 'Garbage bins have not been cleared for several days, causing foul smell and public health concerns.',
    category: 'Environment',
    status: 'UNDER REVIEW',
    location: 'IIIT Bhubaneswar',
    coordinates: { lat: 20.2940, lng: 85.7430 },
    timeAgo: '1 hour ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    corroboratingCount: 14,
    imageUrl: '/assets/extracted/card_garbage.png',
    reporterName: 'Rahul S.',
    aiTrustScore: 0.67,
  },
  {
    id: 'rep-tf-04',
    title: 'Heavy traffic congestion at Patia junction',
    description: 'Severe traffic jam during evening hours due to signal issues and junction blockages.',
    category: 'Traffic',
    status: 'REPORTED',
    location: 'Patia, Bhubaneswar',
    coordinates: { lat: 20.3588, lng: 85.8166 },
    timeAgo: '2 hours ago',
    timestamp: Date.now() - 120 * 60 * 1000,
    corroboratingCount: 19,
    imageUrl: '/assets/extracted/card_traffic.png',
    reporterName: 'Vikram D.',
    aiTrustScore: 0.45,
  },
  {
    id: 'rep-fp-05',
    title: 'Broken footpath near BPUT main gate',
    description: 'Footpath tiles are broken and uneven, making it difficult for senior citizens and students to walk safely.',
    category: 'Infrastructure',
    status: 'VERIFIED',
    location: 'BPUT, Bhubaneswar',
    coordinates: { lat: 20.3392, lng: 85.8075 },
    timeAgo: '3 hours ago',
    timestamp: Date.now() - 180 * 60 * 1000,
    corroboratingCount: 5,
    imageUrl: '/assets/extracted/card_footpath.png',
    reporterName: 'Debabrata K.',
    aiTrustScore: 0.82,
  },
  {
    id: 'rep-wl-06',
    title: 'Waterlogging after rain near Power House',
    description: 'Severe waterlogging on the main road after heavy rainfall. Vehicles stranded and slow traffic movement.',
    category: 'Public Service',
    status: 'UNDER REVIEW',
    location: 'Unit-1, Bhubaneswar',
    coordinates: { lat: 20.2724, lng: 85.8338 },
    timeAgo: '4 hours ago',
    timestamp: Date.now() - 240 * 60 * 1000,
    corroboratingCount: 11,
    imageUrl: '/assets/extracted/card_waterlogging.png',
    reporterName: 'Smita R.',
    aiTrustScore: 0.71,
  },
  {
    id: 'rep-tr-07',
    title: 'Fallen tree blocking road near Utkal Hospital',
    description: 'A tree has fallen due to strong winds, partially blocking the road and interrupting two lanes.',
    category: 'Environment',
    status: 'REPORTED',
    location: 'Utkal Hospital, Bhubaneswar',
    coordinates: { lat: 20.3150, lng: 85.8200 },
    timeAgo: '5 hours ago',
    timestamp: Date.now() - 300 * 60 * 1000,
    corroboratingCount: 7,
    imageUrl: '/assets/extracted/card_tree.png',
    reporterName: 'Manish P.',
    aiTrustScore: 0.49,
  },
  {
    id: 'rep-dg-08',
    title: 'Stray dogs in hostel area',
    description: 'Increasing number of stray dogs spotted near the hostel, causing safety concerns for students at night.',
    category: 'Safety',
    status: 'VERIFIED',
    location: 'IIIT Bhubaneswar',
    coordinates: { lat: 20.2940, lng: 85.7430 },
    timeAgo: '6 hours ago',
    timestamp: Date.now() - 360 * 60 * 1000,
    corroboratingCount: 16,
    imageUrl: '/assets/extracted/card_dogs.png',
    reporterName: 'Siddharth T.',
    aiTrustScore: 0.86,
  },
  {
    id: 'rep-sg-09',
    title: 'Damaged traffic signal at Infocity',
    description: 'Traffic signal not working properly since yesterday, flashing erratic lights and creating confusion.',
    category: 'Infrastructure',
    status: 'UNDER REVIEW',
    location: 'Infocity, Bhubaneswar',
    coordinates: { lat: 20.3556, lng: 85.8188 },
    timeAgo: '8 hours ago',
    timestamp: Date.now() - 480 * 60 * 1000,
    corroboratingCount: 9,
    imageUrl: '/assets/extracted/card_signal.png',
    reporterName: 'Aditya N.',
    aiTrustScore: 0.65,
  },
];

const STORAGE_KEY_REPORTS = 'dailybugle_reports';
const STORAGE_KEY_DRAFT = 'dailybugle_report_draft';
const STORAGE_KEY_LAST_FAILED = 'dailybugle_last_failed';

export function getStoredReports(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPORTS;
  }
}

export function saveStoredReport(report: ReportItem): void {
  const list = getStoredReports();
  // New reports go to top
  const updated = [report, ...list.filter(r => r.id !== report.id)];
  localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));
}

export function getStoredDraft(): ReportDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredDraft(draft: ReportDraft): void {
  localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
}

export function clearStoredDraft(): void {
  localStorage.removeItem(STORAGE_KEY_DRAFT);
}

export function setLastFailedReport(draft: ReportDraft): void {
  localStorage.setItem(STORAGE_KEY_LAST_FAILED, JSON.stringify(draft));
}

export function getLastFailedReport(): ReportDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_FAILED);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastFailedReport(): void {
  localStorage.removeItem(STORAGE_KEY_LAST_FAILED);
}
