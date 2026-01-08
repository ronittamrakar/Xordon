import { api } from '@/lib/api';

export interface Request {
  id: number;
  requestNumber: string;
  contactId: number;
  title: string;
  description?: string;
  status: 'new' | 'reviewing' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestType?: string;
  serviceDetails?: string;
  serviceAddress?: string;
  serviceCity?: string;
  serviceState?: string;
  serviceZip?: string;
  requestedDate?: string;
  scheduledDate?: string;
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  assignedTo?: number;
  estimatedCost?: number;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  internalNotes?: string;
  customerNotes?: string;
  images?: string[];
  onSiteAssessment?: boolean;
  assessmentNotes?: string;
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  assignedStaff?: {
    name: string;
  };
  items?: RequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  item_type: 'service' | 'product' | 'labor' | 'material' | 'fee';
}

export interface CreateRequestData {
  contact_id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  request_type?: string;
  service_details?: string;
  service_address?: string;
  service_city?: string;
  service_state?: string;
  service_zip?: string;
  requested_date?: string;
  scheduled_date?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  assigned_to?: number;
  estimated_cost?: number;
  subtotal?: number;
  tax_amount?: number;
  total?: number;
  internal_notes?: string;
  customer_notes?: string;
  images?: string[];
  on_site_assessment?: boolean;
  assessment_notes?: string;
  items?: RequestItem[];
}

export const requestsApi = {
  async getRequests(params?: {
    status?: string;
    priority?: string;
    assigned_to?: number;
    contact_id?: number;
  }) {
    const response = await api.get('/requests', { params });
    return response.data;
  },

  async getRequest(id: number) {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  async createRequest(data: CreateRequestData) {
    const response = await api.post('/requests', data);
    return response.data;
  },

  async updateRequest(id: number, data: Partial<CreateRequestData>) {
    const response = await api.put(`/requests/${id}`, data);
    return response.data;
  },

  async deleteRequest(id: number) {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
  },
};
