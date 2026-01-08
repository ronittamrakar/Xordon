/**
 * Staff API Service
 * Manage staff members, availability, and services for scheduling
 */

import { api } from '@/lib/api';

export interface StaffMember {
  id: number;
  workspace_id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  color: string;
  accepts_bookings: boolean;
  booking_page_url: string | null;
  is_active: boolean;
  sort_order: number;
  service_count?: number;
  upcoming_appointments?: number;
  availability?: StaffAvailability[];
  services?: StaffService[];
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  id: number;
  staff_id: number;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface StaffTimeOff {
  id: number;
  staff_id: number;
  title: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  reason: string | null;
  created_at: string;
}

export interface StaffService {
  id: number;
  staff_id: number;
  service_id: number;
  custom_duration_minutes: number | null;
  custom_price: number | null;
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  color?: string;
}

export interface AvailableSlots {
  staff_id: number;
  service_id: number | null;
  duration_minutes: number;
  slots: Record<string, string[]>; // date -> array of time slots
}

export const staffApi = {
  // ==================== STAFF MEMBERS ====================

  /**
   * List staff members
   */
  async list(params: { include_inactive?: boolean } = {}): Promise<StaffMember[]> {
    const query = params.include_inactive ? '?include_inactive=true' : '';
    const response = await api.get(`/staff${query}`) as { data: StaffMember[] };
    return response.data;
  },

  /**
   * Get single staff member with details
   */
  async get(id: number): Promise<StaffMember> {
    const response = await api.get(`/staff/${id}`) as { data: StaffMember };
    return response.data;
  },

  /**
   * Create staff member
   */
  async create(data: {
    first_name: string;
    last_name: string;
    user_id?: number;
    email?: string;
    phone?: string;
    title?: string;
    bio?: string;
    avatar_url?: string;
    color?: string;
    accepts_bookings?: boolean;
    booking_page_url?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/staff', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update staff member
   */
  async update(id: number, data: Partial<Omit<StaffMember, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    await api.put(`/staff/${id}`, data);
  },

  /**
   * Delete staff member
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/staff/${id}`);
  },

  // ==================== AVAILABILITY ====================

  /**
   * Get staff availability
   */
  async getAvailability(staffId: number): Promise<StaffAvailability[]> {
    const response = await api.get(`/staff/${staffId}/availability`) as { data: StaffAvailability[] };
    return response.data;
  },

  /**
   * Set staff availability (replaces all)
   */
  async setAvailability(staffId: number, availability: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }>): Promise<void> {
    await api.post(`/staff/${staffId}/availability`, { availability });
  },

  // ==================== TIME OFF ====================

  /**
   * Get staff time off
   */
  async getTimeOff(staffId: number, params: { from?: string; to?: string } = {}): Promise<StaffTimeOff[]> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/staff/${staffId}/time-off${query ? `?${query}` : ''}`) as { data: StaffTimeOff[] };
    return response.data;
  },

  /**
   * Add time off
   */
  async addTimeOff(staffId: number, data: {
    title?: string;
    start_datetime: string;
    end_datetime: string;
    is_all_day?: boolean;
    reason?: string;
  }): Promise<{ id: number }> {
    const response = await api.post(`/staff/${staffId}/time-off`, data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Delete time off
   */
  async deleteTimeOff(staffId: number, timeOffId: number): Promise<void> {
    await api.delete(`/staff/${staffId}/time-off/${timeOffId}`);
  },

  // ==================== STAFF SERVICES ====================

  /**
   * Get services for a staff member
   */
  async getServices(staffId: number): Promise<StaffService[]> {
    const response = await api.get(`/staff/${staffId}/services`) as { data: StaffService[] };
    return response.data;
  },

  /**
   * Assign services to staff member
   */
  async setServices(staffId: number, data: {
    service_ids: number[];
    custom_durations?: Record<number, number>;
    custom_prices?: Record<number, number>;
  }): Promise<void> {
    await api.post(`/staff/${staffId}/services`, data);
  },

  // ==================== AVAILABLE SLOTS ====================

  /**
   * Get available booking slots for a staff member
   */
  async getAvailableSlots(staffId: number, params: {
    service_id?: number;
    date?: string;
    days?: number;
  } = {}): Promise<AvailableSlots> {
    const searchParams = new URLSearchParams();
    if (params.service_id) searchParams.set('service_id', String(params.service_id));
    if (params.date) searchParams.set('date', params.date);
    if (params.days) searchParams.set('days', String(params.days));
    const query = searchParams.toString();
    const response = await api.get(`/staff/${staffId}/available-slots${query ? `?${query}` : ''}`) as { data: AvailableSlots };
    return response.data;
  },
};

export default staffApi;
