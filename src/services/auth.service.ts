import { UserProfile } from '../types/report';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'dailybugle_token';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      reputation: number;
      role: string;
    };
    token?: string;
  };
}

const getAuthHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
};

export const authService = {
  /**
   * Send Google ID token or OAuth2 access token to backend for verification and session creation
   */
  async loginWithGoogle(tokenOrPayload: { credential?: string; accessToken?: string } | string): Promise<UserProfile> {
    const payload = typeof tokenOrPayload === 'string' ? { credential: tokenOrPayload } : tokenOrPayload;

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE.startsWith('http://localhost')) {
      throw new Error(
        `Production deployment error: Frontend is on HTTPS (${window.location.origin}), but VITE_API_URL is pointing to ${API_BASE}. Please set VITE_API_URL in your Vercel Project Environment Variables to your deployed backend URL.`
      );
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include', // Ensures HttpOnly cookie is set
        body: JSON.stringify(payload),
      });
    } catch (fetchErr: any) {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE.startsWith('http://localhost')) {
        throw new Error(
          `Cannot connect to backend: The site is on HTTPS but trying to contact ${API_BASE}. Configure VITE_API_URL in Vercel to your deployed backend.`
        );
      }
      throw new Error(`Cannot connect to backend server (${API_BASE}). Please check your internet connection or server status.`);
    }

    const json: AuthResponse = await res.json();
    if (!res.ok || !json.success || !json.data?.user) {
      throw new Error(json.message || 'Google authentication failed');
    }

    // Save token as fallback for cross-site cookie blocking (Safari/incognito)
    if (json.data.token) {
      try {
        localStorage.setItem(TOKEN_KEY, json.data.token);
      } catch {}
    }

    const u = json.data.user;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatar || '',
      avatar: u.avatar || '',
      role: u.role,
      reputation: u.reputation ?? 0,
      reportsCount: 0,
      verifiedCount: 0,
      rejectedCount: 0,
      isTrustedReporter: (u.reputation ?? 0) >= 50,
    };
  },

  /**
   * Check current user session from HttpOnly cookie or stored token
   */
  async getMe(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include', // Sends HttpOnly cookie
      });

      if (!res.ok) {
        return null;
      }

      const json: AuthResponse = await res.json();
      if (!json.success || !json.data?.user) {
        return null;
      }

      const u = json.data.user;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatar || '',
        avatar: u.avatar || '',
        role: u.role,
        reputation: u.reputation ?? 0,
        reportsCount: 0,
        verifiedCount: 0,
        rejectedCount: 0,
        isTrustedReporter: (u.reputation ?? 0) >= 50,
      };
    } catch {
      return null;
    }
  },

  /**
   * Log out of current session and clear HttpOnly cookie and stored token
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {}
    }
  },
};

