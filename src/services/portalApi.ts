import api from '@/lib/api';

export interface PortalIdentity {
  id: number;
  email: string | null;
  phone: string | null;
  contact_id: number | null;
}

export interface PortalSession {
  token: string;
  expires_at: string;
  redirect_url?: string;
  identity: PortalIdentity;
}

export interface PortalValidation {
  valid: boolean;
  data: {
    workspace_id: number;
    contact_id: number | null;
    email: string | null;
    phone: string | null;
  };
}

// Portal Auth API (for customer self-service portal)
export const portalAuthApi = {
  // Request magic link login (email)
  requestMagicLink: (data: { email: string; workspace_id: number; redirect_url?: string }) =>
    api.post<{ success: boolean; message: string }>('/portal/auth/magic-link', data).then(r => r.data),

  // Verify magic link token
  verifyMagicLink: (token: string) =>
    api.post<{ success: boolean; data: PortalSession }>('/portal/auth/magic-link/verify', { token }).then(r => r.data),

  // Request OTP login (SMS)
  requestOtp: (data: { phone: string; workspace_id: number }) =>
    api.post<{ success: boolean; message: string }>('/portal/auth/otp', data).then(r => r.data),

  // Verify OTP code
  verifyOtp: (data: { phone: string; code: string; workspace_id: number }) =>
    api.post<{ success: boolean; data: PortalSession }>('/portal/auth/otp/verify', data).then(r => r.data),

  // Validate current session
  validateSession: (token: string) =>
    api.get<PortalValidation>('/portal/auth/validate', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.data),

  // Logout
  logout: (token: string) =>
    api.post('/portal/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

// Portal session management helpers
export const portalSession = {
  TOKEN_KEY: 'portal_token',
  
  getToken: (): string | null => {
    return localStorage.getItem('portal_token');
  },
  
  setToken: (token: string): void => {
    localStorage.setItem('portal_token', token);
  },
  
  clearToken: (): void => {
    localStorage.removeItem('portal_token');
  },
  
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('portal_token');
  },
};

export default {
  auth: portalAuthApi,
  session: portalSession,
};
