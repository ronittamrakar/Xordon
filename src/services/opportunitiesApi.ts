import { api } from '@/lib/api';

export interface Pipeline {
  id: number;
  workspace_id: number;
  company_id: number | null;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  opportunity_count?: number;
  total_value?: number;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: number;
  workspace_id: number;
  company_id: number | null;
  pipeline_id: number;
  name: string;
  color: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  opportunity_count?: number;
  total_value?: number;
}

export interface Opportunity {
  id: number;
  workspace_id: number;
  company_id: number | null;
  contact_id: number | null;
  pipeline_id: number;
  stage_id: number;
  owner_user_id: number | null;
  name: string;
  value: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  expected_close_date: string | null;
  actual_close_date: string | null;
  lost_reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  pipeline_name?: string;
  stage_name?: string;
  stage_color?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  owner_name?: string;
}

export interface OpportunityStats {
  total: number;
  open: number;
  won: number;
  lost: number;
  open_value: number;
  won_value: number;
  lost_value: number;
}

export interface OpportunitiesListParams {
  pipeline_id?: number;
  stage_id?: number;
  status?: 'open' | 'won' | 'lost';
  owner?: 'me' | string;
  contact_id?: number;
  q?: string;
  limit?: number;
  offset?: number;
}

export const opportunitiesApi = {
  // ==================== PIPELINES ====================
  
  async getPipelines(): Promise<Pipeline[]> {
    const response = await api.get('/pipelines') as { data: Pipeline[] };
    return response.data;
  },

  async getPipeline(id: number): Promise<Pipeline> {
    const response = await api.get(`/pipelines/${id}`) as { data: Pipeline };
    return response.data;
  },

  async createPipeline(data: { name: string; is_default?: boolean; stages?: Array<{ name: string; color?: string; is_won?: boolean; is_lost?: boolean }> }): Promise<{ id: number }> {
    const response = await api.post('/pipelines', data) as { data: { id: number } };
    return response.data;
  },

  async updatePipeline(id: number, data: { name?: string; is_default?: boolean }): Promise<void> {
    await api.put(`/pipelines/${id}`, data);
  },

  async deletePipeline(id: number): Promise<void> {
    await api.delete(`/pipelines/${id}`);
  },

  // ==================== STAGES ====================

  async getStages(pipelineId: number): Promise<PipelineStage[]> {
    const response = await api.get(`/pipelines/${pipelineId}/stages`) as { data: PipelineStage[] };
    return response.data;
  },

  async createStage(pipelineId: number, data: { name: string; color?: string; is_won?: boolean; is_lost?: boolean }): Promise<{ id: number }> {
    const response = await api.post(`/pipelines/${pipelineId}/stages`, data) as { data: { id: number } };
    return response.data;
  },

  async updateStage(stageId: number, data: { name?: string; color?: string; sort_order?: number; is_won?: boolean; is_lost?: boolean }): Promise<void> {
    await api.put(`/pipeline-stages/${stageId}`, data);
  },

  async deleteStage(stageId: number): Promise<void> {
    await api.delete(`/pipeline-stages/${stageId}`);
  },

  async reorderStages(pipelineId: number, stageIds: number[]): Promise<void> {
    await api.post(`/pipelines/${pipelineId}/stages/reorder`, { stage_ids: stageIds });
  },

  // ==================== OPPORTUNITIES ====================

  async list(params: OpportunitiesListParams = {}): Promise<{ data: Opportunity[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.pipeline_id) searchParams.set('pipeline_id', String(params.pipeline_id));
    if (params.stage_id) searchParams.set('stage_id', String(params.stage_id));
    if (params.status) searchParams.set('status', params.status);
    if (params.owner) searchParams.set('owner', params.owner);
    if (params.contact_id) searchParams.set('contact_id', String(params.contact_id));
    if (params.q) searchParams.set('q', params.q);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    const response = await api.get(`/opportunities${query ? `?${query}` : ''}`) as { data: Opportunity[]; meta: { total: number; limit: number; offset: number } };
    return response;
  },

  async get(id: number): Promise<Opportunity> {
    const response = await api.get(`/opportunities/${id}`) as { data: Opportunity };
    return response.data;
  },

  async create(data: {
    name: string;
    pipeline_id?: number;
    stage_id?: number;
    contact_id?: number;
    owner_user_id?: number;
    value?: number;
    currency?: string;
    expected_close_date?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const response = await api.post('/opportunities', data) as { data: { id: number } };
    return response.data;
  },

  async update(id: number, data: Partial<Opportunity>): Promise<void> {
    await api.put(`/opportunities/${id}`, data);
  },

  async moveStage(id: number, stageId: number): Promise<{ stage_id: number; status: string }> {
    const response = await api.post(`/opportunities/${id}/move`, { stage_id: stageId }) as { data: { stage_id: number; status: string } };
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/opportunities/${id}`);
  },

  async getStats(): Promise<OpportunityStats> {
    const response = await api.get('/opportunities/stats') as { data: OpportunityStats };
    return response.data;
  },
};

export default opportunitiesApi;
