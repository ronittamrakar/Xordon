/**
 * Payments API Service
 * Stripe payments, payment links, and subscriptions
 */

import { api } from '@/lib/api';

export interface Payment {
  id: number;
  workspace_id: number;
  contact_id: number | null;
  invoice_id: number | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  fee_amount: number | null;
  net_amount: number | null;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
  failure_reason: string | null;
  payment_method_type: string | null;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  receipt_url: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  refunds?: Refund[];
}

export interface Refund {
  id: number;
  payment_id: number;
  stripe_refund_id: string | null;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  reason: string | null;
  notes: string | null;
  processed_by: number | null;
  created_at: string;
}

export interface PaymentLink {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  amount: number | null;
  currency: string;
  allow_custom_amount: boolean;
  min_amount: number | null;
  max_amount: number | null;
  product_id: number | null;
  service_id: number | null;
  url_slug: string;
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  success_url: string | null;
  cancel_url: string | null;
  created_at: string;
}

export interface Subscription {
  id: number;
  workspace_id: number;
  contact_id: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_name: string | null;
  plan_amount: number;
  currency: string;
  billing_interval: 'day' | 'week' | 'month' | 'year';
  billing_interval_count: number;
  status: 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'incomplete' | 'trialing' | 'paused';
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
}

export interface PaymentAnalytics {
  summary: {
    total_payments: number;
    successful_payments: number;
    total_revenue: number;
    refunded_count: number;
    avg_payment: number;
  };
  daily_trend: Array<{ date: string; count: number; revenue: number }>;
  by_status: Array<{ status: string; count: number; total: number }>;
  period: { from: string; to: string };
}

export const paymentsApi = {
  // ==================== ACCOUNT ====================

  async getAccountStatus(): Promise<{
    connected: boolean;
    status?: string;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    default_currency?: string;
    connected_at?: string;
  }> {
    const response = await api.get('/stripe/account') as { data: any };
    return response.data;
  },

  // ==================== PAYMENTS ====================

  async listPayments(params: {
    status?: string;
    contact_id?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Payment[]; meta: { total: number; total_amount: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.contact_id) searchParams.set('contact_id', String(params.contact_id));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/payments${query ? `?${query}` : ''}`) as { data: Payment[]; meta: any };
    return response;
  },

  async getPayment(id: number): Promise<Payment> {
    const response = await api.get(`/payments/${id}`) as { data: Payment };
    return response.data;
  },

  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    contact_id?: number;
    invoice_id?: number;
    customer_id?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ payment_id: number; client_secret: string; payment_intent_id: string }> {
    const response = await api.post('/payments/intent', data) as { data: any };
    return response.data;
  },

  async refund(paymentId: number, data: {
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
    notes?: string;
  } = {}): Promise<{ refund_id: number; stripe_refund_id?: string }> {
    const response = await api.post(`/payments/${paymentId}/refund`, data) as { data: any };
    return response.data;
  },

  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<PaymentAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/payments/analytics${query ? `?${query}` : ''}`) as { data: PaymentAnalytics };
    return response.data;
  },

  // ==================== PAYMENT LINKS ====================

  async listPaymentLinks(): Promise<PaymentLink[]> {
    const response = await api.get('/payment-links') as { data: PaymentLink[] };
    return response.data;
  },

  async createPaymentLink(data: {
    name: string;
    description?: string;
    amount?: number;
    currency?: string;
    allow_custom_amount?: boolean;
    min_amount?: number;
    max_amount?: number;
    product_id?: number;
    service_id?: number;
    url_slug?: string;
    expires_at?: string;
    max_uses?: number;
    success_url?: string;
    cancel_url?: string;
  }): Promise<{ id: number; url_slug: string; url: string }> {
    const response = await api.post('/payment-links', data) as { data: any };
    return response.data;
  },

  async updatePaymentLink(id: number, data: Partial<Pick<PaymentLink, 
    'name' | 'description' | 'amount' | 'currency' | 'allow_custom_amount' | 
    'min_amount' | 'max_amount' | 'is_active' | 'expires_at' | 'max_uses' | 
    'success_url' | 'cancel_url'
  >>): Promise<void> {
    await api.put(`/payment-links/${id}`, data);
  },

  async deletePaymentLink(id: number): Promise<void> {
    await api.delete(`/payment-links/${id}`);
  },

  // ==================== SUBSCRIPTIONS ====================

  async listSubscriptions(): Promise<Subscription[]> {
    const response = await api.get('/subscriptions') as { data: Subscription[] };
    return response.data;
  },

  async cancelSubscription(id: number, cancelAtPeriodEnd: boolean = true): Promise<void> {
    await api.post(`/subscriptions/${id}/cancel`, { cancel_at_period_end: cancelAtPeriodEnd });
  },
};

export default paymentsApi;
