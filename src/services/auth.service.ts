import { UserProfile } from '../types/report';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  };
}

export const authService = {
  /**
   * Send Google ID token to backend for verification and session cookie creation
   */
  async loginWithGoogle(credential: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Ensures HttpOnly cookie is set
      body: JSON.stringify({ credential }),
    });

    const json: AuthResponse = await res.json();
    if (!res.ok || !json.success || !json.data?.user) {
      throw new Error(json.message || 'Google authentication failed');
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
   * Check current user session from HttpOnly cookie
   */
  async getMe(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * Log out of current session and clear HttpOnly cookie on backend
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  },
};
