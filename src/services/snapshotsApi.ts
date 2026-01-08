import { api } from '@/lib/api';

export interface SnapshotMetadata {
  item_counts: {
    pipelines: number;
    automations: number;
    workflows: number;
    funnels: number;
    forms: number;
    email_templates: number;
    sms_templates: number;
    custom_fields: number;
    tags: number;
    segments: number;
    integrations: number;
    contacts_schema: boolean; // Whether contact field structure is included
    settings: boolean; // Whether workspace settings are included
  };
}

export interface Snapshot {
  id: number;
  workspace_id: number;
  company_id: number | null;
  name: string;
  description: string | null;
  version: string;
  category: 'full' | 'pipelines' | 'automations' | 'forms' | 'templates' | 'custom';
  is_template: boolean;
  is_public: boolean;
  thumbnail_url: string | null;
  metadata: SnapshotMetadata | null;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SnapshotContents {
  version: string;
  exported_at: string;
  source_workspace_id: number;
  pipelines?: unknown[];
  automations?: unknown[];
  workflows?: unknown[];
  funnels?: unknown[];
  forms?: unknown[];
  email_templates?: unknown[];
  sms_templates?: unknown[];
  custom_fields?: unknown[];
  tags?: unknown[];
  segments?: unknown[];
  integrations?: unknown[];
  contacts_schema?: unknown; // Contact field definitions
  workspace_settings?: unknown; // Workspace configuration
}

export interface SnapshotFull extends Snapshot {
  contents: SnapshotContents;
}

export interface SnapshotImport {
  id: number;
  workspace_id: number;
  snapshot_id: number | null;
  source_type: 'internal' | 'file' | 'marketplace';
  source_name: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  items_imported: Record<string, number> | null;
  error_message: string | null;
  imported_by: number | null;
  imported_by_name?: string;
  snapshot_name?: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export const snapshotsApi = {
  async listSnapshots(category?: string): Promise<Snapshot[]> {
    const query = category ? `?category=${category}` : '';
    const response = await api.get(`/snapshots${query}`) as { data: Snapshot[] };
    return response.data;
  },

  async getSnapshot(id: number): Promise<SnapshotFull> {
    const response = await api.get(`/snapshots/${id}`) as { data: SnapshotFull };
    return response.data;
  },

  async createSnapshot(data: {
    name: string;
    description?: string;
    category?: string;
    include?: string[];
    is_template?: boolean;
    is_public?: boolean;
  }): Promise<{ id: number; metadata: SnapshotMetadata }> {
    const response = await api.post('/snapshots', data) as { data: { id: number; metadata: SnapshotMetadata } };
    return response.data;
  },

  async importSnapshot(id: number, importItems?: string[]): Promise<{ import_id: number; items_imported: Record<string, number> }> {
    const response = await api.post(`/snapshots/${id}/import`, { import: importItems }) as { data: { import_id: number; items_imported: Record<string, number> } };
    return response.data;
  },

  async deleteSnapshot(id: number): Promise<void> {
    await api.delete(`/snapshots/${id}`);
  },

  async downloadSnapshot(id: number): Promise<void> {
    window.open(`${import.meta.env.VITE_API_URL || ''}/snapshots/${id}/download`, '_blank');
  },

  async listImports(): Promise<SnapshotImport[]> {
    const response = await api.get('/snapshots/imports') as { data: SnapshotImport[] };
    return response.data;
  },
};

export default snapshotsApi;
