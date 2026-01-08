/**
 * Payroll API Service
 * Comprehensive payroll processing, pay periods, and employee compensation
 */

import { api } from '@/lib/api';

export interface PayPeriod {
  id: number;
  workspace_id: number;
  period_type: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  period_start: string;
  period_end: string;
  pay_date: string;
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  total_employer_taxes: number;
  processed_by: number | null;
  processed_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  processed_by_name?: string;
  approved_by_name?: string;
  employee_count?: number;
}

export interface PayrollRecord {
  id: number;
  workspace_id: number;
  pay_period_id: number;
  user_id: number;
  regular_hours: number;
  overtime_hours: number;
  double_time_hours: number;
  pto_hours: number;
  sick_hours: number;
  holiday_hours: number;
  regular_rate: number;
  overtime_rate: number | null;
  double_time_rate: number | null;
  regular_pay: number;
  overtime_pay: number;
  double_time_pay: number;
  pto_pay: number;
  sick_pay: number;
  holiday_pay: number;
  bonus: number;
  commission: number;
  reimbursements: number;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  health_insurance: number;
  dental_insurance: number;
  vision_insurance: number;
  retirement_401k: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  employer_social_security: number;
  employer_medicare: number;
  employer_unemployment: number;
  employer_workers_comp: number;
  total_employer_taxes: number;
  payment_method: 'direct_deposit' | 'check' | 'cash' | 'paycard';
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  email?: string;
  period_start?: string;
  period_end?: string;
  pay_date?: string;
}

export interface EmployeeCompensation {
  id: number;
  workspace_id: number;
  user_id: number;
  employment_type: 'full-time' | 'part-time' | 'contractor' | 'intern';
  pay_type: 'hourly' | 'salary' | 'commission';
  hourly_rate: number | null;
  salary_amount: number | null;
  pay_frequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly' | null;
  overtime_eligible: boolean;
  overtime_rate_multiplier: number;
  double_time_rate_multiplier: number;
  health_insurance_deduction: number;
  dental_insurance_deduction: number;
  vision_insurance_deduction: number;
  retirement_401k_percent: number;
  retirement_401k_employer_match: number;
  federal_withholding_allowances: number;
  state_withholding_allowances: number;
  additional_withholding: number;
  tax_filing_status: 'single' | 'married' | 'head_of_household';
  payment_method: 'direct_deposit' | 'check' | 'cash' | 'paycard';
  bank_name: string | null;
  account_type: 'checking' | 'savings' | null;
  routing_number: string | null;
  account_number_last4: string | null;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  email?: string;
}

