/**
 * Employees API Service
 * Manage employee profiles, documents, and onboarding
 */

import { api } from '@/lib/api';

export interface EmployeeDocument {
  id: number;
  workspace_id: number;
  user_id: number;
  file_id: number;
  document_type: 'contract' | 'id_proof' | 'tax_form' | 'certification' | 'other';
  title: string;
  expiry_date: string | null;
  status: 'pending' | 'verified' | 'expired' | 'rejected';
  notes: string | null;
  file_path?: string;
  file_name?: string;
  user_name?: string;
  created_at: string;
}

export interface OnboardingTask {
  id: number;
  checklist_id: number;
  title: string;
  description: string | null;
  due_days_after_start: number;
  is_required: boolean;
  status?: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  completed_by_name?: string;
}

export interface OnboardingChecklist {
  id: number;
  name: string;
  description: string | null;
  tasks: OnboardingTask[];
}

export const employeesApi = {
  async getDocuments(userId?: number): Promise<EmployeeDocument[]> {
    const query = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/hr/documents${query}`) as { data: EmployeeDocument[] };
    return response.data;
  },

  async uploadDocument(data: Partial<EmployeeDocument>): Promise<{ id: number }> {
    const response = await api.post('/hr/documents', data) as { data: { id: number } };
    return response.data;
  },

  async getOnboardingChecklists(): Promise<OnboardingChecklist[]> {
    const response = await api.get('/hr/onboarding/checklists') as { data: OnboardingChecklist[] };
    return response.data;
  },

  async getEmployeeOnboarding(userId: number): Promise<any[]> {
    const response = await api.get(`/hr/onboarding/employee/${userId}`) as { data: any[] };
    return response.data;
  },

  async updateOnboardingTask(taskId: number, data: { status: string; notes?: string }): Promise<void> {
    await api.put(`/hr/onboarding/tasks/${taskId}`, data);
  },

  // ==================== PERFORMANCE ====================

  async getPerformanceReviews(userId?: number): Promise<any[]> {
    const query = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/hr/performance${query}`) as { data: any[] };
    return response.data;
  },

  async createPerformanceReview(data: any): Promise<{ id: number }> {
    const response = await api.post('/hr/performance', data) as { data: { id: number } };
    return response.data;
  },

  // ==================== ASSETS ====================

  async getAssets(userId?: number): Promise<any[]> {
    const query = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/hr/assets${query}`) as { data: any[] };
    return response.data;
  },

  async updateAsset(id: number, data: any): Promise<void> {
    await api.put(`/hr/assets/${id}`, data);
  },

  // ==================== DATA INTEGRATION ====================

  async getEmployeeTimeEntries(userId: number | string): Promise<{ entries: any[], summary: any }> {
    const response = await api.get(`/hr/employees/${userId}/time-entries`) as { data: { entries: any[], summary: any } };
    return response.data;
  },

  async getEmployeeShifts(userId: number | string): Promise<{ upcoming: any[], recent: any[] }> {
    const response = await api.get(`/hr/employees/${userId}/shifts`) as { data: { upcoming: any[], recent: any[] } };
    return response.data;
  },

  async getEmployeeLeaveSummary(userId: number | string): Promise<{ balances: any[], requests: any[] }> {
    const response = await api.get(`/hr/employees/${userId}/leave-summary`) as { data: { balances: any[], requests: any[] } };
    return response.data;
  },

  async getEmployeePayrollSummary(userId: number | string): Promise<{ compensation: any, recent_payroll: any[] }> {
    const response = await api.get(`/hr/employees/${userId}/payroll-summary`) as { data: { compensation: any, recent_payroll: any[] } };
    return response.data;
  }
};
