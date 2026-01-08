/**
 * Files & Media Library API Service
 * Handles file uploads, attachments, and media management
 */

import { api } from '@/lib/api';

export interface FileItem {
  id: number;
  workspace_id: number;
  company_id: number | null;
  user_id: number | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  storage_provider: 'local' | 's3' | 'cloudinary';
  public_url: string | null;
  folder: string | null;
  category: 'attachment' | 'image' | 'document' | 'receipt' | 'photo' | 'video' | 'audio' | 'other';
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  alt_text: string | null;
  description: string | null;
  is_public: boolean;
  is_archived: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  url?: string;
}

export interface FileFolder {
  folder: string;
  file_count: number;
}

export interface FilesListParams {
  entity_type?: string;
  entity_id?: number;
  folder?: string;
  category?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export const filesApi = {
  /**
   * List files with filtering
   */
  async list(params: FilesListParams = {}): Promise<{ data: FileItem[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.entity_type) searchParams.set('entity_type', params.entity_type);
    if (params.entity_id) searchParams.set('entity_id', String(params.entity_id));
    if (params.folder) searchParams.set('folder', params.folder);
    if (params.category) searchParams.set('category', params.category);
    if (params.q) searchParams.set('q', params.q);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    const response = await api.get(`/files${query ? `?${query}` : ''}`) as { data: FileItem[]; meta: { total: number; limit: number; offset: number } };
    return response;
  },

  /**
   * Get single file
   */
  async get(id: number): Promise<FileItem> {
    const response = await api.get(`/files/${id}`) as { data: FileItem };
    return response.data;
  },

  /**
   * Upload file(s)
   */
  async upload(
    file: File | File[],
    options: {
      entity_type?: string;
      entity_id?: number;
      folder?: string;
      company_id?: number;
    } = {}
  ): Promise<{ data: FileItem[]; errors: Array<{ filename: string; error: string }> }> {
    const formData = new FormData();
    
    if (Array.isArray(file)) {
      file.forEach(f => formData.append('file[]', f));
    } else {
      formData.append('file', file);
    }
    
    if (options.entity_type) formData.append('entity_type', options.entity_type);
    if (options.entity_id) formData.append('entity_id', String(options.entity_id));
    if (options.folder) formData.append('folder', options.folder);
    if (options.company_id) formData.append('company_id', String(options.company_id));

    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'X-Workspace-Id': localStorage.getItem('workspace_id') || '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  /**
   * Update file metadata
   */
  async update(id: number, data: Partial<Pick<FileItem, 'folder' | 'category' | 'alt_text' | 'description' | 'is_public' | 'entity_type' | 'entity_id'>> & { tags?: string[] }): Promise<void> {
    await api.put(`/files/${id}`, data);
  },

  /**
   * Delete file
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/files/${id}`);
  },

  /**
   * Attach file to entity
   */
  async attach(fileId: number, entityType: string, entityId: number): Promise<void> {
    await api.post(`/files/${fileId}/attach`, { entity_type: entityType, entity_id: entityId });
  },

  /**
   * Get files for an entity
   */
  async forEntity(entityType: string, entityId: number): Promise<FileItem[]> {
    const response = await api.get(`/files/entity/${entityType}/${entityId}`) as { data: FileItem[] };
    return response.data;
  },

  /**
   * Get folders list
   */
  async getFolders(): Promise<FileFolder[]> {
    const response = await api.get('/files/folders') as { data: FileFolder[] };
    return response.data;
  },
};

export default filesApi;
