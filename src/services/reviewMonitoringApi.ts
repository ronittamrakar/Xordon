import { api } from '@/lib/api';

export interface ReviewPlatformConnection {
  id: number;
  workspace_id: number;
  company_id?: number;
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot' | 'g2' | 'capterra' | 'custom';
  platform_name: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  api_key?: string;
  location_id?: string;
  page_id?: string;
  business_id?: string;
  review_url?: string;
  status: 'active' | 'paused' | 'disconnected' | 'error';
  last_sync_at?: string;
  sync_frequency_minutes: number;
  created_at: string;
  updated_at: string;
  review_count?: number;
  avg_rating?: number;
}

export interface ExternalReview {
  id: number;
  workspace_id: number;
  company_id?: number;
  connection_id: number;
  external_id: string;
  platform: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  reviewer_profile_url?: string;
  rating: number;
  title?: string;
  content: string;
  review_url?: string;
  review_date: string;
  has_response: boolean;
  response_text?: string;
  response_date?: string;
  responded_by?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  status: 'new' | 'read' | 'responded' | 'flagged' | 'archived';
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponseTemplate {
  id: number;
  workspace_id: number;
  name: string;
  category: 'positive' | 'neutral' | 'negative' | 'general';
  template_text: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewDashboard {
  stats: {
    total_reviews: number;
    avg_rating: number;
    positive_reviews: number;
    negative_reviews: number;
    new_reviews: number;
    responded_reviews: number;
  };
  rating_distribution: Array<{ rating: number; count: number }>;
  recent_reviews: ExternalReview[];
}

const reviewMonitoringApi = {
  // Platform connections
  listConnections: async (): Promise<{ items: ReviewPlatformConnection[] }> => {
    const response = await api.get('/review-monitoring/platforms');
    return response.data;
  },

  connectPlatform: async (data: Partial<ReviewPlatformConnection>): Promise<ReviewPlatformConnection> => {
    const response = await api.post('/review-monitoring/platforms', data);
    return response.data;
  },

  updateConnection: async (id: number, data: Partial<ReviewPlatformConnection>): Promise<ReviewPlatformConnection> => {
    const response = await api.put(`/review-monitoring/platforms/${id}`, data);
    return response.data;
  },

  deleteConnection: async (id: number): Promise<void> => {
    await api.delete(`/review-monitoring/platforms/${id}`);
  },

  syncReviews: async (connectionId: number): Promise<any> => {
    const response = await api.post(`/review-monitoring/platforms/${connectionId}/sync`);
    return response.data;
  },

  // Reviews
  listReviews: async (params?: {
    status?: string;
    sentiment?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ExternalReview[] }> => {
    const response = await api.get('/review-monitoring/reviews', { params });
    return response.data;
  },

  getReview: async (id: number): Promise<ExternalReview> => {
    const response = await api.get(`/review-monitoring/reviews/${id}`);
    return response.data;
  },

  respondToReview: async (id: number, responseText: string): Promise<ExternalReview> => {
    const response = await api.post(`/review-monitoring/reviews/${id}/respond`, { response: responseText });
    return response.data;
  },

  updateReviewStatus: async (id: number, status: string): Promise<ExternalReview> => {
    const response = await api.put(`/review-monitoring/reviews/${id}/status`, { status });
    return response.data;
  },

  // Dashboard
  getDashboard: async (): Promise<ReviewDashboard> => {
    const response = await api.get('/review-monitoring/dashboard');
    return response.data;
  },

  // Templates
  listTemplates: async (): Promise<ReviewResponseTemplate[]> => {
    const response = await api.get('/review-monitoring/templates');
    return response.data;
  },

  createTemplate: async (data: Partial<ReviewResponseTemplate>): Promise<ReviewResponseTemplate> => {
    const response = await api.post('/review-monitoring/templates', data);
    return response.data;
  },
};

export default reviewMonitoringApi;
