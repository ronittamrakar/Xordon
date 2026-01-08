import api from '@/lib/api';

export interface Calendar {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  slug?: string;
  owner_type: 'user' | 'staff' | 'team' | 'location';
  owner_id?: number;
  timezone: string;
  location_id?: number;
  min_notice_hours: number;
  max_advance_days: number;
  slot_interval_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  availability_mode: 'custom' | 'staff_based' | 'always';
  color: string;
  is_public: boolean;
  is_active: boolean;
  google_calendar_id?: string;
  outlook_calendar_id?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  staff_count?: number;
  services_count?: number;
  appointment_count?: number;
  availability?: CalendarAvailability[];
  staff?: any[];
  services?: any[];
  blocks?: CalendarBlock[];
}

export interface CalendarAvailability {
  id: number;
  calendar_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface CalendarBlock {
  id: number;
  calendar_id: number;
  title?: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  block_type: 'busy' | 'tentative' | 'out_of_office' | 'external';
  source: 'manual' | 'google' | 'outlook' | 'ical';
}

export interface CalendarSlot {
  start: string;
  end: string;
  calendar_id: number;
}

export const calendarsApi = {
  list: async (includeInactive = false) => {
    const params = includeInactive ? '?include_inactive=true' : '';
    const response = await api.get(`/calendars${params}`);
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/calendars/${id}`);
    return response.data;
  },

  create: async (data: Partial<Calendar>) => {
    const response = await api.post('/calendars', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Calendar>) => {
    const response = await api.put(`/calendars/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/calendars/${id}`);
    return response.data;
  },

  getAvailability: async (id: number) => {
    const response = await api.get(`/calendars/${id}/availability`);
    return response.data;
  },

  setAvailability: async (id: number, availability: Partial<CalendarAvailability>[]) => {
    const response = await api.post(`/calendars/${id}/availability`, { availability });
    return response.data;
  },

  getSlots: async (id: number, date: string, serviceId?: number, staffId?: number) => {
    const params = new URLSearchParams({ date });
    if (serviceId) params.append('service_id', String(serviceId));
    if (staffId) params.append('staff_id', String(staffId));
    const response = await api.get(`/calendars/${id}/slots?${params}`);
    return response.data;
  },

  addBlock: async (id: number, block: Partial<CalendarBlock>) => {
    const response = await api.post(`/calendars/${id}/blocks`, block);
    return response.data;
  },

  removeBlock: async (calendarId: number, blockId: number) => {
    const response = await api.delete(`/calendars/${calendarId}/blocks/${blockId}`);
    return response.data;
  },

  // Calendar Sync
  connectGoogle: async (calendarId: number) => {
    const response = await api.post('/calendar/google/connect', { calendar_id: calendarId });
    return response.data;
  },

  connectOutlook: async (calendarId: number) => {
    const response = await api.post('/calendar/outlook/connect', { calendar_id: calendarId });
    return response.data;
  },

  syncNow: async (id: number) => {
    const response = await api.post(`/calendars/${id}/sync`);
    return response.data;
  },

  disconnect: async (id: number, provider: 'google' | 'outlook') => {
    const response = await api.post(`/calendars/${id}/disconnect/${provider}`);
    return response.data;
  },
};

export default calendarsApi;
