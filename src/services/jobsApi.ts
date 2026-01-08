/**
 * Jobs API Service
 * Field service management - jobs, dispatch, and scheduling
 */

import { api } from '@/lib/api';

export interface JobType {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  color: string;
  default_duration_minutes: number;
  default_price: number | null;
  requires_signature: boolean;
  requires_photos: boolean;
  checklist_template: Array<{ title: string; description?: string; is_required?: boolean }> | null;
  is_active: boolean;
  sort_order: number;
  job_count?: number;
  created_at: string;
  updated_at: string;
}

export interface JobItem {
  id: number;
  job_id: number;
  product_id: number | null;
  service_id: number | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: number | null;
  sort_order: number;
}

export interface JobChecklist {
  id: number;
  job_id: number;
  title: string;
  description: string | null;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: number | null;
  notes: string | null;
  sort_order: number;
}

export interface JobPhoto {
  id: number;
  job_id: number;
  file_id: number | null;
  photo_type: 'before' | 'during' | 'after' | 'issue' | 'other';
  caption: string | null;
  url: string;
  thumbnail_url: string | null;
  taken_at: string | null;
  taken_by: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface JobNote {
  id: number;
  job_id: number;
  user_id: number | null;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface JobStatusHistory {
  id: number;
  job_id: number;
  old_status: string | null;
  new_status: string;
  changed_by: number | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Job {
  id: number;
  workspace_id: number;
  company_id: number | null;
  contact_id: number | null;
  job_number: string;
  job_type_id: number | null;
  title: string;
  description: string | null;
  location_type: 'customer' | 'business' | 'remote' | 'other';
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  location_notes: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number | null;
  assigned_to: number | null;
  team_members: number[] | null;
  status: 'pending' | 'scheduled' | 'dispatched' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_amount: number | null;
  actual_amount: number | null;
  currency: string;
  estimate_id: number | null;
  invoice_id: number | null;
  opportunity_id: number | null;
  completion_notes: string | null;
  customer_signature_url: string | null;
  signed_by: string | null;
  signed_at: string | null;
  is_recurring: boolean;
  recurring_schedule_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  job_type_name?: string;
  job_type_color?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  assigned_name?: string;
  items?: JobItem[];
  checklist?: JobChecklist[];
  photos?: JobPhoto[];
  notes?: JobNote[];
  status_history?: JobStatusHistory[];
}

export interface JobsListParams {
  status?: string;
  assigned_to?: number;
  contact_id?: number;
  job_type_id?: number;
  date?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface JobAnalytics {
  summary: {
    total_jobs: number;
    completed: number;
    cancelled: number;
    pending: number;
    total_revenue: number;
    avg_duration_minutes: number;
  };
  by_status: Array<{ status: string; count: number }>;
  by_type: Array<{ name: string; color: string; count: number; revenue: number }>;
  by_technician: Array<{ name: string; count: number; revenue: number }>;
  period: { from: string; to: string };
}

export const jobsApi = {
  // ==================== JOB TYPES ====================

  async getJobTypes(): Promise<JobType[]> {
    const response = await api.get('/job-types') as { data: JobType[] };
    return response.data;
  },

  async createJobType(data: {
    name: string;
    description?: string;
    color?: string;
    default_duration_minutes?: number;
    default_price?: number;
    requires_signature?: boolean;
    requires_photos?: boolean;
    checklist_template?: Array<{ title: string; description?: string; is_required?: boolean }>;
    sort_order?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/job-types', data) as { data: { id: number } };
    return response.data;
  },

  async updateJobType(id: number, data: Partial<Omit<JobType, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    await api.put(`/job-types/${id}`, data);
  },

  async deleteJobType(id: number): Promise<void> {
    await api.delete(`/job-types/${id}`);
  },

  // ==================== JOBS ====================

  async list(params: JobsListParams = {}): Promise<{ data: Job[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.assigned_to) searchParams.set('assigned_to', String(params.assigned_to));
    if (params.contact_id) searchParams.set('contact_id', String(params.contact_id));
    if (params.job_type_id) searchParams.set('job_type_id', String(params.job_type_id));
    if (params.date) searchParams.set('date', params.date);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/jobs${query ? `?${query}` : ''}`) as { data: Job[]; meta: any };
    return response;
  },

  async get(id: number): Promise<Job> {
    const response = await api.get(`/jobs/${id}`) as { data: Job };
    return response.data;
  },

  async create(data: {
    company_id?: number;
    contact_id?: number;
    job_type_id?: number;
    title: string;
    description?: string;
    location_type?: 'customer' | 'business' | 'remote' | 'other';
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    location_notes?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    duration_minutes?: number;
    assigned_to?: number;
    team_members?: number[];
    status?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    estimated_amount?: number;
    currency?: string;
    estimate_id?: number;
    opportunity_id?: number;
    items?: Array<{
      product_id?: number;
      service_id?: number;
      name: string;
      description?: string;
      quantity?: number;
      unit_price: number;
    }>;
  }): Promise<{ id: number; job_number: string }> {
    const response = await api.post('/jobs', data) as { data: any };
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Job, 'id' | 'workspace_id' | 'job_number' | 'created_at' | 'updated_at'>>): Promise<void> {
    await api.put(`/jobs/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/jobs/${id}`);
  },

  async updateStatus(id: number, data: {
    status: Job['status'];
    notes?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<void> {
    await api.post(`/jobs/${id}/status`, data);
  },

  // ==================== JOB ITEMS ====================

  async addItem(jobId: number, data: {
    product_id?: number;
    service_id?: number;
    name: string;
    description?: string;
    quantity?: number;
    unit_price: number;
    sort_order?: number;
  }): Promise<{ id: number }> {
    const response = await api.post(`/jobs/${jobId}/items`, data) as { data: { id: number } };
    return response.data;
  },

  // ==================== CHECKLIST ====================

  async updateChecklist(jobId: number, checklistId: number, data: {
    is_completed?: boolean;
    notes?: string;
  }): Promise<void> {
    await api.put(`/jobs/${jobId}/checklist/${checklistId}`, data);
  },

  // ==================== PHOTOS ====================

  async addPhoto(jobId: number, data: {
    file_id?: number;
    photo_type?: 'before' | 'during' | 'after' | 'issue' | 'other';
    caption?: string;
    url: string;
    thumbnail_url?: string;
    taken_at?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ id: number }> {
    const response = await api.post(`/jobs/${jobId}/photos`, data) as { data: { id: number } };
    return response.data;
  },

  // ==================== NOTES ====================

  async addNote(jobId: number, data: {
    content: string;
    is_internal?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post(`/jobs/${jobId}/notes`, data) as { data: { id: number } };
    return response.data;
  },

  // ==================== SIGNATURE ====================

  async addSignature(jobId: number, data: {
    signature_url: string;
    signed_by: string;
  }): Promise<void> {
    await api.post(`/jobs/${jobId}/signature`, data);
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<JobAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/jobs/analytics${query ? `?${query}` : ''}`) as { data: JobAnalytics };
    return response.data;
  },
};

export default jobsApi;
