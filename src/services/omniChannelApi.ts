import { api } from '@/lib/api';

export interface FacebookPage {
  id: number;
  workspace_id: number;
  company_id?: number;
  page_id: string;
  page_name: string;
  page_access_token: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramAccount {
  id: number;
  workspace_id: number;
  company_id?: number;
  instagram_id: string;
  username: string;
  access_token: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GMBLocation {
  id: number;
  workspace_id: number;
  company_id?: number;
  location_id: string;
  location_name: string;
  access_token: string;
  refresh_token: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageQueueItem {
  id: number;
  workspace_id: number;
  conversation_id?: number;
  channel: 'email' | 'sms' | 'whatsapp' | 'facebook' | 'instagram' | 'gmb' | 'webchat';
  direction: 'inbound' | 'outbound';
  from_identifier: string;
  to_identifier: string;
  content: string;
  media_urls?: string[];
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';
  external_id?: string;
  error_message?: string;
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

const omniChannelApi = {
  // Facebook
  listFacebookPages: async (): Promise<FacebookPage[]> => {
    const response = await api.get('/omnichannel/facebook/pages');
    return response.data;
  },

  connectFacebookPage: async (data: { page_id: string; page_name: string; page_access_token: string }): Promise<{ message: string }> => {
    const response = await api.post('/omnichannel/facebook/pages', data);
    return response.data;
  },

  disconnectFacebookPage: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/omnichannel/facebook/pages/${id}`);
    return response.data;
  },

  // Instagram
  listInstagramAccounts: async (): Promise<InstagramAccount[]> => {
    const response = await api.get('/omnichannel/instagram/accounts');
    return response.data;
  },

  connectInstagram: async (data: { instagram_id: string; username: string; access_token: string }): Promise<{ message: string }> => {
    const response = await api.post('/omnichannel/instagram/accounts', data);
    return response.data;
  },

  // Google My Business
  listGMBLocations: async (): Promise<GMBLocation[]> => {
    const response = await api.get('/omnichannel/gmb/locations');
    return response.data;
  },

  connectGMB: async (data: { location_id: string; location_name: string; access_token: string; refresh_token: string }): Promise<{ message: string }> => {
    const response = await api.post('/omnichannel/gmb/locations', data);
    return response.data;
  },

  // Message Queue
  listMessages: async (params?: { channel?: string; status?: string; limit?: number }): Promise<MessageQueueItem[]> => {
    const response = await api.get('/omnichannel/messages', { params });
    return response.data;
  },

  queueMessage: async (data: {
    channel: string;
    from: string;
    to: string;
    content: string;
    media_urls?: string[];
    scheduled_at?: string;
    conversation_id?: number;
  }): Promise<{ message_id: number }> => {
    const response = await api.post('/omnichannel/messages', data);
    return response.data;
  },
};

export default omniChannelApi;
