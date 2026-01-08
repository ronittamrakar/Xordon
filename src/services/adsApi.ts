/**
 * Ads API Service
 * Google Ads, Facebook Ads, and advertising management
 */

import { api } from '@/lib/api';

export interface AdAccount {
  id: number;
  workspace_id: number;
  platform: 'google_ads' | 'facebook_ads' | 'microsoft_ads' | 'linkedin_ads' | 'tiktok_ads';
  platform_account_id: string;
  account_name: string | null;
  currency: string;
  timezone: string | null;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  sync_campaigns: boolean;
  sync_conversions: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export interface AdCampaign {
  id: number;
  workspace_id: number;
  ad_account_id: number;
  platform_campaign_id: string;
  name: string;
  status: 'enabled' | 'paused' | 'removed' | 'ended';
  campaign_type: string | null;
  daily_budget: number | null;
  total_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  targeting_summary: string | null;
  last_sync_at: string | null;
  created_at: string;
  platform?: string;
  account_name?: string;
  metrics?: AdCampaignMetric[];
}

export interface AdCampaignMetric {
  id: number;
  campaign_id: number;
  metric_date: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  conversions: number;
  conversion_value: number;
  cost_per_conversion: number | null;
  reach: number | null;
  frequency: number | null;
  engagement: number | null;
  video_views: number | null;
  video_view_rate: number | null;
}

export interface AdConversion {
  id: number;
  workspace_id: number;
  ad_account_id: number | null;
  campaign_id: number | null;
  conversion_name: string;
  conversion_type: string | null;
  contact_id: number | null;
  click_id: string | null;
  conversion_value: number | null;
  currency: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  converted_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  campaign_name?: string;
  platform?: string;
}

export interface AdBudget {
  id: number;
  workspace_id: number;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  total_budget: number;
  spent: number;
  remaining: number;
  google_ads_budget: number | null;
  facebook_ads_budget: number | null;
  other_budget: number | null;
  alert_threshold: number;
  alert_sent: boolean;
  created_at: string;
}


export interface AdABTest {
  id: number;
  workspace_id: number;
  name: string;
  campaign_id: number;
  campaign_name?: string;
  variant_a_name: string;
  variant_b_name: string;
  variant_a_budget: number;
  variant_b_budget: number;
  test_duration_days: number;
  metric: 'ctr' | 'conversions' | 'cpa' | 'roas';
  status: 'active' | 'completed' | 'paused';
  winner: string | null;
  created_at: string;
}

export interface AdAnalytics {
  overall: {
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_conversion_value: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
  };
  by_platform: Array<{
    platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversion_value: number;
  }>;
  daily_trend: Array<{
    date: string;
    spend: number;
    clicks: number;
    conversions: number;
  }>;
  top_campaigns: Array<{
    name: string;
    platform: string;
    spend: number;
    conversions: number;
    conversion_value: number;
  }>;
  period: { from: string; to: string };
}

export const adsApi = {
  // ==================== ACCOUNTS ====================

  async getAccounts(): Promise<AdAccount[]> {
    const response = await api.get('/ads/accounts') as { data: AdAccount[] };
    return response.data;
  },

  async disconnectAccount(id: number): Promise<void> {
    await api.post(`/ads/accounts/${id}/disconnect`, {});
  },

  // ==================== CAMPAIGNS ====================

  async getCampaigns(params: {
    account_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: AdCampaign[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.account_id) searchParams.set('account_id', String(params.account_id));
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/ads/campaigns${query ? `?${query}` : ''}`) as { data: AdCampaign[]; meta: any };
    return response;
  },

  async getCampaign(id: number): Promise<AdCampaign> {
    const response = await api.get(`/ads/campaigns/${id}`) as { data: AdCampaign };
    return response.data;
  },

  async getCampaignMetrics(id: number, params: { from?: string; to?: string } = {}): Promise<{
    daily: AdCampaignMetric[];
    totals: {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      conversion_value: number;
      ctr: number;
      cpc: number;
      cpa: number;
      roas: number;
    };
    period: { from: string; to: string };
  }> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/ads/campaigns/${id}/metrics${query ? `?${query}` : ''}`) as { data: any };
    return response.data;
  },

  async createCampaign(data: Partial<AdCampaign>): Promise<{ id: number }> {
    const response = await api.post('/ads/campaigns', data) as { data: { id: number } };
    return response.data;
  },

  async updateCampaign(id: string | number, data: Partial<AdCampaign>): Promise<void> {
    await api.put(`/ads/campaigns/${id}`, data);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.delete(`/ads/campaigns/${id}`);
  },

  async syncCampaigns(): Promise<{ synced: number }> {
    const response = await api.post('/ads/campaigns/sync', {}) as { data: { synced: number } };
    return response.data;
  },

  // ==================== CONVERSIONS ====================

  async getConversions(params: {
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: AdConversion[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/ads/conversions${query ? `?${query}` : ''}`) as { data: AdConversion[]; meta: any };
    return response;
  },

  async trackConversion(data: {
    conversion_name: string;
    conversion_type?: string;
    ad_account_id?: number;
    campaign_id?: number;
    contact_id?: number;
    click_id?: string;
    conversion_value?: number;
    currency?: string;
    source?: string;
    medium?: string;
    campaign?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/ads/conversions', data) as { data: { id: number } };
    return response.data;
  },

  // ==================== BUDGETS ====================

  async getBudgets(): Promise<AdBudget[]> {
    const response = await api.get('/ads/budgets') as { data: AdBudget[] };
    return response.data;
  },

  async createBudget(data: {
    period_type?: 'monthly' | 'quarterly' | 'yearly';
    period_start: string;
    period_end: string;
    total_budget: number;
    google_ads_budget?: number;
    facebook_ads_budget?: number;
    other_budget?: number;
    alert_threshold?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/ads/budgets', data) as { data: { id: number } };
    return response.data;
  },

  async updateBudget(id: number, data: Partial<Pick<AdBudget,
    'total_budget' | 'google_ads_budget' | 'facebook_ads_budget' | 'other_budget' | 'spent' | 'alert_threshold'
  >>): Promise<void> {
    await api.put(`/ads/budgets/${id}`, data);
  },

  async deleteBudget(id: string): Promise<void> {
    await api.delete(`/ads/budgets/${id}`);
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<AdAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/ads/analytics${query ? `?${query}` : ''}`) as { data: AdAnalytics };
    return response.data;
  },

  // ==================== A/B TESTING ====================

  async getABTests(): Promise<AdABTest[]> {
    const response = await api.get('/ads/ab-tests') as { data: AdABTest[] };
    return response.data;
  },

  async createABTest(data: Partial<AdABTest>): Promise<{ id: number }> {
    const response = await api.post('/ads/ab-tests', data) as { data: { id: number } };
    return response.data;
  },

  async deleteABTest(id: number): Promise<void> {
    await api.delete(`/ads/ab-tests/${id}`);
  },

  async getOAuthUrl(platform: string): Promise<{ auth_url: string }> {
    return await api.get(`/ads/oauth/${platform}`) as { auth_url: string };
  },
};

export default adsApi;
