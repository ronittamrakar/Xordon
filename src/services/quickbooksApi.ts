import { api } from '@/lib/api';

export interface QuickBooksConnection {
  id: number;
  workspace_id: number;
  realm_id: string;
  company_name?: string;
  country?: string;
  sync_enabled: boolean;
  auto_sync_invoices: boolean;
  auto_sync_payments: boolean;
  auto_sync_customers: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  connected: boolean;
}

export interface QuickBooksSyncMapping {
  id: number;
  workspace_id: number;
  entity_type: 'customer' | 'invoice' | 'payment' | 'product' | 'expense';
  local_id: number;
  quickbooks_id: string;
  last_synced_at: string;
  sync_status: 'synced' | 'pending' | 'error';
  error_message?: string;
}

export interface QuickBooksSyncStatus {
  stats: Array<{
    entity_type: string;
    count: number;
    sync_status: string;
  }>;
  recent_syncs: QuickBooksSyncMapping[];
}

const quickbooksApi = {
  getConnection: async (): Promise<QuickBooksConnection> => {
    const response = await api.get('/quickbooks/connection');
    return response.data;
  },

  connect: async (code: string, realmId: string): Promise<{ connected: boolean }> => {
    const response = await api.post('/quickbooks/connect', { code, realm_id: realmId });
    return response.data;
  },

  disconnect: async (): Promise<{ disconnected: boolean }> => {
    const response = await api.post('/quickbooks/disconnect');
    return response.data;
  },

  updateSettings: async (settings: Partial<QuickBooksConnection>): Promise<QuickBooksConnection> => {
    const response = await api.put('/quickbooks/settings', settings);
    return response.data;
  },

  exportInvoice: async (invoiceId: number): Promise<{ synced: boolean; quickbooks_id: string }> => {
    const response = await api.post(`/quickbooks/export/invoice/${invoiceId}`);
    return response.data;
  },

  exportPayment: async (paymentId: number): Promise<{ synced: boolean; quickbooks_id: string }> => {
    const response = await api.post(`/quickbooks/export/payment/${paymentId}`);
    return response.data;
  },

  getSyncStatus: async (): Promise<QuickBooksSyncStatus> => {
    const response = await api.get('/quickbooks/sync-status');
    return response.data;
  },

  syncAll: async (): Promise<{ synced: boolean; message: string }> => {
    const response = await api.post('/quickbooks/sync-all');
    return response.data;
  },
};

export default quickbooksApi;
