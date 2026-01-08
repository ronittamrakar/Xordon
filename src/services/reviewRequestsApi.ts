import api from '@/lib/api';

export interface ReviewRequest {
  id: number;
  workspace_id: number;
  contact_id?: number;
  appointment_id?: number;
  job_id?: number;
  invoice_id?: number;
  channel: 'email' | 'sms' | 'both';
  email?: string;
  phone?: string;
  request_token: string;
  short_url?: string;
  status: 'pending' | 'sent' | 'clicked' | 'reviewed' | 'declined' | 'expired';
  sent_at?: string;
  clicked_at?: string;
  reviewed_at?: string;
  review_id?: number;
  review_platform?: string;
  review_rating?: number;
  automation_id?: number;
  expires_at?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  contact_email?: string;
}

export interface ReviewStats {
  total: number;
  sent: number;
  clicked: number;
  reviewed: number;
  declined: number;
  click_rate: number;
  review_rate: number;
  avg_rating?: number;
}

export interface ReviewPlatformConfig {
  id: number;
  workspace_id: number;
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot' | 'custom';
  platform_name?: string;
  is_connected: boolean;
  account_id?: string;
  location_id?: string;
  review_url?: string;
  auto_sync: boolean;
  last_synced_at?: string;
  is_active: boolean;
  priority: number;
}

export const reviewRequestsApi = {
  list: async (status?: string, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status) params.append('status', status);
    const response = await api.get(`/review-requests?${params}`);
    return response.data;
  },

  getStats: async (): Promise<ReviewStats> => {
    const response = await api.get('/review-requests/stats');
    return response.data.data;
  },

  send: async (data: {
    contact_id?: number;
    email?: string;
    phone?: string;
    channel?: 'email' | 'sms' | 'both';
    appointment_id?: number;
    job_id?: number;
    invoice_id?: number;
  }) => {
    const response = await api.post('/review-requests', data);
    return response.data;
  },

  sendBulk: async (contactIds: number[], channel: 'email' | 'sms' = 'email') => {
    const response = await api.post('/review-requests/bulk', { contact_ids: contactIds, channel });
    return response.data;
  },

  getPlatforms: async () => {
    const response = await api.get('/review-requests/platforms');
    return response.data;
  },

  savePlatform: async (data: Partial<ReviewPlatformConfig>) => {
    const response = await api.post('/review-requests/platforms', data);
    return response.data;
  },

  deletePlatform: async (id: number) => {
    const response = await api.delete(`/review-requests/platforms/${id}`);
    return response.data;
  },

  recordReview: async (token: string, rating?: number, platform?: string) => {
    const response = await api.post('/review-requests/record', { token, rating, platform });
    return response.data;
  },
};

export default reviewRequestsApi;