export interface TaxBracket {
  id: number;
  workspace_id: number;
  tax_type: 'federal' | 'state';
  min_income: number;
  max_income: number | null;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollAnalytics {
  ytd: {
    total_employees: number;
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    total_employer_taxes: number;
    avg_hours_per_employee: number;
  };
  monthly: Array<{
    month: string;
    gross_pay: number;
    net_pay: number;
    employee_count: number;
  }>;
  by_employee: Array<{
    name: string;
    ytd_gross: number;
    ytd_net: number;
    ytd_hours: number;
  }>;
  year: number;
}

export const payrollApi = {
  // ==================== PAY PERIODS ====================

  async getPayPeriods(params: {
    status?: string;
    year?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: PayPeriod[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.year) searchParams.set('year', String(params.year));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/payroll/pay-periods${query ? `?${query}` : ''}`) as { data: PayPeriod[]; meta: any };
    return response;
  },

  async createPayPeriod(data: {
    period_type: PayPeriod['period_type'];
    period_start: string;
    period_end: string;
    pay_date: string;
    notes?: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/payroll/pay-periods', data) as { data: { id: number } };
    return response.data;
  },

  async processPayPeriod(id: number): Promise<{
    success: boolean;
    data: {
      employees_processed: number;
      total_gross_pay: number;
      total_net_pay: number;
    };
  }> {
    const response = await api.post(`/payroll/pay-periods/${id}/process`, {}) as any;
    return response;
  },

  async approvePayPeriod(id: number): Promise<{ success: boolean }> {
    const response = await api.post(`/payroll/pay-periods/${id}/approve`, {}) as { success: boolean };
    return response;
  },

  // ==================== PAYROLL RECORDS ====================

  async getPayrollRecords(params: {
    user_id?: number;
    pay_period_id?: number;
    payment_status?: string;
  } = {}): Promise<PayrollRecord[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.pay_period_id) searchParams.set('pay_period_id', String(params.pay_period_id));
    if (params.payment_status) searchParams.set('payment_status', params.payment_status);
    const query = searchParams.toString();
    const response = await api.get(`/payroll/records${query ? `?${query}` : ''}`) as { data: PayrollRecord[] };
    return response.data;
  },

  async markPayrollPaid(id: number, data: {
    payment_date?: string;
    payment_reference?: string;
  } = {}): Promise<{ success: boolean }> {
    const response = await api.post(`/payroll/records/${id}/paid`, data) as { success: boolean };
    return response;
  },

  async markPayrollRecordPaid(id: number): Promise<void> {
    await api.post(`/payroll/records/${id}/paid`, {});
  },

  // ==================== EMPLOYEE COMPENSATION ====================

  async getEmployeeCompensation(params: {
    user_id?: number;
    is_active?: boolean;
  } = {}): Promise<EmployeeCompensation[]> {
    const searchParams = new URLSearchParams();
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.is_active !== undefined) searchParams.set('is_active', params.is_active ? '1' : '0');
    const query = searchParams.toString();
    const response = await api.get(`/payroll/compensation${query ? `?${query}` : ''}`) as { data: EmployeeCompensation[] };
    return response.data;
  },

  async createEmployeeCompensation(data: {
    user_id: number;
    employment_type?: EmployeeCompensation['employment_type'];
    pay_type?: EmployeeCompensation['pay_type'];
    hourly_rate?: number;
    salary_amount?: number;
    pay_frequency?: EmployeeCompensation['pay_frequency'];
    overtime_eligible?: boolean;
    overtime_rate_multiplier?: number;
    health_insurance_deduction?: number;
    retirement_401k_percent?: number;
    payment_method?: EmployeeCompensation['payment_method'];
    effective_date: string;
  }): Promise<{ id: number }> {
    const response = await api.post('/payroll/compensation', data) as { data: { id: number } };
    return response.data;
  },

  async updateEmployeeCompensation(id: number, data: Partial<EmployeeCompensation>): Promise<{ success: boolean }> {
    const response = await api.put(`/payroll/compensation/${id}`, data) as { success: boolean };
    return response;
  },

  // ==================== TAX BRACKETS ====================

  async getTaxBrackets(type?: 'federal' | 'state'): Promise<TaxBracket[]> {
    const query = type ? `?type=${type}` : '';
    const response = await api.get(`/payroll/tax-brackets${query}`) as { data: TaxBracket[] };
    return response.data;
  },

  async createTaxBracket(data: Partial<TaxBracket>): Promise<{ id: number }> {
    const response = await api.post('/payroll/tax-brackets', data) as { data: { id: number } };
    return response.data;
  },

  async updateTaxBracket(id: number, data: Partial<TaxBracket>): Promise<{ success: boolean }> {
    const response = await api.put(`/payroll/tax-brackets/${id}`, data) as { success: boolean };
    return response;
  },

  async deleteTaxBracket(id: number): Promise<{ success: boolean }> {
    const response = await api.delete(`/payroll/tax-brackets/${id}`) as { success: boolean };
    return response;
  },

  // ==================== ANALYTICS ====================

  async getPayrollAnalytics(params: { year?: number } = {}): Promise<PayrollAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.year) searchParams.set('year', String(params.year));
    const query = searchParams.toString();
    const response = await api.get(`/payroll/analytics${query ? `?${query}` : ''}`) as { data: PayrollAnalytics };
    return response.data;
  },
};

export default payrollApi;
