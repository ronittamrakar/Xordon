/**
 * Time Tracking API Service
 * Employee time tracking, timesheets, and attendance
 */

import { api } from '@/lib/api';

export interface TimeEntry {
  id: number;
  workspace_id: number;
  user_id: number;
  job_id: number | null;
  project_id: number | null;
  task_description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  is_billable: boolean;
  hourly_rate: number | null;
  total_amount: number | null;
  status: 'running' | 'paused' | 'completed' | 'approved' | 'rejected';
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  user_name?: string;
  job_title?: string;
}

export interface Timesheet {
  id: number;
  workspace_id: number;
  user_id: number;
  period_start: string;
  period_end: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  break_hours: number;
  billable_hours: number;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submitted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  employee_notes: string | null;
  manager_notes: string | null;
  created_at: string;
  user_name?: string;
}

export interface ClockRecord {
  id: number;
  workspace_id: number;
  user_id: number;
  clock_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  clock_time: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  device_type: string | null;
  ip_address: string | null;
  photo_url: string | null;
  notes: string | null;
}

export interface LeaveRequest {
  id: number;
  workspace_id: number;
  user_id: number;
  leave_type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'military' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  is_half_day: boolean;
  half_day_type: 'morning' | 'afternoon' | null;
  total_hours: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reason: string | null;
  manager_notes: string | null;
  created_at: string;
  user_name?: string;
}

export interface LeaveBalance {
  vacation_balance: number;
  vacation_used: number;
  vacation_accrued: number;
  sick_balance: number;
  sick_used: number;
  sick_accrued: number;
  personal_balance: number;
  personal_used: number;
  carryover_hours: number;
}

export interface TimeTrackingAnalytics {
  time: {
    total_entries: number;
    total_minutes: number;
    billable_minutes: number;
    total_amount: number;
  };
  by_user: Array<{ name: string; minutes: number; amount: number }>;
  leave: Array<{ leave_type: string; count: number; total_hours: number }>;
  period: { from: string; to: string };
}

export const timeTrackingApi = {
  // ==================== TIME ENTRIES ====================

  async getTimeEntries(params: {
    user_id?: number;
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: TimeEntry[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.status) searchParams.set('status', params.status);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/time-entries${query ? `?${query}` : ''}`) as { data: TimeEntry[]; meta: any };
    return response;
  },

  async startTimer(data: {
    job_id?: number;
    project_id?: number;
    task_description?: string;
    is_billable?: boolean;
    hourly_rate?: number;
    latitude?: number;
    longitude?: number;
    notes?: string;
  } = {}): Promise<{ id: number }> {
    const response = await api.post('/time-entries/start', data) as { data: { id: number } };
    return response.data;
  },

  async stopTimer(id: number, data: { latitude?: number; longitude?: number } = {}): Promise<{ duration_minutes: number; total_amount: number | null }> {
    const response = await api.post(`/time-entries/${id}/stop`, data) as { data: any };
    return response.data;
  },

  async createManualEntry(data: {
    user_id?: number;
    job_id?: number;
    project_id?: number;
    task_description?: string;
    start_time: string;
    end_time: string;
    break_minutes?: number;
    is_billable?: boolean;
    hourly_rate?: number;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/time-entries', data) as { data: { id: number } };
    return response.data;
  },

  async approveEntry(id: number, data: { action: 'approve' | 'reject'; reason?: string } = { action: 'approve' }): Promise<void> {
    await api.post(`/time-entries/${id}/approve`, data);
  },

  // ==================== CLOCK IN/OUT ====================

  async clockIn(data: {
    latitude?: number;
    longitude?: number;
    location_name?: string;
    device_type?: string;
    photo_url?: string;
    notes?: string;
  } = {}): Promise<{ id: number; clock_time: string }> {
    const response = await api.post('/clock/in', data) as { data: any };
    return response.data;
  },

  async clockOut(data: {
    latitude?: number;
    longitude?: number;
    location_name?: string;
    device_type?: string;
    notes?: string;
  } = {}): Promise<{ id: number; clock_time: string }> {
    const response = await api.post('/clock/out', data) as { data: any };
    return response.data;
  },

  async getClockStatus(): Promise<{
    is_clocked_in: boolean;
    last_record: ClockRecord | null;
    today_records: ClockRecord[];
  }> {
    const response = await api.get('/clock/status') as { data: any };
    return response.data;
  },

  // ==================== TIMESHEETS ====================

  async getTimesheets(params: { user_id?: number; status?: string } = {}): Promise<Timesheet[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    const response = await api.get(`/timesheets${query ? `?${query}` : ''}`) as { data: Timesheet[] };
    return response.data;
  },

  async submitTimesheet(id: number): Promise<void> {
    await api.post(`/timesheets/${id}/submit`, {});
  },

  async approveTimesheet(id: number, data: { action: 'approve' | 'reject'; reason?: string; notes?: string } = { action: 'approve' }): Promise<void> {
    await api.post(`/timesheets/${id}/approve`, data);
  },

  // ==================== LEAVE REQUESTS ====================

  async getLeaveRequests(params: { user_id?: number; status?: string } = {}): Promise<LeaveRequest[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    const response = await api.get(`/leave-requests${query ? `?${query}` : ''}`) as { data: LeaveRequest[] };
    return response.data;
  },

  async createLeaveRequest(data: {
    leave_type: LeaveRequest['leave_type'];
    start_date: string;
    end_date: string;
    is_half_day?: boolean;
    half_day_type?: 'morning' | 'afternoon';
    reason?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/leave-requests', data) as { data: { id: number } };
    return response.data;
  },

  async approveLeaveRequest(id: number, data: { action: 'approve' | 'reject'; reason?: string; notes?: string } = { action: 'approve' }): Promise<void> {
    await api.post(`/leave-requests/${id}/approve`, data);
  },

  async rejectLeaveRequest(id: number, reason: string): Promise<void> {
    await api.post(`/leave-requests/${id}/approve`, { action: 'reject', reason });
  },

  async getLeaveBalance(params: { user_id?: number; year?: number } = {}): Promise<LeaveBalance> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.year) searchParams.set('year', String(params.year));
    const query = searchParams.toString();
    const response = await api.get(`/leave-balances${query ? `?${query}` : ''}`) as { data: LeaveBalance };
    return response.data;
  },

  async getLeaveBalances(params: { user_id?: number; year?: number } = {}): Promise<LeaveBalance> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.year) searchParams.set('year', String(params.year));
    const query = searchParams.toString();
    const response = await api.get(`/leave-balances${query ? `?${query}` : ''}`) as { data: LeaveBalance };
    return response.data;
  },

  async processAccruals(params: { user_ids?: number[]; year?: number; dry_run?: boolean } = {}): Promise<{ success: boolean; message: string; details?: any }> {
    const response = await api.post('/leave-accruals/process', params) as { data: { success: boolean; message: string; details?: any } };
    return response.data;
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<TimeTrackingAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/time-tracking/analytics${query ? `?${query}` : ''}`) as { data: TimeTrackingAnalytics };
    return response.data;
  },
};

export default timeTrackingApi;
