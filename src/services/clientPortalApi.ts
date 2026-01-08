import { api } from '@/lib/api';

export interface PortalDocument {
  id: number;
  workspace_id: number;
  company_id?: number;
  contact_id: number;
  document_type: 'contract' | 'invoice' | 'proposal' | 'report' | 'other';
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  requires_signature: boolean;
  signature_status?: 'pending' | 'signed' | 'declined';
  signed_at?: string;
  signature_data?: any;
  is_visible_to_client: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PortalMessage {
  id: number;
  workspace_id: number;
  company_id?: number;
  contact_id: number;
  thread_id?: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'client' | 'staff';
  sender_id?: number;
  subject?: string;
  message: string;
  attachments?: any[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

const clientPortalApi = {
  // Documents
  listDocuments: async (params?: { contact_id?: number }): Promise<PortalDocument[]> => {
    const response = await api.get('/portal/documents', { params });
    return response.data as PortalDocument[];
  },

  uploadDocument: async (data: Partial<PortalDocument>): Promise<{ document_id: number }> => {
    const response = await api.post('/portal/documents', data);
    return response.data as { document_id: number };
  },

  signDocument: async (id: number, signatureData: any): Promise<{ message: string }> => {
    const response = await api.post(`/portal/documents/${id}/sign`, { signature_data: signatureData });
    return response.data as { message: string };
  },

  // Messages
  listMessages: async (params?: { contact_id?: number; thread_id?: string }): Promise<PortalMessage[]> => {
    const response = await api.get('/portal/messages', { params });
    return response.data as PortalMessage[];
  },

  sendMessage: async (data: Partial<PortalMessage>): Promise<{ message_id: number }> => {
    const response = await api.post('/portal/messages', data);
    return response.data as { message_id: number };
  },

  markMessageRead: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/portal/messages/${id}/read`);
    return response.data as { message: string };
  },
};

export default clientPortalApi;
