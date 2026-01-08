/**
 * Integrations Framework API Service
 * Standard connector framework for third-party services
 */

import { api } from '@/lib/api';

export interface Integration {
  id: number;
  workspace_id: number;
  provider: string;
  provider_account_id: string | null;
  provider_account_name: string | null;
  status: 'disconnected' | 'pending' | 'connected' | 'error' | 'expired';
  error_message: string | null;
  last_error_at: string | null;
  scopes: string[] | null;
  config: Record<string, unknown> | null;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'partial' | 'failed' | null;
  connected_by: number | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  oauth: boolean;
  scopes: string[];
  features: string[];
}

export interface SyncJob {
  id: number;
  workspace_id: number;
  integration_id: number;
  job_type: string;
  entity_type: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_log: Array<{ message: string; timestamp: string }> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export const integrationsApi = {
  /**
   * List all integrations for workspace
   */
  async list(): Promise<Integration[]> {
    const response = await api.get('/integrations') as { data: Integration[] };
    return response.data;
  },

  /**
   * Get single integration by provider
   */
  async get(provider: string): Promise<Integration | null> {
    const response = await api.get(`/integrations/${provider}`) as { data: Integration | null };
    return response.data;
  },

  /**
   * Get available providers
   */
  async getProviders(): Promise<IntegrationProvider[]> {
    const response = await api.get('/integrations/providers') as { data: IntegrationProvider[] };
    return response.data;
  },

  /**
   * Start OAuth flow for a provider
   */
  async startOAuth(provider: string, options: { redirect_uri?: string; scopes?: string[] } = {}): Promise<{ auth_url: string; state: string }> {
    const response = await api.post(`/integrations/${provider}/oauth`, options) as { data: { auth_url: string; state: string } };
    return response.data;
  },

  /**
   * Connect with API keys (non-OAuth providers)
   */
  async connectWithKeys(provider: string, credentials: Record<string, string>, config?: Record<string, unknown>): Promise<{ provider: string; status: string; account_name: string | null }> {
    const response = await api.post(`/integrations/${provider}/connect`, { ...credentials, config }) as { data: { provider: string; status: string; account_name: string | null } };
    return response.data;
  },

  /**
   * Disconnect integration
   */
  async disconnect(provider: string): Promise<void> {
    await api.post(`/integrations/${provider}/disconnect`, {});
  },

  /**
   * Test integration connection
   */
  async test(provider: string): Promise<{ success: boolean; error?: string; account_id?: string; account_name?: string }> {
    const response = await api.post(`/integrations/${provider}/test`, {}) as { data: { success: boolean; error?: string; account_id?: string; account_name?: string } };
    return response.data;
  },

  /**
   * Update integration config
   */
  async updateConfig(provider: string, config: Record<string, unknown>): Promise<void> {
    await api.put(`/integrations/${provider}/config`, { config });
  },

  /**
   * Trigger sync for integration
   */
  async sync(provider: string, options: { job_type?: string; entity_type?: string } = {}): Promise<{ job_id: number; status: string }> {
    const response = await api.post(`/integrations/${provider}/sync`, options) as { data: { job_id: number; status: string } };
    return response.data;
  },

  /**
   * Get sync job status
   */
  async getSyncJob(jobId: number): Promise<SyncJob> {
    const response = await api.get(`/integrations/sync-jobs/${jobId}`) as { data: SyncJob };
    return response.data;
  },
};

export default integrationsApi;
