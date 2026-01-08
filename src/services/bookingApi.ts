import api from '@/lib/api';

export interface Service {
  id: number;
  workspace_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'starting_at' | 'free' | 'custom';
  currency: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  max_bookings_per_slot: number;
  requires_confirmation: boolean;
  allow_online_booking: boolean;
  color: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  category_name?: string;
  staff_count?: number;
  staff?: StaffMember[];
}

export interface ServiceCategory {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  service_count?: number;
}

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
  services_count?: number;
  upcoming_appointments?: number;
  availability?: StaffAvailability[];
  services?: Service[];
  time_off?: TimeOff[];
}

export interface StaffAvailability {
  id: number;
  staff_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface TimeOff {
  id: number;
  staff_id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  reason: string | null;
}

export interface TimeSlot {
  start: string;
  end: string;
  staff_id: number;
  staff_name: string;
}

export interface BookingSlotResponse {
  date: string;
  service: {
    id: number;
    name: string;
    duration_minutes: number;
    price: number | null;
  };
  mode: 'per_staff' | 'round_robin';
  slots: TimeSlot[];
}

export interface BookingRequest {
  workspace_id: number;
  service_id: number;
  staff_id?: number;
  start_time: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
  booking_page_id?: number;
  answers?: any;
}

export interface BookingResponse {
  appointment_id: number;
  status: string;
  service: string;
  start_time: string;
  end_time: string;
}

export interface PublicBookingPage {
  workspace_id: number;
  company: {
    name: string;
    logo: string | null;
  };
  settings: {
    page_title: string;
    page_description: string | null;
    primary_color: string;
    min_notice_hours: number;
    max_advance_days: number;
    cancellation_policy: string | null;
  };
  services: Service[];
  staff: StaffMember[];
}

// Services API
export const servicesApi = {
  list: (params?: { include_inactive?: boolean; category_id?: number }) =>
    api.get<{ data: Service[] }>('/services', { params }).then(r => r.data.data),

  get: (id: number) =>
    api.get<{ data: Service }>(`/services/${id}`).then(r => r.data.data),

  create: (data: Partial<Service> & { staff_ids?: number[] }) =>
    api.post<{ data: Service }>('/services', data).then(r => r.data.data),

  update: (id: number, data: Partial<Service> & { staff_ids?: number[] }) =>
    api.put<{ data: Service }>(`/services/${id}`, data).then(r => r.data.data),

  delete: (id: number) =>
    api.delete(`/services/${id}`),

  // Categories
  getCategories: () =>
    api.get<{ data: ServiceCategory[] }>('/services/categories').then(r => r.data.data),

  createCategory: (data: Partial<ServiceCategory>) =>
    api.post<{ data: { id: number } }>('/services/categories', data).then(r => r.data.data),
};

// Staff Members API
export const staffApi = {
  list: (params?: { include_inactive?: boolean; accepts_bookings?: boolean }) =>
    api.get<{ data: StaffMember[] }>('/staff-members', { params }).then(r => r.data.data),

  get: (id: number) =>
    api.get<{ data: StaffMember }>(`/staff-members/${id}`).then(r => r.data.data),

  create: (data: Partial<StaffMember> & { availability?: StaffAvailability[]; service_ids?: number[] }) =>
    api.post<{ data: StaffMember }>('/staff-members', data).then(r => r.data.data),

  update: (id: number, data: Partial<StaffMember> & { availability?: StaffAvailability[]; service_ids?: number[] }) =>
    api.put<{ data: StaffMember }>(`/staff-members/${id}`, data).then(r => r.data.data),

  delete: (id: number) =>
    api.delete(`/staff-members/${id}`),

  getAvailability: (id: number, date: string) =>
    api.get<{ data: { date: string; day_of_week: number; regular_hours: StaffAvailability[]; time_off: TimeOff[]; appointments: { start_time: string; end_time: string }[]; is_available: boolean } }>(`/staff-members/${id}/availability`, { params: { date } }).then(r => r.data.data),

  addTimeOff: (id: number, data: { title?: string; start_datetime: string; end_datetime: string; is_all_day?: boolean; reason?: string }) =>
    api.post<{ data: { id: number } }>(`/staff-members/${id}/time-off`, data).then(r => r.data.data),

  removeTimeOff: (staffId: number, timeOffId: number) =>
    api.delete(`/staff-members/${staffId}/time-off/${timeOffId}`),
};

// Booking API
export const bookingApi = {
  getSlots: (params: {
    service_id: number;
    date: string;
    staff_id?: number;
    mode?: 'per_staff' | 'round_robin';
    workspace_id?: number;
    buffer_before?: number;
    buffer_after?: number;
    min_notice_hours?: number;
    max_advance_days?: number;
  }) =>
    api.get<{ data: BookingSlotResponse }>('/booking/slots', { params }).then(r => r.data.data),

  createBooking: (data: BookingRequest) =>
    api.post<{ success: boolean; data: BookingResponse }>('/booking', data).then(r => r.data),

  cancelBooking: (id: number, reason?: string) =>
    api.post(`/booking/${id}/cancel`, { reason }),

  rescheduleBooking: (id: number, data: { start_time: string; staff_id?: number }) =>
    api.post(`/booking/${id}/reschedule`, data),

  // Public booking page (no auth)
  getPublicBookingPage: (companySlug: string) =>
    api.get<{ data: PublicBookingPage }>(`/public/booking/${companySlug}`).then(r => r.data.data),
};

export default {
  services: servicesApi,
  staff: staffApi,
  booking: bookingApi,
};
