import { api } from '@/lib/api';

export interface WebhookEndpoint {
  id: number;
  workspace_id: number;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  retry_failed: boolean;
  max_retries: number;
  custom_headers?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: number;
  endpoint_id: number;
  event_type: string;
  payload: any;
  status: 'pending' | 'success' | 'failed';
  http_status?: number;
  response_body?: string;
  error_message?: string;
  attempt_count: number;
  next_retry_at?: string;
  created_at: string;
  delivered_at?: string;
  endpoint_name?: string;
  endpoint_url?: string;
}

export interface WebhookEvent {
  name: string;
  description: string;
}

const webhooksApi = {
  // Endpoints
  listEndpoints: async (): Promise<WebhookEndpoint[]> => {
    const response = await api.get('/webhooks');
    return response.data;
  },

  createEndpoint: async (data: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> => {
    const response = await api.post('/webhooks', data);
    return response.data;
  },

  getEndpoint: async (id: number): Promise<WebhookEndpoint> => {
    const response = await api.get(`/webhooks/${id}`);
    return response.data;
  },

  updateEndpoint: async (id: number, data: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> => {
    const response = await api.put(`/webhooks/${id}`, data);
    return response.data;
  },

  deleteEndpoint: async (id: number): Promise<void> => {
    await api.delete(`/webhooks/${id}`);
  },

  testEndpoint: async (id: number): Promise<any> => {
    const response = await api.post(`/webhooks/${id}/test`);
    return response.data;
  },

  // Deliveries
  listDeliveries: async (endpointId?: number, params?: { limit?: number; offset?: number }): Promise<WebhookDelivery[]> => {
    const url = endpointId ? `/webhooks/${endpointId}/deliveries` : '/webhooks/deliveries';
    const response = await api.get(url, { params });
    return response.data;
  },

  getDelivery: async (id: number): Promise<WebhookDelivery> => {
    const response = await api.get(`/webhooks/deliveries/${id}`);
    return response.data;
  },

  retryDelivery: async (id: number): Promise<any> => {
    const response = await api.post(`/webhooks/deliveries/${id}/retry`);
    return response.data;
  },

  // Events catalog
  getEventCatalog: async (): Promise<{ events: WebhookEvent[] }> => {
    const response = await api.get('/webhooks/events');
    return response.data;
  },
};

export default webhooksApi;
