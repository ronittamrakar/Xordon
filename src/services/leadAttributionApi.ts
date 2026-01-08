/**
 * Lead Attribution API Service
 * Track lead sources and attribution for ROI analysis
 */

import { api } from '@/lib/api';

export interface LeadSource {
  id: number;
  workspace_id: number;
  name: string;
  type: 'organic' | 'paid' | 'referral' | 'direct' | 'social' | 'email' | 'phone' | 'form' | 'api' | 'import' | 'other';
  cost_per_lead: number | null;
  monthly_budget: number | null;
  is_active: boolean;
  color: string;
  lead_count?: number;
  total_value?: number;
  created_at: string;
  updated_at: string;
}

export interface LeadAttribution {
  id: number;
  workspace_id: number;
  contact_id: number;
  lead_source_id: number | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  referrer_url: string | null;
  landing_page: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  first_touch: boolean;
  conversion_type: string | null;
  conversion_value: number | null;
  attributed_at: string;
  source_name?: string;
  source_type?: string;
  source_color?: string;
}

export interface AttributionAnalytics {
  by_source: Array<{
    id: number;
    name: string;
    type: string;
    color: string;
    cost_per_lead: number | null;
    lead_count: number;
    first_touch_count: number;
    total_value: number | null;
    avg_value: number | null;
  }>;
  by_campaign: Array<{
    campaign: string;
    lead_count: number;
    total_value: number | null;
  }>;
  by_conversion_type: Array<{
    conversion_type: string;
    count: number;
    total_value: number | null;
  }>;
  daily_trend: Array<{
    date: string;
    lead_count: number;
    total_value: number | null;
  }>;
  period: {
    from: string;
    to: string;
  };
}

export const leadAttributionApi = {
  // ==================== LEAD SOURCES ====================

  /**
   * Get all lead sources
   */
  async getSources(): Promise<LeadSource[]> {
    const response = await api.get('/lead-sources') as { data: LeadSource[] };
    return response.data;
  },

  /**
   * Create lead source
   */
  async createSource(data: {
    name: string;
    type?: LeadSource['type'];
    cost_per_lead?: number;
    monthly_budget?: number;
    color?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/lead-sources', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update lead source
   */
  async updateSource(id: number, data: Partial<Pick<LeadSource, 'name' | 'type' | 'cost_per_lead' | 'monthly_budget' | 'color' | 'is_active'>>): Promise<void> {
    await api.put(`/lead-sources/${id}`, data);
  },

  /**
   * Delete lead source
   */
  async deleteSource(id: number): Promise<void> {
    await api.delete(`/lead-sources/${id}`);
  },

  // ==================== ATTRIBUTIONS ====================

  /**
   * Get attributions for a contact
   */
  async getContactAttributions(contactId: number): Promise<LeadAttribution[]> {
    const response = await api.get(`/contacts/${contactId}/attributions`) as { data: LeadAttribution[] };
    return response.data;
  },

  /**
   * Create attribution
   */
  async createAttribution(data: {
    contact_id: number;
    lead_source_id?: number;
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    referrer_url?: string;
    landing_page?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    ip_address?: string;
    conversion_type?: string;
    conversion_value?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/attributions', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Get attribution analytics
   */
  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<AttributionAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/attributions/analytics${query ? `?${query}` : ''}`) as { data: AttributionAnalytics };
    return response.data;
  },

  /**
   * Track attribution (for web tracking)
   */
  async track(data: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    referrer?: string;
    landing_page?: string;
  }): Promise<Record<string, unknown>> {
    const response = await api.post('/attributions/track', data) as { data: Record<string, unknown> };
    return response.data;
  },
};

export default leadAttributionApi;
