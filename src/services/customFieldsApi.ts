/**
 * Custom Fields & Tags API Service
 * Universal custom fields for contacts, opportunities, jobs, invoices, etc.
 */

import { api } from '@/lib/api';

export interface CustomFieldDefinition {
  id: number;
  workspace_id: number;
  entity_type: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'decimal' | 'date' | 'datetime' | 'boolean' | 'select' | 'multiselect' | 'url' | 'email' | 'phone' | 'currency' | 'file' | 'user' | 'contact' | 'company';
  options: string[] | Array<{ value: string; label: string }> | null;
  is_required: boolean;
  default_value: string | null;
  placeholder: string | null;
  help_text: string | null;
  validation_regex: string | null;
  min_value: number | null;
  max_value: number | null;
  max_length: number | null;
  sort_order: number;
  field_group: string | null;
  show_in_list: boolean;
  show_in_filters: boolean;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  field_id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  options: string[] | Array<{ value: string; label: string }> | null;
  value: unknown;
}

export interface Tag {
  id: number;
  workspace_id: number;
  name: string;
  color: string;
  description: string | null;
  entity_types: string[] | null;
  usage_count?: number;
  created_at: string;
}

export const customFieldsApi = {
  // ==================== FIELD DEFINITIONS ====================

  /**
   * Get custom field definitions
   */
  async getDefinitions(entityType?: string): Promise<CustomFieldDefinition[]> {
    const query = entityType ? `?entity_type=${entityType}` : '';
    const response = await api.get(`/custom-fields${query}`) as any;
    return response.data || response;
  },

  /**
   * Create custom field definition
   */
  async createDefinition(data: {
    entity_type: string;
    field_key: string;
    field_label: string;
    field_type: CustomFieldDefinition['field_type'];
    options?: string[] | Array<{ value: string; label: string }>;
    is_required?: boolean;
    default_value?: string;
    placeholder?: string;
    help_text?: string;
    validation_regex?: string;
    min_value?: number;
    max_value?: number;
    max_length?: number;
    sort_order?: number;
    field_group?: string;
    show_in_list?: boolean;
    show_in_filters?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post('/custom-fields', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update custom field definition
   */
  async updateDefinition(id: number, data: Partial<Omit<CustomFieldDefinition, 'id' | 'workspace_id' | 'entity_type' | 'field_key' | 'is_system' | 'created_at' | 'updated_at'>>): Promise<void> {
    await api.put(`/custom-fields/${id}`, data);
  },

  /**
   * Delete custom field definition
   */
  async deleteDefinition(id: number): Promise<void> {
    await api.delete(`/custom-fields/${id}`);
  },

  /**
   * Reorder custom fields
   */
  async reorderDefinitions(fieldIds: number[]): Promise<void> {
    await api.post('/custom-fields/reorder', { field_ids: fieldIds });
  },

  // ==================== FIELD VALUES ====================

  /**
   * Get custom field values for an entity
   */
  async getValues(entityType: string, entityId: number): Promise<Record<string, CustomFieldValue>> {
    const response = await api.get(`/custom-fields/values/${entityType}/${entityId}`) as { data: Record<string, CustomFieldValue> };
    return response.data;
  },

  /**
   * Set custom field values for an entity
   */
  async setValues(entityType: string, entityId: number, values: Record<string, unknown>): Promise<void> {
    await api.post(`/custom-fields/values/${entityType}/${entityId}`, { values });
  },

  // ==================== TAGS ====================

  /**
   * Get all tags
   */
  async getTags(entityType?: string): Promise<Tag[]> {
    const query = entityType ? `?entity_type=${entityType}` : '';
    const response = await api.get(`/tags${query}`) as any;
    return response.data || response;
  },

  /**
   * Create tag
   */
  async createTag(data: {
    name: string;
    color?: string;
    description?: string;
    entity_types?: string[];
  }): Promise<{ id: number }> {
    const response = await api.post('/tags', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Update tag
   */
  async updateTag(id: number, data: Partial<Pick<Tag, 'name' | 'color' | 'description' | 'entity_types'>>): Promise<void> {
    await api.put(`/tags/${id}`, data);
  },

  /**
   * Delete tag
   */
  async deleteTag(id: number): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  /**
   * Get tags for an entity
   */
  async getEntityTags(entityType: string, entityId: number): Promise<Tag[]> {
    const response = await api.get(`/tags/entity/${entityType}/${entityId}`) as { data: Tag[] };
    return response.data;
  },

  /**
   * Set tags for an entity (replaces all)
   */
  async setEntityTags(entityType: string, entityId: number, tagIds: number[]): Promise<void> {
    await api.post(`/tags/entity/${entityType}/${entityId}`, { tag_ids: tagIds });
  },

  /**
   * Add single tag to entity
   */
  async addEntityTag(entityType: string, entityId: number, tagId: number): Promise<void> {
    await api.post(`/tags/entity/${entityType}/${entityId}/${tagId}`, {});
  },

  /**
   * Remove single tag from entity
   */
  async removeEntityTag(entityType: string, entityId: number, tagId: number): Promise<void> {
    await api.delete(`/tags/entity/${entityType}/${entityId}/${tagId}`);
  },
};

export default customFieldsApi;
