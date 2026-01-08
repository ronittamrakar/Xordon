/**
 * Contact Stages & Lead Scoring API Service
 * Manage contact lifecycle stages, lead scoring, and segments
 */

import { api } from '@/lib/api';

export interface ContactStage {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_system: boolean;
  contact_count?: number;
  created_at: string;
}

export interface LeadScoringRule {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  conditions: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'is_null' | 'is_not_null';
    value?: unknown;
  };
  score_change: number;
  max_applications: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSegment {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  filters: Array<{
    field: string;
    operator: string;
    value?: unknown;
  }>;
  contact_count: number;
  last_calculated_at: string | null;
  color: string;
  icon: string | null;
  is_dynamic: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export const contactStagesApi = {
  // ==================== CONTACT STAGES ====================

  /**
   * Get all contact stages
   */
  async getStages(): Promise<ContactStage[]> {
    const response = await api.get('/contact-stages') as { data: ContactStage[] };
    return response.data;
  },

  /**
   * Create contact stage
   */
  async createStage(data: {
    name: string;
    description?: string;
    color?: string;
    sort_order?: number;
    is_default?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post('/contact-stages', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update contact stage
   */
  async updateStage(id: number, data: Partial<Pick<ContactStage, 'name' | 'description' | 'color' | 'sort_order' | 'is_default'>>): Promise<void> {
    await api.put(`/contact-stages/${id}`, data);
  },

  /**
   * Delete contact stage
   */
  async deleteStage(id: number): Promise<void> {
    await api.delete(`/contact-stages/${id}`);
  },

  /**
   * Reorder stages
   */
  async reorderStages(stageIds: number[]): Promise<void> {
    await api.post('/contact-stages/reorder', { stage_ids: stageIds });
  },

  /**
   * Move contact to stage
   */
  async moveContactToStage(contactId: number, stageId: number): Promise<void> {
    await api.post(`/contacts/${contactId}/stage/${stageId}`, {});
  },

  // ==================== LEAD SCORING ====================

  /**
   * Get lead scoring rules
   */
  async getScoringRules(): Promise<LeadScoringRule[]> {
    const response = await api.get('/scoring-rules') as { data: LeadScoringRule[] };
    return response.data;
  },

  /**
   * Create scoring rule
   */
  async createScoringRule(data: {
    name: string;
    description?: string;
    conditions: LeadScoringRule['conditions'];
    score_change: number;
    max_applications?: number;
    is_active?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post('/scoring-rules', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update scoring rule
   */
  async updateScoringRule(id: number, data: Partial<Omit<LeadScoringRule, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    await api.put(`/scoring-rules/${id}`, data);
  },

  /**
   * Delete scoring rule
   */
  async deleteScoringRule(id: number): Promise<void> {
    await api.delete(`/scoring-rules/${id}`);
  },

  /**
   * Apply score to contact
   */
  async applyScore(contactId: number, scoreChange: number): Promise<{ score: number }> {
    const response = await api.post(`/contacts/${contactId}/score`, { score_change: scoreChange }) as { data: { score: number } };
    return response.data;
  },

  // ==================== SEGMENTS ====================

  /**
   * Get all segments
   */
  async getSegments(): Promise<ContactSegment[]> {
    const response = await api.get('/segments') as { data: ContactSegment[] };
    return response.data;
  },

  /**
   * Create segment
   */
  async createSegment(data: {
    name: string;
    description?: string;
    filters: ContactSegment['filters'];
    color?: string;
    icon?: string;
    is_dynamic?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post('/segments', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update segment
   */
  async updateSegment(id: number, data: Partial<Pick<ContactSegment, 'name' | 'description' | 'filters' | 'color' | 'icon' | 'is_dynamic'>>): Promise<void> {
    await api.put(`/segments/${id}`, data);
  },

  /**
   * Delete segment
   */
  async deleteSegment(id: number): Promise<void> {
    await api.delete(`/segments/${id}`);
  },

  /**
   * Get contacts in segment
   */
  async getSegmentContacts(segmentId: number, params: { limit?: number; offset?: number } = {}): Promise<{
    data: unknown[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/segments/${segmentId}/contacts${query ? `?${query}` : ''}`) as {
      data: unknown[];
      meta: { total: number; limit: number; offset: number };
    };
    return response;
  },
};

export default contactStagesApi;
