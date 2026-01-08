import { api } from '@/lib/api';

export interface AutomationWorkflow {
  id: number;
  workspace_id: number;
  company_id: number | null;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'draft';
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  created_by: number | null;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  action_count?: number;
  execution_count?: number;
  actions?: AutomationAction[];
}

export interface AutomationAction {
  id?: number;
  workflow_id?: number;
  action_type: string;
  action_config: Record<string, unknown>;
  sort_order: number;
  delay_seconds: number;
  condition_config?: Record<string, unknown> | null;
}

export interface AutomationRecipe {
  id: number;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: AutomationAction[];
  is_system: boolean;
  popularity: number;
}

export interface TriggerType {
  type: string;
  name: string;
  category: string;
  icon: string;
}

export interface ActionType {
  type: string;
  name: string;
  category: string;
  icon: string;
}

export interface AutomationExecution {
  id: number;
  workflow_id: number;
  workspace_id: number;
  company_id: number | null;
  trigger_event_id: number | null;
  contact_id: number | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_action_index: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  execution_log: Record<string, unknown>[];
  created_at: string;
  contact_first_name?: string;
  contact_last_name?: string;
}

export interface AutomationStats {
  workflows: {
    total: number;
    active: number;
    paused: number;
    draft: number;
    total_runs: number;
  };
  executions: {
    total: number;
    completed: number;
    failed: number;
    running: number;
  };
}

export const automationsApi = {
  // ==================== WORKFLOWS ====================
  
  async listWorkflows(params: { status?: string; trigger_type?: string } = {}): Promise<AutomationWorkflow[]> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.trigger_type) searchParams.set('trigger_type', params.trigger_type);
    const query = searchParams.toString();
    const response = await api.get(`/automations/v2/workflows${query ? `?${query}` : ''}`) as { data: AutomationWorkflow[] };
    return response.data;
  },

  async getWorkflow(id: number): Promise<AutomationWorkflow> {
    const response = await api.get(`/automations/v2/workflows/${id}`) as { data: AutomationWorkflow };
    return response.data;
  },

  async createWorkflow(data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_config?: Record<string, unknown>;
    status?: 'active' | 'paused' | 'draft';
    actions?: AutomationAction[];
  }): Promise<{ id: number }> {
    const response = await api.post('/automations/v2/workflows', data) as { data: { id: number } };
    return response.data;
  },

  async updateWorkflow(id: number, data: Partial<AutomationWorkflow> & { actions?: AutomationAction[] }): Promise<void> {
    await api.put(`/automations/v2/workflows/${id}`, data);
  },

  async deleteWorkflow(id: number): Promise<void> {
    await api.delete(`/automations/v2/workflows/${id}`);
  },

  async toggleWorkflow(id: number): Promise<{ status: string }> {
    const response = await api.post(`/automations/v2/workflows/${id}/toggle`, {}) as { data: { status: string } };
    return response.data;
  },

  async getExecutions(workflowId: number, params: { limit?: number; offset?: number } = {}): Promise<AutomationExecution[]> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/automations/v2/workflows/${workflowId}/executions${query ? `?${query}` : ''}`) as { data: AutomationExecution[] };
    return response.data;
  },

  // ==================== RECIPES ====================

  async listRecipes(category?: string): Promise<AutomationRecipe[]> {
    const query = category ? `?category=${category}` : '';
    const response = await api.get(`/automations/v2/recipes${query}`) as { data: AutomationRecipe[] };
    return response.data;
  },

  async getRecipeCategories(): Promise<{ category: string; count: number }[]> {
    const response = await api.get('/automations/v2/recipes/categories') as { data: { category: string; count: number }[] };
    return response.data;
  },

  async useRecipe(recipeId: number, name?: string): Promise<{ id: number }> {
    const response = await api.post(`/automations/v2/recipes/${recipeId}/use`, { name }) as { data: { id: number } };
    return response.data;
  },

  // ==================== TRIGGERS & ACTIONS ====================

  async getTriggerTypes(): Promise<TriggerType[]> {
    const response = await api.get('/automations/v2/triggers') as { data: TriggerType[] };
    return response.data;
  },

  async getActionTypes(): Promise<ActionType[]> {
    const response = await api.get('/automations/v2/actions') as { data: ActionType[] };
    return response.data;
  },

  // ==================== STATS ====================

  async getStats(): Promise<AutomationStats> {
    const response = await api.get('/automations/v2/stats') as { data: AutomationStats };
    return response.data;
  },
};

export default automationsApi;
