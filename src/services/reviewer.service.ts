const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ReviewerQueueItem {
  id: string;
  title: string;
  description: string;
  status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO' | 'UNDER REVIEW';
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trustScore: number;
  trustLevel: 'LOW' | 'MODERATE' | 'HIGH';
  corroboratingCount: number;
  contradictingCount: number;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  evidence?: {
    type?: string;
    url?: string;
    filename?: string;
    filesize?: number;
  };
  reporter?: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
    reputation: number;
  };
  reviewedBy?: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  reviewedAt?: string;
  reviewRequest?: {
    message: string;
    createdAt: string;
  };
  createdAt: string;
}

export interface ReviewerStats {
  pendingCount: number;
  needsInfoCount: number;
  verifiedCount: number;
  rejectedCount: number;
  totalFiltered: number;
}

export interface ReviewPackage {
  report: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: {
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    evidence?: {
      type?: string;
      url?: string;
      filename?: string;
      filesize?: number;
    };
    status: 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO' | 'UNDER REVIEW';
    reporter?: {
      _id: string;
      name: string;
      email?: string;
      avatar?: string;
      role: string;
      reputation: number;
      createdAt?: string;
    };
    reviewedBy?: {
      _id: string;
      name: string;
      avatar?: string;
      role: string;
    };
    reviewedAt?: string;
    reviewHistory: Array<{
      reviewer?: {
        name?: string;
        avatar?: string;
        role?: string;
      };
      action: 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO';
      reason?: string;
      note?: string;
      createdAt: string;
    }>;
    reviewRequest?: {
      message: string;
      createdAt: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  aiAnalysis: {
    summary: string;
    category: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    specificity: number;
    keyClaims: string[];
    missingInformation: string[];
    suspiciousSignals: string[];
    recommendedAction: string;
    status: string;
  };
  trustAnalysis: {
    score: number;
    level: 'LOW' | 'MODERATE' | 'HIGH';
    signals: {
      reporterReputation: number;
      specificity: number;
      evidence: number;
      location: number;
      time: number;
      corroboration: number;
      missingInformation: number;
      suspiciousSignals: number;
      contradiction: number;
    };
    explanation: string;
  };
  corroboration: Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    status: string;
    reporterName: string;
    reporterReputation: number;
    trustScore: number;
    createdAt: string;
  }>;
  contradictions: Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    status: string;
    reporterName: string;
    reporterReputation: number;
    trustScore: number;
    createdAt: string;
  }>;
}

export interface QueueResponse {
  success: boolean;
  data: {
    reports: ReviewerQueueItem[];
    stats: ReviewerStats;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface ReviewPackageResponse {
  success: boolean;
  data: ReviewPackage;
  message?: string;
}

export interface ReviewActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  reputationUpdate?: {
    change: number;
    previous: number;
    new: number;
    reason: string;
  } | null;
}

export const reviewerService = {
  /**
   * Fetch reviewer queue with stats and filters
   */
  async getQueue(params: {
    status?: string;
    category?: string;
    urgency?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<QueueResponse['data']> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.urgency && params.urgency !== 'ALL') query.append('urgency', params.urgency);
    if (params.trustLevel && params.trustLevel !== 'ALL') query.append('trustLevel', params.trustLevel);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/reviewer/reports?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const json: QueueResponse = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch reviewer queue');
    }

    return json.data;
  },

  /**
   * Fetch complete review package for a specific report
   */
  async getPackage(id: string): Promise<ReviewPackage> {
    const res = await fetch(`${API_BASE}/reviewer/reports/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const json: ReviewPackageResponse = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch review package');
    }

    return json.data;
  },

  /**
   * Human Reviewer action: Verify report
   */
  async verifyReport(id: string, note?: string): Promise<ReviewActionResponse> {
    const res = await fetch(`${API_BASE}/reviewer/reports/${id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ note }),
    });

    const json: ReviewActionResponse = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to verify report');
    }

    return json;
  },

  /**
   * Human Reviewer action: Reject report
   */
  async rejectReport(id: string, reason: string, note?: string): Promise<ReviewActionResponse> {
    const res = await fetch(`${API_BASE}/reviewer/reports/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reason, note }),
    });

    const json: ReviewActionResponse = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to reject report');
    }

    return json;
  },

  /**
   * Human Reviewer action: Request info on report
   */
  async requestInfo(id: string, message: string): Promise<ReviewActionResponse> {
    const res = await fetch(`${API_BASE}/reviewer/reports/${id}/request-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    const json: ReviewActionResponse = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to request info on report');
    }

    return json;
  },
};
