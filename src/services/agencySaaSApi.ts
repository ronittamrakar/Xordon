import { api } from '@/lib/api';

export interface Snapshot {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  includes_funnels: boolean;
  includes_automations: boolean;
  includes_templates: boolean;
  includes_forms: boolean;
  includes_pages: boolean;
  includes_workflows: boolean;
  snapshot_data: any;
  is_public: boolean;
  is_premium: boolean;
  price: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageMetrics {
  workspace_id: number;
  metric_date: string;
  contacts_count: number;
  contacts_limit?: number;
  emails_sent: number;
  sms_sent: number;
  emails_limit?: number;
  sms_limit?: number;
  storage_used_mb: number;
  storage_limit_mb?: number;
  api_calls: number;
  api_calls_limit?: number;
}

export interface BillingPlan {
  id: number;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  contacts_limit?: number;
  emails_limit?: number;
  sms_limit?: number;
  storage_limit_mb?: number;
  users_limit?: number;
  features?: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSubscription {
  id: number;
  workspace_id: number;
  billing_plan_id: number;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
  plan_name?: string;
  features?: any;
}

const agencySaaSApi = {
  // Snapshots
  listSnapshots: async (includePublic = false): Promise<Snapshot[]> => {
    const response = await api.get('/agency/snapshots', { 
      params: { include_public: includePublic } 
    });
    return response.data as Snapshot[];
  },

  createSnapshot: async (data: Partial<Snapshot>): Promise<{ snapshot_id: number }> => {
    const response = await api.post('/agency/snapshots', data);
    return response.data as { snapshot_id: number };
  },

  cloneSnapshot: async (id: number, targetCompanyId?: number): Promise<{ message: string; cloned_items: any }> => {
    const response = await api.post(`/agency/snapshots/${id}/clone`, {
      target_company_id: targetCompanyId
    });
    return response.data as { message: string; cloned_items: any };
  },

  // Usage Tracking
  getUsageMetrics: async (date?: string): Promise<UsageMetrics> => {
    const response = await api.get('/agency/usage', { 
      params: { date } 
    });
    return response.data as UsageMetrics;
  },

  trackUsage: async (data: { emails_sent?: number; sms_sent?: number; api_calls?: number }): Promise<{ message: string }> => {
    const response = await api.post('/agency/usage', data);
    return response.data as { message: string };
  },

  // Billing
  listPlans: async (): Promise<BillingPlan[]> => {
    const response = await api.get('/agency/plans');
    return response.data as BillingPlan[];
  },

  getSubscription: async (): Promise<WorkspaceSubscription> => {
    const response = await api.get('/agency/subscription');
    return response.data as WorkspaceSubscription;
  },

  updateSubscription: async (data: { billing_plan_id: number; status?: string }): Promise<{ message: string }> => {
    const response = await api.put('/agency/subscription', data);
    return response.data as { message: string };
  },
};

export default agencySaaSApi;
