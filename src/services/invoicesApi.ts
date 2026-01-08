import { api } from '@/lib/api';

export interface Product {
  id: number;
  workspace_id: number;
  company_id: number | null;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  currency: string;
  unit: string;
  is_recurring: boolean;
  recurring_interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  recurring_interval_count?: number;
  trial_days?: number;
  setup_fee?: number;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  discount_percent?: number;
  discount_amount?: number;
  total?: number;
  product_name?: string;
}

export interface Invoice {
  id: number;
  workspace_id: number;
  company_id: number | null;
  contact_id: number | null;
  opportunity_id: number | null;
  invoice_number: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  payment_link: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: number;
  workspace_id: number;
  invoice_id: number | null;
  contact_id: number | null;
  amount: number;
  currency: string;
  payment_method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentLink {
  id: number;
  workspace_id: number;
  company_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  amount: number | null;
  currency: string;
  is_amount_fixed: boolean;
  is_active: boolean;
  usage_count: number;
  total_collected: number;
  created_at: string;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  outstanding: number;
  collected: number;
  overdue_amount: number;
}

export const invoicesApi = {
  // ==================== INVOICES ====================

  async listInvoices(params: { status?: string; contact_id?: number; limit?: number; offset?: number } = {}): Promise<{ data: Invoice[]; meta: { total: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.contact_id) searchParams.set('contact_id', String(params.contact_id));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/invoices${query ? `?${query}` : ''}`) as { data: Invoice[]; meta: { total: number } };
    return response;
  },

  async getInvoice(id: number): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`) as { data: Invoice };
    return response.data;
  },

  async createInvoice(data: {
    contact_id?: number;
    opportunity_id?: number;
    issue_date?: string;
    due_date?: string;
    items?: InvoiceItem[];
    notes?: string;
    terms?: string;
    currency?: string;
    discount_amount?: number;
  }): Promise<{ id: number; invoice_number: string; payment_link: string }> {
    const response = await api.post('/invoices', data) as { data: { id: number; invoice_number: string; payment_link: string } };
    return response.data;
  },

  async updateInvoice(id: number, data: {
    contact_id?: number;
    issue_date?: string;
    due_date?: string;
    items?: InvoiceItem[];
    notes?: string;
    terms?: string;
    currency?: string;
    discount_amount?: number;
  }): Promise<void> {
    await api.put(`/invoices/${id}`, data);
  },

  async updateInvoiceStatus(id: number, status: string): Promise<void> {
    await api.post(`/invoices/${id}/status`, { status });
  },

  async deleteInvoice(id: number): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  async recordPayment(invoiceId: number, data: {
    amount: number;
    payment_method?: string;
    transaction_id?: string;
    notes?: string;
  }): Promise<{ id: number; new_status: string }> {
    const response = await api.post(`/invoices/${invoiceId}/payments`, data) as { data: { id: number; new_status: string } };
    return response.data;
  },

  async getStats(): Promise<InvoiceStats> {
    const response = await api.get('/invoices/stats') as { data: InvoiceStats };
    return response.data;
  },

  // ==================== PRODUCTS ====================

  async listProducts(): Promise<Product[]> {
    const response = await api.get('/products') as { data: Product[] };
    return response.data;
  },

  async createProduct(data: Partial<Product>): Promise<{ id: number }> {
    const response = await api.post('/products', data) as { data: { id: number } };
    return response.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<void> {
    await api.put(`/products/${id}`, data);
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // ==================== PAYMENT LINKS ====================

  async listPaymentLinks(): Promise<PaymentLink[]> {
    const response = await api.get('/payment-links') as { data: PaymentLink[] };
    return response.data;
  },

  async createPaymentLink(data: Partial<PaymentLink>): Promise<{ id: number; slug: string }> {
    const response = await api.post('/payment-links', data) as { data: { id: number; slug: string } };
    return response.data;
  },
};

export default invoicesApi;
