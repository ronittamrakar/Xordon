/**
 * Expenses & Commission API Service
 * Employee expenses, reimbursements, and commission tracking
 */

import { api } from '@/lib/api';

export interface ExpenseCategory {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  requires_receipt: boolean;
  max_amount: number | null;
  color?: string | null;
  requires_approval: boolean;
  gl_code: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Expense {
  id: number;
  workspace_id: number;
  user_id: number;
  expense_report_id: number | null;
  category_id: number | null;
  category_name: string | null;
  description: string;
  merchant: string | null;
  expense_date: string;
  amount: number;
  currency: string;
  receipt_url: string | null;
  receipt_file_id: number | null;
  job_id: number | null;
  contact_id: number | null;
  is_mileage: boolean;
  miles: number | null;
  mileage_rate: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  is_billable: boolean;
  billed_to_contact_id: number | null;
  invoice_id: number | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
}

export interface ExpenseReport {
  id: number;
  workspace_id: number;
  user_id: number;
  report_number: string;
  title: string;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  total_amount: number;
  approved_amount: number;
  reimbursed_amount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'reimbursed' | 'partially_reimbursed';
  submitted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  reimbursed_at: string | null;
  reimbursement_method: string | null;
  reimbursement_reference: string | null;
  created_at: string;
  user_name?: string;
  expense_count?: number;
  expenses?: Expense[];
}

export interface CommissionPlan {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  plan_type: 'percentage' | 'tiered' | 'flat' | 'custom';
  base_rate: number | null;
  tiers: Array<{ min: number; max: number | null; rate: number }> | null;
  flat_amount: number | null;
  applies_to: 'revenue' | 'profit' | 'deals_closed' | 'appointments' | 'custom';
  calculation_period: 'per_transaction' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  minimum_threshold: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Commission {
  id: number;
  workspace_id: number;
  user_id: number;
  commission_plan_id: number | null;
  period_start: string;
  period_end: string;
  source_type: string | null;
  source_id: number | null;
  source_description: string | null;
  base_amount: number;
  commission_rate: number | null;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_by: number | null;
  approved_at: string | null;
  paid_at: string | null;
  payroll_id: number | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
  plan_name?: string;
}

export interface ExpensesAnalytics {
  expenses: {
    total_expenses: number;
    total_amount: number;
    approved_amount: number;
    reimbursed_amount: number;
  };
  by_category: Array<{ name: string; amount: number; count: number }>;
  by_user?: Array<{ name: string; amount: number; count: number }>;
  commissions: {
    total_commissions: number;
    total_amount: number;
    paid_amount: number;
  };
  period: { from: string; to: string };
}

export const expensesApi = {
  // ==================== EXPENSE CATEGORIES ====================

  async getExpenseCategories(): Promise<{ data: ExpenseCategory[] }> {
    const response = await api.get('/expense-categories') as { data: ExpenseCategory[] };
    return { data: response.data };
  },

  async getCategories(): Promise<ExpenseCategory[]> {
    const response = await api.get('/expense-categories') as { data: ExpenseCategory[] };
    return response.data;
  },

  async createExpenseCategory(data: {
    name: string;
    description?: string;
    requires_receipt?: boolean;
    max_amount?: number | null;
    color?: string;
    requires_approval?: boolean;
    gl_code?: string;
    sort_order?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/expense-categories', data) as { data: { id: number } };
    return response.data;
  },

  async createCategory(data: {
    name: string;
    description?: string;
    requires_receipt?: boolean;
    max_amount?: number;
    requires_approval?: boolean;
    gl_code?: string;
    sort_order?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/expense-categories', data) as { data: { id: number } };
    return response.data;
  },

  async updateExpenseCategory(id: number, data: Partial<ExpenseCategory>): Promise<void> {
    await api.put(`/expense-categories/${id}`, data);
  },

  async deleteExpenseCategory(id: number): Promise<void> {
    await api.delete(`/expense-categories/${id}`);
  },

  // ==================== EXPENSES ====================

  async getExpenses(params: {
    user_id?: number;
    status?: string;
    report_id?: number;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: Expense[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.status) searchParams.set('status', params.status);
    if (params.report_id) searchParams.set('report_id', String(params.report_id));
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/expenses${query ? `?${query}` : ''}`) as { data: Expense[]; meta: any };
    return response;
  },

  async createExpense(data: {
    expense_report_id?: number;
    category_id?: number;
    category_name?: string;
    description: string;
    merchant?: string;
    expense_date: string;
    amount: number;
    currency?: string;
    receipt_url?: string;
    receipt_file_id?: number;
    job_id?: number;
    contact_id?: number;
    is_mileage?: boolean;
    miles?: number;
    mileage_rate?: number;
    is_billable?: boolean;
    billed_to_contact_id?: number;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/expenses', data) as { data: { id: number } };
    return response.data;
  },

  async approveExpense(id: number, data: { action: 'approve' | 'reject'; reason?: string } = { action: 'approve' }): Promise<void> {
    await api.post(`/expenses/${id}/approve`, data);
  },

  async getExpense(id: number): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`) as { data: Expense };
    return response.data;
  },

  async updateExpense(id: number, data: Partial<any>): Promise<void> {
    await api.put(`/expenses/${id}`, data);
  },

  async deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  // ==================== EXPENSE REPORTS ====================

  async getExpenseReports(params: { user_id?: number; status?: string } = {}): Promise<ExpenseReport[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    const response = await api.get(`/expense-reports${query ? `?${query}` : ''}`) as { data: ExpenseReport[] };
    return response.data;
  },

  async getExpenseReport(id: number): Promise<ExpenseReport> {
    const response = await api.get(`/expense-reports/${id}`) as { data: ExpenseReport };
    return response.data;
  },

  async createExpenseReport(data: {
    title: string;
    description?: string;
    period_start?: string;
    period_end?: string;
    currency?: string;
    expense_ids?: number[];
  }): Promise<{ id: number; report_number: string }> {
    const response = await api.post('/expense-reports', data) as { data: any };
    return response.data;
  },

  async submitExpenseReport(id: number): Promise<void> {
    await api.post(`/expense-reports/${id}/submit`, {});
  },

  async approveExpenseReport(id: number, data: { action: 'approve' | 'reject'; reason?: string } = { action: 'approve' }): Promise<void> {
    await api.post(`/expense-reports/${id}/approve`, data);
  },

  // ==================== COMMISSION PLANS ====================

  async getCommissionPlans(): Promise<CommissionPlan[]> {
    const response = await api.get('/commission-plans') as { data: CommissionPlan[] };
    return response.data;
  },

  async createCommissionPlan(data: {
    name: string;
    description?: string;
    plan_type?: CommissionPlan['plan_type'];
    base_rate?: number;
    tiers?: Array<{ min: number; max: number | null; rate: number }>;
    flat_amount?: number;
    applies_to?: CommissionPlan['applies_to'];
    calculation_period?: CommissionPlan['calculation_period'];
    minimum_threshold?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/commission-plans', data) as { data: { id: number } };
    return response.data;
  },

  async updateCommissionPlan(id: number, data: Partial<CommissionPlan>): Promise<void> {
    await api.put(`/commission-plans/${id}`, data);
  },

  async deleteCommissionPlan(id: number): Promise<void> {
    await api.delete(`/commission-plans/${id}`);
  },

  // ==================== COMMISSIONS ====================

  async getCommissions(params: { user_id?: number; status?: string } = {}): Promise<Commission[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    const response = await api.get(`/commissions${query ? `?${query}` : ''}`) as { data: Commission[] };
    return response.data;
  },

  async createCommission(data: {
    user_id: number;
    commission_plan_id?: number;
    period_start?: string;
    period_end?: string;
    source_type?: string;
    source_id?: number;
    source_description?: string;
    base_amount: number;
    commission_rate?: number;
    commission_amount: number;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/commissions', data) as { data: { id: number } };
    return response.data;
  },

  async approveCommission(id: number): Promise<void> {
    await api.post(`/commissions/${id}/approve`, {});
  },

  async calculateCommission(data: { plan_id: number; base_amount: number }): Promise<{
    base_amount: number;
    commission_amount: number;
    commission_rate: number;
    plan_type: string;
  }> {
    const response = await api.post('/commissions/calculate', data) as { data: any };
    return response.data;
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<ExpensesAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/expenses/analytics${query ? `?${query}` : ''}`) as { data: ExpensesAnalytics };
    return response.data;
  },

  async getChartData(params: {
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
  } = {}): Promise<Array<{ date: string; amount: number }>> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.groupBy) searchParams.set('groupBy', params.groupBy);
    const query = searchParams.toString();
    const response = await api.get(`/expenses/chart-data${query ? `?${query}` : ''}`) as { data: Array<{ date: string; amount: number }> };
    return response.data;
  },
};

export default expensesApi;
