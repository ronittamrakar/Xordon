/**
 * Estimates API Service
 * Quotes and estimates management
 */

import { api } from '@/lib/api';

export interface EstimateItem {
  id?: number;
  estimate_id?: number;
  product_id: number | null;
  service_id: number | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null;
  tax_rate: number | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  sort_order: number;
}

export interface Estimate {
  id: number;
  workspace_id: number;
  company_id: number | null;
  contact_id: number | null;
  estimate_number: string;
  title: string | null;
  issue_date: string;
  expiry_date: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';
  subtotal: number;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number | null;
  discount_amount: number;
  tax_rate: number | null;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  footer: string | null;
  converted_to_invoice_id: number | null;
  converted_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  accepted_by: string | null;
  signature_url: string | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  items?: EstimateItem[];
}

export interface EstimatesListParams {
  status?: string;
  contact_id?: number;
  limit?: number;
  offset?: number;
}

export const estimatesApi = {
  async list(params: EstimatesListParams = {}): Promise<{ data: Estimate[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.contact_id) searchParams.set('contact_id', String(params.contact_id));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/estimates${query ? `?${query}` : ''}`) as { data: Estimate[]; meta: any };
    return response;
  },

  async get(id: number): Promise<Estimate> {
    const response = await api.get(`/estimates/${id}`) as { data: Estimate };
    return response.data;
  },

  async create(data: {
    company_id?: number;
    contact_id?: number;
    estimate_number?: string;
    title?: string;
    issue_date?: string;
    expiry_date?: string;
    status?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    tax_rate?: number;
    currency?: string;
    notes?: string;
    terms?: string;
    footer?: string;
    assigned_to?: number;
    items?: Array<{
      product_id?: number;
      service_id?: number;
      name: string;
      description?: string;
      quantity?: number;
      unit_price: number;
      discount_type?: 'percentage' | 'fixed';
      discount_value?: number;
      tax_rate?: number;
    }>;
  }): Promise<{ id: number; estimate_number: string }> {
    const response = await api.post('/estimates', data) as { data: any };
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Estimate, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>> & {
    items?: Array<{
      product_id?: number;
      service_id?: number;
      name: string;
      description?: string;
      quantity?: number;
      unit_price: number;
      discount_type?: 'percentage' | 'fixed';
      discount_value?: number;
      tax_rate?: number;
    }>;
  }): Promise<void> {
    await api.put(`/estimates/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/estimates/${id}`);
  },

  async send(id: number): Promise<void> {
    await api.post(`/estimates/${id}/send`, {});
  },

  async accept(id: number, data: { accepted_by?: string; signature_url?: string } = {}): Promise<void> {
    await api.post(`/estimates/${id}/accept`, data);
  },

  async decline(id: number): Promise<void> {
    await api.post(`/estimates/${id}/decline`, {});
  },

  async convertToInvoice(id: number): Promise<{ invoice_id: number; invoice_number: string }> {
    const response = await api.post(`/estimates/${id}/convert`, {}) as { data: any };
    return response.data;
  },

  async duplicate(id: number): Promise<{ id: number; estimate_number: string }> {
    const response = await api.post(`/estimates/${id}/duplicate`, {}) as { data: any };
    return response.data;
  },
};

export default estimatesApi;
