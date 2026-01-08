import { api } from '@/lib/api';

export interface CustomDashboard {
  id?: number;
  workspace_id?: number;
  user_id?: number;
  name: string;
  description?: string;
  layout: any;
  widgets: any[];
  is_default?: boolean;
  is_shared?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsEvent {
  id?: number;
  workspace_id?: number;
  event_type: string;
  event_name: string;
  properties?: any;
  user_id?: number;
  contact_id?: number;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface FunnelAnalytics {
  id?: number;
  workspace_id?: number;
  funnel_id?: number;
  date: string;
  step_name: string;
  step_order: number;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  avg_time_on_step: number;
  drop_off_count: number;
}

export interface CohortAnalysis {
  id?: number;
  workspace_id?: number;
  cohort_date: string;
  cohort_type: string;
  cohort_size: number;
  period_number: number;
  retained_count: number;
  retention_rate: number;
  revenue: number;
}

export const analyticsApi = {
  // Dashboards
  listDashboards: async (): Promise<CustomDashboard[]> => {
    const response = await api.get('/analytics/dashboards');
    return response.data;
  },

  createDashboard: async (data: Partial<CustomDashboard>) => {
    const response = await api.post('/analytics/dashboards', data);
    return response.data;
  },

  updateDashboard: async (id: number, data: Partial<CustomDashboard>) => {
    const response = await api.put(`/analytics/dashboards/${id}`, data);
    return response.data;
  },

  // Events
  trackEvent: async (data: Partial<AnalyticsEvent>) => {
    const response = await api.post('/analytics/events', data);
    return response.data;
  },

  getEvents: async (params?: {
    event_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]> => {
    const response = await api.get('/analytics/events', { params });
    return response.data;
  },

  // Funnel Analytics
  getFunnelAnalytics: async (params?: {
    funnel_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<FunnelAnalytics[]> => {
    const response = await api.get('/analytics/funnel', { params });
    return response.data;
  },

  // Cohort Analysis
  getCohortAnalysis: async (params?: {
    cohort_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<CohortAnalysis[]> => {
    const response = await api.get('/analytics/cohort', { params });
    return response.data;
  },
};
