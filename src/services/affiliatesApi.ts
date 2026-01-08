/**
 * Affiliates API Service
 * Affiliate program management - partners, referrals, and payouts
 */

import { api, API_URL } from '@/lib/api';

export interface Affiliate {
  id: number;
  workspace_id: number;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  commission_rate: number;
  unique_code: string;
  referral_url: string | null;
  total_referrals: number;
  total_earnings: number;
  unpaid_balance: number;
  phone: string | null;
  company_name: string | null;
  payment_method: string | null;
  payment_email: string | null;
  created_at: string;
}

export interface AffiliateReferral {
  id: number;
  workspace_id: number;
  affiliate_id: number;
  contact_id: number | null;
  customer_email: string | null;
  customer_name: string | null;
  status: 'pending' | 'converted' | 'cancelled' | 'rejected';
  conversion_type: string | null;
  conversion_value: number;
  commission_amount: number;
  referral_source: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referred_at: string;
  converted_at: string | null;
  payout_id: number | null;
  affiliate_name?: string;
  affiliate_email?: string;
}

export interface AffiliatePayout {
  id: number;
  workspace_id: number;
  affiliate_id: number;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  processed_by: number | null;
  processed_at: string | null;
  created_at: string;
  affiliate_name?: string;
  affiliate_email?: string;
}

export interface AffiliateAnalytics {
  affiliates: {
    total: number;
    active: number;
    pending: number;
  };
  referrals: {
    total: number;
    converted: number;
    total_commissions: number;
  };
  payouts: {
    total: number;
    total_paid: number;
    pending_amount: number;
  };
}

export const affiliatesApi = {
  // ==================== AFFILIATES ====================

  async getAffiliates(): Promise<Affiliate[]> {
    const response = await api.get('/affiliates') as { data: Affiliate[] };
    return response.data;
  },

  async getAffiliate(id: number): Promise<Affiliate & { recent_referrals?: AffiliateReferral[]; payout_history?: AffiliatePayout[] }> {
    const response = await api.get(`/affiliates/${id}`) as { data: Affiliate & { recent_referrals?: AffiliateReferral[]; payout_history?: AffiliatePayout[] } };
    return response.data;
  },

  async createAffiliate(data: {
    name: string;
    email: string;
    status?: 'active' | 'pending' | 'inactive';
    commission_rate?: number;
    phone?: string;
    company_name?: string;
    payment_method?: string;
    payment_email?: string;
    notes?: string;
    welcome_message?: string;
    cookie_duration_days?: number;
  }): Promise<{ id: number; unique_code: string }> {
    const response = await api.post('/affiliates', data) as { data: { id: number; unique_code: string } };
    return response.data;
  },

  async updateAffiliate(id: number, data: Partial<{
    name: string;
    email: string;
    status: 'active' | 'pending' | 'inactive' | 'suspended';
    commission_rate: number;
    phone: string;
    company_name: string;
    payment_method: string;
    payment_email: string;
    notes: string;
    cookie_duration_days: number;
  }>): Promise<void> {
    await api.put(`/affiliates/${id}`, data);
  },

  async deleteAffiliate(id: number): Promise<void> {
    await api.delete(`/affiliates/${id}`);
  },

  // ==================== REFERRALS ====================

  async getReferrals(params: {
    affiliate_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: AffiliateReferral[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.affiliate_id) searchParams.set('affiliate_id', String(params.affiliate_id));
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/affiliates/referrals${query ? `?${query}` : ''}`) as { data: AffiliateReferral[]; meta: any };
    // Normalize numeric fields in case the backend returns them as strings
    const normalized = response.data.map(r => ({
      ...r,
      commission_amount: Number(r.commission_amount),
      conversion_value: Number(r.conversion_value),
    }));
    return { data: normalized, meta: response.meta };
  },

  // ==================== PAYOUTS ====================

  async getPayouts(): Promise<AffiliatePayout[]> {
    const response = await api.get('/affiliates/payouts') as { data: AffiliatePayout[] };
    return response.data;
  },

  async createPayout(data: {
    affiliate_id: number;
    amount: number;
    currency?: string;
    payment_method?: string;
    payment_reference?: string;
    status?: 'pending' | 'processing' | 'completed';
    period_start?: string;
    period_end?: string;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/affiliates/payouts', data) as { data: { id: number } };
    return response.data;
  },

  // ==================== ANALYTICS & TRACKING ====================

  async getAnalytics(): Promise<AffiliateAnalytics> {
    const response = await api.get('/affiliates/analytics') as { data: AffiliateAnalytics };
    return response.data;
  },

  async recordClick(data: {
    code: string;
    referral_url?: string;
    landing_page?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  }): Promise<{ success: boolean; data: { affiliate_id: number; expires_at: string } }> {
    return await api.post('/affiliates/record-click', data) as any;
  },

  async getSettings(): Promise<any> {
    const response = await api.get('/affiliates/settings') as { data: any };
    return response.data;
  },

  async updateSettings(data: any): Promise<void> {
    await api.post('/affiliates/settings', data);
  },

  async exportPayouts(): Promise<void> {
    window.open(`${API_URL}/affiliates/export-payouts`, '_blank');
  },
};

export default affiliatesApi;
