import api from '@/lib/api';

export interface Workflow {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config?: Record<string, any>;
  is_active: boolean;
  run_once_per_contact: boolean;
  total_enrolled: number;
  total_completed: number;
  total_failed: number;
  created_at: string;
  updated_at: string;
  step_count?: number;
  active_enrollments?: number;
  steps?: WorkflowStep[];
  stats?: {
    total_enrolled: number;
    active: number;
    completed: number;
    failed: number;
    exited: number;
  };
}

export interface WorkflowStep {
  id: number;
  workflow_id: number;
  step_type: 'action' | 'condition' | 'wait' | 'split' | 'goal';
  action_type?: string;
  config?: Record<string, any>;
  position_x: number;
  position_y: number;
  next_step_id?: number;
  true_step_id?: number;
  false_step_id?: number;
  temp_id?: string;
  next_step_temp_id?: string;
  true_step_temp_id?: string;
  false_step_temp_id?: string;
}

export interface WorkflowEnrollment {
  id: number;
  workflow_id: number;
  contact_id: number;
  current_step_id?: number;
  status: 'active' | 'completed' | 'failed' | 'paused' | 'exited';
  enrolled_at: string;
  completed_at?: string;
  exited_at?: string;
  exit_reason?: string;
  waiting_until?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface WorkflowOptions {
  trigger_types: Record<string, string>;
  action_types: Record<string, string>;
  condition_operators: Record<string, string>;
  wait_types: Record<string, string>;
  delay_units: Record<string, string>;
}

export const workflowsApi = {
  list: async (status?: 'active' | 'inactive') => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/workflows${params}`);
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  create: async (data: Partial<Workflow>) => {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Workflow>) => {
    const response = await api.put(`/workflows/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/workflows/${id}`);
    return response.data;
  },

  toggle: async (id: number) => {
    const response = await api.post(`/workflows/${id}/toggle`);
    return response.data;
  },

  enroll: async (id: number, contactId: number) => {
    const response = await api.post(`/workflows/${id}/enroll`, { contact_id: contactId });
    return response.data;
  },

  getEnrollments: async (id: number, status?: string, limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status) params.append('status', status);
    const response = await api.get(`/workflows/${id}/enrollments?${params}`);
    return response.data;
  },

  getExecutionLogs: async (workflowId: number, enrollmentId: number) => {
    const response = await api.get(`/workflows/${workflowId}/enrollments/${enrollmentId}/logs`);
    return response.data;
  },

  getOptions: async (): Promise<WorkflowOptions> => {
    const response = await api.get('/workflows/options');
    return response.data;
  },
};

export default workflowsApi;
