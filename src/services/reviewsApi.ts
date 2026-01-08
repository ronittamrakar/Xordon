import { api } from '@/lib/api';

export interface Review {
  id: number;
  workspace_id: number;
  company_id: number | null;
  platform_id: number | null;
  platform: string;
  external_id: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  reply: string | null;
  replied_at: string | null;
  is_verified: boolean;
  is_featured: boolean;
  status: 'pending' | 'approved' | 'hidden' | 'flagged';
  review_date: string | null;
  created_at: string;
  platform_url?: string;
}

export interface ReviewRequest {
  id: number;
  workspace_id: number;
  company_id: number | null;
  contact_id: number | null;
  platform_id: number | null;
  channel: 'sms' | 'email';
  status: 'pending' | 'sent' | 'clicked' | 'reviewed' | 'declined' | 'failed';
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  message: string | null;
  review_url: string | null;
  sent_at: string | null;
  clicked_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  contact_first_name?: string;
  contact_last_name?: string;
  platform_name?: string;
}

export interface ReviewPlatform {
  id: number;
  workspace_id: number;
  platform: string;
  platform_url: string | null;
  place_id: string | null;
  is_active: boolean;
  is_primary: boolean;
  review_count?: number;
  avg_rating?: number;
}

export interface ReviewStats {
  total: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  replied: number;
  needs_attention: number;
  trend: {
    recent: number;
    previous: number;
  };
}

export interface RequestStats {
  total: number;
  sent: number;
  clicked: number;
  reviewed: number;
  declined: number;
  conversion_rate: number;
}

export const reviewsApi = {
  // ==================== REVIEWS ====================
  
  async listReviews(params: { platform?: string; rating?: number; status?: string; limit?: number; offset?: number } = {}): Promise<{ data: Review[]; meta: { total: number } }> {
    const searchParams = new URLSearchParams();
    if (params.platform) searchParams.set('platform', params.platform);
    if (params.rating) searchParams.set('rating', String(params.rating));
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/reviews/v2${query ? `?${query}` : ''}`) as { data: Review[]; meta: { total: number } };
    return response;
  },

  async getStats(): Promise<ReviewStats> {
    const response = await api.get('/reviews/v2/stats') as { data: ReviewStats };
    return response.data;
  },

  async replyToReview(id: number, reply: string): Promise<void> {
    await api.post(`/reviews/v2/${id}/reply`, { reply });
  },

  async updateReviewStatus(id: number, status: string): Promise<void> {
    await api.post(`/reviews/v2/${id}/status`, { status });
  },

  // ==================== REVIEW REQUESTS ====================

  async listRequests(params: { status?: string; limit?: number; offset?: number } = {}): Promise<ReviewRequest[]> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/reviews/v2/requests${query ? `?${query}` : ''}`) as { data: ReviewRequest[] };
    return response.data;
  },

  async sendRequest(data: {
    contact_id?: number;
    recipient_name?: string;
    recipient_email?: string;
    recipient_phone?: string;
    channel?: 'sms' | 'email';
    message?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/reviews/v2/requests', data) as { data: { id: number } };
    return response.data;
  },

  async getRequestStats(): Promise<RequestStats> {
    const response = await api.get('/reviews/v2/requests/stats') as { data: RequestStats };
    return response.data;
  },

  // ==================== PLATFORMS ====================

  async listPlatforms(): Promise<ReviewPlatform[]> {
    const response = await api.get('/reviews/v2/platforms') as { data: ReviewPlatform[] };
    return response.data;
  },

  async addPlatform(data: Partial<ReviewPlatform>): Promise<{ id: number }> {
    const response = await api.post('/reviews/v2/platforms', data) as { data: { id: number } };
    return response.data;
  },

  async updatePlatform(id: number, data: Partial<ReviewPlatform>): Promise<void> {
    await api.put(`/reviews/v2/platforms/${id}`, data);
  },
};

export default reviewsApi;
