import { api } from '@/lib/api';

export interface BookingType {
  id: number;
  workspace_id: number;
  company_id: number | null;
  user_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  color: string;
  location_type: 'in_person' | 'phone' | 'video' | 'custom';
  location_details: string | null;
  price: number;
  currency: string;
  requires_payment: boolean;
  is_active: boolean;
  is_public: boolean;
  max_bookings_per_day: number | null;
  min_notice_hours: number;
  max_future_days: number;
  confirmation_message: string | null;
  reminder_enabled: boolean;
  reminder_hours_before: number;
  questions: BookingQuestion[];
  created_at: string;
  updated_at: string;
  user_name?: string;
  upcoming_count?: number;
}

export interface BookingQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface Appointment {
  id: number;
  workspace_id: number;
  company_id: number | null;
  booking_type_id: number;
  contact_id: number | null;
  assigned_user_id: number | null;
  title: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  location_type: 'in_person' | 'phone' | 'video' | 'custom';
  location_details: string | null;
  meeting_url: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  answers: Record<string, unknown>[];
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: 'guest' | 'host' | 'system' | null;
  created_at: string;
  updated_at: string;
  booking_type_name?: string;
  booking_type_color?: string;
  assigned_user_name?: string;
  contact_first_name?: string;
  contact_last_name?: string;
}

export interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  no_show: number;
  today: number;
}

export const appointmentsApi = {
  // ==================== BOOKING TYPES ====================
  
  async listBookingTypes(): Promise<BookingType[]> {
    const response = await api.get('/booking-types') as { data: BookingType[] };
    return response.data;
  },

  async getBookingType(id: number): Promise<BookingType> {
    const response = await api.get(`/booking-types/${id}`) as { data: BookingType };
    return response.data;
  },

  async createBookingType(data: Partial<BookingType>): Promise<{ id: number; slug: string }> {
    const response = await api.post('/booking-types', data) as { data: { id: number; slug: string } };
    return response.data;
  },

  async updateBookingType(id: number, data: Partial<BookingType>): Promise<void> {
    await api.put(`/booking-types/${id}`, data);
  },

  async deleteBookingType(id: number): Promise<void> {
    await api.delete(`/booking-types/${id}`);
  },

  async getAvailableSlots(bookingTypeId: number, date?: string, days?: number): Promise<{ booking_type: BookingType; slots: Record<string, string[]> }> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (days) params.set('days', String(days));
    const query = params.toString();
    const response = await api.get(`/booking-types/${bookingTypeId}/slots${query ? `?${query}` : ''}`) as { data: { booking_type: BookingType; slots: Record<string, string[]> } };
    return response.data;
  },

  // ==================== AVAILABILITY ====================

  async getAvailability(userId?: number): Promise<AvailabilitySlot[]> {
    const query = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/availability${query}`) as { data: AvailabilitySlot[] };
    return response.data;
  },

  async setAvailability(schedule: AvailabilitySlot[], userId?: number): Promise<void> {
    await api.post('/availability', { schedule, user_id: userId });
  },

  // ==================== APPOINTMENTS ====================

  async listAppointments(params: {
    status?: string;
    start_date?: string;
    end_date?: string;
    assigned_to?: 'me' | string;
  } = {}): Promise<Appointment[]> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.start_date) searchParams.set('start_date', params.start_date);
    if (params.end_date) searchParams.set('end_date', params.end_date);
    if (params.assigned_to) searchParams.set('assigned_to', params.assigned_to);
    const query = searchParams.toString();
    const response = await api.get(`/appointments/v2${query ? `?${query}` : ''}`) as { data: Appointment[] };
    return response.data;
  },

  async bookAppointment(data: {
    booking_type_id: number;
    start_time: string;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    notes?: string;
    answers?: Record<string, unknown>;
    timezone?: string;
    contact_id?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/appointments/v2/book', data) as { data: { id: number } };
    return response.data;
  },

  async updateAppointmentStatus(id: number, status: string, cancellationReason?: string): Promise<void> {
    await api.post(`/appointments/v2/${id}/status`, { status, cancellation_reason: cancellationReason });
  },

  async getStats(): Promise<AppointmentStats> {
    const response = await api.get('/appointments/v2/stats') as { data: AppointmentStats };
    return response.data;
  },

  // ==================== PUBLIC BOOKING ====================

  async getPublicBookingPage(slug: string): Promise<BookingType> {
    const response = await api.get(`/book/${slug}`) as { data: BookingType };
    return response.data;
  },
};

export default appointmentsApi;
