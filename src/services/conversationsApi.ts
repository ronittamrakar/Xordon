import { api } from '@/lib/api';

export interface Conversation {
  id: number;
  workspace_id: number;
  company_id: number | null;
  contact_id: number;
  assigned_user_id: number | null;
  status: 'open' | 'pending' | 'closed';
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_avatar?: string;
  assigned_user_name?: string;
  last_message_preview?: string;
  last_message_channel?: string;
  messages?: Message[];
}

export interface Message {
  id: number;
  conversation_id: number;
  channel: 'sms' | 'email' | 'call' | 'note' | 'system' | 'form' | 'whatsapp';
  direction: 'inbound' | 'outbound' | 'system';
  sender_type: 'contact' | 'user' | 'system';
  sender_id: number | null;
  sender_name?: string;
  subject: string | null;
  body: string;
  body_html: string | null;
  metadata: Record<string, unknown> | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  read_at: string | null;
  created_at: string;
}

export interface ConversationStats {
  total: number;
  open: number;
  pending: number;
  closed: number;
  unread: number;
  assigned_to_me: number;
}

export interface ConversationsListParams {
  status?: 'open' | 'pending' | 'closed';
  assigned?: 'me' | 'unassigned' | string;
  unread?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}

export const conversationsApi = {
  // List conversations
  async list(params: ConversationsListParams = {}): Promise<{ data: Conversation[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.assigned) searchParams.set('assigned', params.assigned);
    if (params.unread) searchParams.set('unread', 'true');
    if (params.q) searchParams.set('q', params.q);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    const response = await api.get(`/conversations${query ? `?${query}` : ''}`);
    return response;
  },

  // Get single conversation with messages
  async get(id: number): Promise<Conversation> {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  // Get inbox stats
  async getStats(): Promise<ConversationStats> {
    const response = await api.get('/conversations/stats');
    return response.data;
  },

  // Create conversation
  async create(data: { contact_id: number; assigned_user_id?: number }): Promise<{ id: number }> {
    const response = await api.post('/conversations', data);
    return response.data;
  },

  // Get or create conversation for a contact
  async getOrCreateForContact(contactId: number): Promise<{ id: number; created: boolean }> {
    const response = await api.post('/conversations/for-contact', { contact_id: contactId });
    return response.data;
  },

  // Send message
  async sendMessage(conversationId: number, data: {
    channel: 'sms' | 'email' | 'note';
    body: string;
    subject?: string;
    body_html?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const response = await api.post(`/conversations/${conversationId}/messages`, data);
    return response.data;
  },

  // Add internal note
  async addNote(conversationId: number, body: string): Promise<{ id: number }> {
    const response = await api.post(`/conversations/${conversationId}/notes`, { body });
    return response.data;
  },

  // Assign conversation
  async assign(conversationId: number, userId: number | null): Promise<void> {
    await api.post(`/conversations/${conversationId}/assign`, { user_id: userId });
  },

  // Update status
  async updateStatus(conversationId: number, status: 'open' | 'pending' | 'closed'): Promise<void> {
    await api.post(`/conversations/${conversationId}/status`, { status });
  },
};

export default conversationsApi;
