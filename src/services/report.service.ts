const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CreateReportDto {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  evidence?: any;
}

export interface UploadEvidenceResponse {
  success: boolean;
  message?: string;
  data?: {
    evidence: {
      url: string;
      publicId: string;
      resourceType: 'image' | 'video' | 'raw';
      mimeType: string;
      originalName: string;
      size: number;
      uploadedAt: string;
    };
    trustAnalysis?: any;
  };
}

export const reportService = {
  /**
   * Submit citizen report to backend
   */
  async createReport(dto: CreateReportDto) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      const error: any = new Error(json.message || `Failed to submit report (${res.status})`);
      error.status = res.status;
      throw error;
    }
    return json.data;
  },

  /**
   * Upload evidence media file for an existing report
   */
  async uploadEvidence(reportId: string, file: File): Promise<UploadEvidenceResponse['data']> {
    const formData = new FormData();
    formData.append('evidence', file);

    const res = await fetch(`${API_BASE}/reports/${reportId}/evidence`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const json: UploadEvidenceResponse = await res.json();
    if (!res.ok || !json.success || !json.data) {
      throw new Error(json.message || 'Evidence upload failed');
    }
    return json.data;
  },

  /**
   * Fetch public reports list
   */
  async getReports(params: { category?: string; status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch reports');
    }
    return json.data;
  },

  /**
   * Fetch single report detail
   */
  async getReportById(id: string) {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch report');
    }
    return json.data;
  },

  /**
   * Fetch correlations (parent incident, corroborations, contradictions) for a report
   */
  async getReportCorrelations(id: string) {
    const res = await fetch(`${API_BASE}/reports/${id}/correlations`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch correlations');
    }
    return json.data;
  },

  /**
   * Fetch list of grouped incidents
   */
  async getIncidents(params: { category?: string; status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/incidents?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch incidents');
    }
    return json.data;
  },

  /**
   * Fetch incident details by ID
   */
  async getIncidentById(id: string) {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to fetch incident');
    }
    return json.data;
  },
};
