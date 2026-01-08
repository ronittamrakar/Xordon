import api from '@/lib/api';

export interface ReviewPlatformConfig {
  id: number;
  workspace_id: number;
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot';
  platform_name: string;
  is_active: boolean;
  access_token?: string;
  config?: {
    locations?: Array<{
      id: string;
      title: string;
      address?: any;
    }>;
    page_id?: string;
  };
  last_sync_at?: string;
  created_at: string;
}

export interface Review {
  id: number;
  workspace_id: number;
  platform: string;
  external_id: string;
  reviewer_name: string;
  rating: number;
  review_text?: string;
  review_date: string;
  review_url?: string;
  response_text?: string;
  responded_at?: string;
  created_at: string;
}

export const reviewIntegrationsApi = {
  // Platform Configs
  listPlatforms: async () => {
    const response = await api.get('/review-requests/platforms');
    return response.data;
  },

  createPlatform: async (data: Partial<ReviewPlatformConfig>) => {
    const response = await api.post('/review-requests/platforms', data);
    return response.data;
  },

  updatePlatform: async (id: number, data: Partial<ReviewPlatformConfig>) => {
    const response = await api.put(`/review-requests/platforms/${id}`, data);
    return response.data;
  },

  deletePlatform: async (id: number) => {
    const response = await api.delete(`/review-requests/platforms/${id}`);
    return response.data;
  },

  // OAuth Connections
  connectGoogle: async (platformConfigId: number) => {
    const response = await api.post('/reviews/google/connect', {
      platform_config_id: platformConfigId,
    });
    return response.data;
  },

  connectFacebook: async (platformConfigId: number) => {
    const response = await api.post('/reviews/facebook/connect', {
      platform_config_id: platformConfigId,
    });
    return response.data;
  },

  // Sync
  syncPlatform: async (platformConfigId: number, platform: 'google' | 'facebook') => {
    const response = await api.post(`/reviews/platforms/${platformConfigId}/sync`, {
      platform,
    });
    return response.data;
  },

  disconnect: async (platformConfigId: number) => {
    const response = await api.post(`/reviews/platforms/${platformConfigId}/disconnect`);
    return response.data;
  },

  // Reviews
  listReviews: async (params?: { platform?: string; rating?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.rating) queryParams.append('rating', String(params.rating));
    const response = await api.get(`/reviews?${queryParams}`);
    return response.data;
  },

  replyToReview: async (reviewId: number, replyText: string) => {
    const response = await api.post(`/reviews/${reviewId}/reply`, {
      reply_text: replyText,
    });
    return response.data;
  },
};

export default reviewIntegrationsApi;
