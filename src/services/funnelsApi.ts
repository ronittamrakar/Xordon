import api from '@/lib/api';

export interface Funnel {
  id: number;
  workspace_id: number;
  name: string;
  slug?: string;
  description?: string;
  domain?: string;
  favicon_url?: string;
  total_views: number;
  total_conversions: number;
  conversion_rate: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  step_count?: number;
  steps?: FunnelStep[];
}

export interface FunnelStep {
  id: number;
  funnel_id: number;
  name: string;
  slug?: string;
  step_type: 'landing' | 'optin' | 'sales' | 'checkout' | 'upsell' | 'downsell' | 'thankyou' | 'webinar' | 'custom';
  sort_order: number;
  landing_page_id?: number;
  page_content?: string;
  conversion_goal: 'pageview' | 'form_submit' | 'button_click' | 'purchase' | 'custom';
  conversion_value?: number;
  views: number;
  conversions: number;
  conversion_rate?: number;
  is_active: boolean;
}

export const funnelsApi = {
  list: async (status?: 'draft' | 'published' | 'archived') => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/funnels${params}`);
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/funnels/${id}`);
    return response.data;
  },

  create: async (data: Partial<Funnel>) => {
    const response = await api.post('/funnels', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Funnel>) => {
    const response = await api.put(`/funnels/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/funnels/${id}`);
    return response.data;
  },

  publish: async (id: number) => {
    const response = await api.post(`/funnels/${id}/publish`);
    return response.data;
  },

  getAnalytics: async (id: number) => {
    const response = await api.get(`/funnels/${id}/analytics`);
    return response.data;
  },

  trackView: async (funnelId: number, stepId: number) => {
    const response = await api.post(`/funnels/${funnelId}/steps/${stepId}/view`);
    return response.data;
  },

  trackConversion: async (funnelId: number, stepId: number) => {
    const response = await api.post(`/funnels/${funnelId}/steps/${stepId}/convert`);
    return response.data;
  },

  getDashboardAnalytics: async (period: string = '30', funnelId?: string) => {
    const query = new URLSearchParams({ period });
    if (funnelId && funnelId !== 'all') {
      query.append('funnel_id', funnelId);
    }
    const response = await api.get(`/analytics/funnels?${query.toString()}`);
    return response.data;
  },
};

export default funnelsApi;
