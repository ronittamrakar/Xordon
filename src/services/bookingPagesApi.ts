import api from '../lib/api';

export interface BookingPage {
  id: number;
  workspace_id: number;
  company_id: number | null;
  company_name?: string;
  slug: string;
  title: string;
  description: string | null;
  source: 'native' | 'calendly' | 'acuity';
  source_config: {
    embed_url?: string;
    widget_code?: string;
    api_token?: string;
  } | null;
  native_config: {
    service_ids?: number[];
    staff_mode?: 'per_staff' | 'round_robin';
    duration_override?: number;
    buffer_before?: number;
    buffer_after?: number;
    min_notice_hours?: number;
    max_advance_days?: number;
  } | null;
  form_schema: {
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      options?: string[];
    }>;
  } | null;
  branding: {
    logo_url?: string;
    primary_color?: string;
    hero_text?: string;
    success_message?: string;
    redirect_url?: string;
  } | null;
  payment_config: {
    requires_payment?: boolean;
    provider?: 'stripe' | 'paypal';
    amount_type?: 'fixed' | 'service_price';
    fixed_amount?: number;
    terms?: string;
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_bookings?: number;
  pending_leads?: number;
  services?: any[];
  staff?: any[];
  booking_settings?: any;
}

export interface BookingLead {
  id: number;
  workspace_id: number;
  company_id: number | null;
  booking_page_id: number;
  contact_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  form_data: any;
  external_source: string | null;
  external_booking_id: string | null;
  external_event_url: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  appointment_id: number | null;
  created_at: string;
  updated_at: string;
}

export const bookingPagesApi = {
  /**
   * List all booking pages
   */
  async list(params?: {
    company_id?: number;
    source?: 'native' | 'calendly' | 'acuity';
    active_only?: boolean;
  }): Promise<BookingPage[]> {
    try {
      const response = await api.get('/booking-pages', { params });
      return (response.data as any)?.data || [];
    } catch (err) {
      // If API returns an error (e.g., 400 while DB migrations are pending), fall back to empty list
      console.warn('bookingPagesApi.list failed', err);
      return [];
    }
  },

  /**
   * Get single booking page
   */
  async get(id: number): Promise<BookingPage> {
    const response = await api.get(`/booking-pages/${id}`);
    return (response.data as any)?.data;
  },

  /**
   * Create booking page
   */
  async create(data: Partial<BookingPage>): Promise<BookingPage> {
    const response = await api.post('/booking-pages', data);
    return (response.data as any)?.data;
  },

  /**
   * Update booking page
   */
  async update(id: number, data: Partial<BookingPage>): Promise<BookingPage> {
    const response = await api.put(`/booking-pages/${id}`, data);
    return (response.data as any)?.data;
  },

  /**
   * Delete booking page
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/booking-pages/${id}`);
  },

  /**
   * Get public booking page by slug (no auth)
   */
  async getPublicPage(slug: string): Promise<BookingPage> {
    const response = await api.get(`/public/book/${slug}`);
    return (response.data as any)?.data;
  },

  /**
   * Capture lead from external booking
   */
  async captureLead(slug: string, data: {
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    form_data?: any;
    external_booking_id?: string;
    external_event_url?: string;
  }): Promise<{ lead_id: number; contact_id: number }> {
    const response = await api.post(`/public/book/${slug}/lead`, data);
    return (response.data as any)?.data;
  },

  /**
   * Generate shareable URL for booking page
   */
  getPublicUrl(slug: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/book/${slug}`;
  },

  /**
   * Generate embed code for booking page
   */
  getEmbedCode(slug: string, options?: { width?: string; height?: string }): string {
    const url = this.getPublicUrl(slug);
    const width = options?.width || '100%';
    const height = options?.height || '600px';
    return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" style="border: none;"></iframe>`;
  },
};

export default bookingPagesApi;
