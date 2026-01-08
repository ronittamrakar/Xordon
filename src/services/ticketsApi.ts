import { api } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface Ticket {
  id: number;
  workspace_id: number;
  ticket_number: string;
  subject: string;
  title: string;
  description?: string;
  status: 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  stage_id?: number;
  stage_name?: string;
  stage_color?: string;
  team_id?: number;
  team_name?: string;
  ticket_type_id?: number;
  type_name?: string;
  type_icon?: string;
  assigned_user_id?: number;
  assigned_to_name?: string;
  assigned_user_name?: string;
  assigned_user_email?: string;
  contact_id?: number;
  requester_name?: string;
  requester_email?: string;
  requester_phone?: string;
  channel: 'email' | 'webchat' | 'phone' | 'form' | 'api' | 'manual' | 'sms' | 'whatsapp';
  source_channel: 'email' | 'webchat' | 'phone' | 'form' | 'api' | 'manual' | 'sms' | 'whatsapp';
  source_id?: string;
  sla_policy_id?: number;
  first_response_at?: string;
  first_response_due_at?: string;
  resolved_at?: string;
  resolution_due_at?: string;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  tags?: string[];
  custom_fields?: Record<string, any>;
  metadata?: Record<string, any>;
  csat_score?: number;
  csat_comment?: string;
  csat_rated_at?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  created_by?: number;
  message_count?: number;
  unread_count?: number;
  messages?: TicketMessage[];
  activities?: TicketActivity[];
}

export interface TicketMessage {
  id: number;
  workspace_id: number;
  ticket_id: number;
  author_user_id?: number;
  author_contact_id?: number;
  author_name?: string;
  author_email?: string;
  author_user_name?: string;
  author_user_email?: string;
  sender_type: 'customer' | 'agent' | 'system';
  sender_name?: string;
  body: string;
  body_html?: string;
  direction: 'inbound' | 'outbound' | 'internal';
  message_type: 'comment' | 'note' | 'email' | 'sms' | 'call' | 'system';
  is_private: boolean;
  is_internal: boolean;
  from_email?: string;
  to_email?: string;
  cc_email?: string;
  subject?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketActivity {
  id: number;
  workspace_id: number;
  ticket_id: number;
  user_id?: number;
  user_name?: string;
  activity_type: 'created' | 'assigned' | 'status_changed' | 'priority_changed' | 'commented' | 'closed' | 'reopened' | 'tagged' | 'custom_field_changed' | 'merged' | 'split';
  description?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TicketStage {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  stage_type: 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  color: string;
  sequence: number;
  is_closed: boolean;
  fold: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketTeam {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  email_alias?: string;
  is_active: boolean;
  business_hours?: any;
  created_at: string;
  updated_at: string;
}

export interface CannedResponse {
  id: number;
  workspace_id: number;
  name: string;
  shortcut?: string;
  subject?: string;
  body: string;
  body_html?: string;
  category?: string;
  actions?: any[];
  is_shared: boolean;
  created_by?: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface KBArticle {
  id: number;
  workspace_id: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  body: string;
  body_html?: string;
  excerpt?: string;
  category_id?: number;
  category_name?: string;
  tags?: string[];
  is_published: boolean;
  is_internal: boolean;
  sync_to_ai?: boolean;
  meta_title?: string;
  meta_description?: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  author_id?: number;
  author_name?: string;
  author_email?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KBCategory {
  id: number;
  workspace_id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  sequence: number;
  is_published: boolean;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  unassigned: number;
  assigned_to_me: number;
  sla_breached: number;
  avg_resolution_hours: number;
  avg_csat: number;
}

export interface TicketsListParams {
  status?: string;
  priority?: string;
  assigned_to?: string | 'me' | 'unassigned';
  requester_email?: string;
  team_id?: number;
  stage_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// API CLIENT
// ============================================================================

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TICKETS: Ticket[] = [
  {
    id: 101,
    workspace_id: 1,
    ticket_number: 'TCK-1001',
    subject: 'Website widget not loading',
    title: 'Website widget not loading',
    description: 'I embedded the widget but it does not appear on my homepage.',
    status: 'open',
    priority: 'high',
    channel: 'webchat',
    source_channel: 'webchat',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    requester_name: 'John Doe',
    requester_email: 'john@example.com',
    assigned_user_name: 'Support Agent',
    sla_response_breached: false,
    sla_resolution_breached: false,
    message_count: 2
  },
  {
    id: 102,
    workspace_id: 1,
    ticket_number: 'TCK-1002',
    subject: 'Billing inquiry',
    title: 'Billing inquiry regarding invoice #402',
    description: 'Can you please explain the extra charge on my latest invoice?',
    status: 'pending',
    priority: 'medium',
    channel: 'email',
    source_channel: 'email',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    requester_name: 'Jane Smith',
    requester_email: 'jane@company.com',
    assigned_user_name: 'Billing Team',
    sla_response_breached: true,
    sla_resolution_breached: false,
    message_count: 5
  },
  {
    id: 103,
    workspace_id: 1,
    ticket_number: 'TCK-1003',
    subject: 'Feature Request: Dark Mode',
    title: 'Feature Request: Dark Mode',
    description: 'It would be great if the dashboard supported dark mode.',
    status: 'new',
    priority: 'low',
    channel: 'form',
    source_channel: 'form',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    requester_name: 'Mike Brown',
    requester_email: 'mike@startup.io',
    sla_response_breached: false,
    sla_resolution_breached: false,
    message_count: 1
  }
];

export const ticketsApi = {
  // Tickets
  async list(params: TicketsListParams = {}): Promise<Ticket[]> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      const response = await api.get(`/tickets${query.toString() ? `?${query}` : ''}`);
      return (response as any)?.data || (response as unknown as Ticket[]);
    } catch (error) {
      console.warn('Failed to fetch tickets, falling back to mock data', error);
      return MOCK_TICKETS;
    }
  },

  async get(id: number): Promise<Ticket> {
    const response = await api.get(`/tickets/${id}`);
    return (response as any)?.data || (response as unknown as Ticket);
  },

  async getByNumber(ticketNumber: string): Promise<Ticket> {
    const response = await api.get(`/tickets/number/${ticketNumber}`);
    return (response as any)?.data || (response as unknown as Ticket);
  },

  async create(data: Partial<Ticket> & { initial_message?: string }): Promise<{ id: number; ticket_number: string }> {
    const response = await api.post('/tickets', data);
    return response as any;
  },

  async update(id: number, data: Partial<Ticket>): Promise<{ message: string }> {
    const response = await api.put(`/tickets/${id}`, data);
    return response as any;
  },

  async addMessage(ticketId: number, data: Partial<TicketMessage>): Promise<{ id: number }> {
    const response = await api.post(`/tickets/${ticketId}/messages`, data);
    return response as any;
  },

  async stats(): Promise<TicketStats> {
    try {
      const response = await api.get('/tickets/stats');
      return (response as any) as TicketStats;
    } catch (error) {
      console.warn('Failed to fetch ticket stats, using mock data');
      return {
        total: MOCK_TICKETS.length,
        open: MOCK_TICKETS.filter(t => t.status === 'open').length,
        unassigned: MOCK_TICKETS.filter(t => !t.assigned_user_id).length,
        assigned_to_me: 0,
        sla_breached: MOCK_TICKETS.filter(t => t.sla_response_breached || t.sla_resolution_breached).length,
        avg_resolution_hours: 24,
        avg_csat: 4.5,
      };
    }
  },

  // Stages
  async listStages(): Promise<TicketStage[]> {
    try {
      const response = await api.get('/ticket-stages');
      return (Array.isArray(response) ? response : (response as any).data || (response as any).items || []) as TicketStage[];
    } catch (error) {
      console.warn('Failed to fetch ticket stages, using mock data');
      return [
        { id: 1, workspace_id: 1, name: 'New', description: 'Newly created tickets', stage_type: 'new', color: '#3b82f6', sequence: 1, is_closed: false, fold: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, workspace_id: 1, name: 'In Progress', description: 'Being worked on', stage_type: 'in_progress', color: '#f59e0b', sequence: 2, is_closed: false, fold: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, workspace_id: 1, name: 'Resolved', description: 'Issue resolved', stage_type: 'resolved', color: '#10b981', sequence: 3, is_closed: true, fold: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
    }
  },

  // Types
  async listTypes(): Promise<TicketType[]> {
    try {
      const response = await api.get('/ticket-types');
      return (Array.isArray(response) ? response : (response as any).data || (response as any).items || []) as TicketType[];
    } catch (error) {
      console.warn('Failed to fetch ticket types, using mock data');
      return [
        { id: 1, workspace_id: 1, name: 'Bug', description: 'Software bugs', icon: 'bug', color: '#ef4444', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, workspace_id: 1, name: 'Feature Request', description: 'New feature requests', icon: 'lightbulb', color: '#8b5cf6', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, workspace_id: 1, name: 'Support', description: 'General support', icon: 'help-circle', color: '#3b82f6', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
    }
  },

  // Teams
  async listTeams(): Promise<TicketTeam[]> {
    try {
      const response = await api.get('/ticket-teams');
      return (Array.isArray(response) ? response : (response as any).data || (response as any).items || []) as TicketTeam[];
    } catch (error) {
      console.warn('Failed to fetch ticket teams, using mock data');
      return [
        { id: 1, workspace_id: 1, name: 'Support Team', description: 'General customer support', email_alias: 'support@company.com', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, workspace_id: 1, name: 'Billing Team', description: 'Billing and payments', email_alias: 'billing@company.com', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, workspace_id: 1, name: 'Technical Team', description: 'Technical issues', email_alias: 'tech@company.com', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
    }
  },

  async createTicketTeam(data: Partial<TicketTeam>): Promise<{ id: number; message: string }> {
    const response = await api.post('/ticket-teams', data);
    return response as any;
  },

  async updateTicketTeam(id: number, data: Partial<TicketTeam>): Promise<{ message: string }> {
    const response = await api.put(`/ticket-teams/${id}`, data);
    return response as any;
  },

  async deleteTicketTeam(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/ticket-teams/${id}`);
    return response as any;
  },

  // Canned Responses
  async listCannedResponses(params?: { category?: string; search?: string }): Promise<CannedResponse[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    const response = await api.get(`/canned-responses${query.toString() ? `?${query}` : ''}`);
    return (response as any) as CannedResponse[];
  },

  async getCannedResponse(id: number): Promise<CannedResponse> {
    const response = await api.get(`/canned-responses/${id}`);
    return (response as any) as CannedResponse;
  },

  async createCannedResponse(data: Partial<CannedResponse>): Promise<{ id: number }> {
    const response = await api.post('/canned-responses', data);
    return response as any;
  },

  async updateCannedResponse(id: number, data: Partial<CannedResponse>): Promise<{ message: string }> {
    const response = await api.put(`/canned-responses/${id}`, data);
    return response as any;
  },

  async deleteCannedResponse(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/canned-responses/${id}`);
    return response as any;
  },

  // Knowledge Base
  async listKBArticles(params?: { category_id?: number; search?: string; published?: boolean; published_only?: boolean }): Promise<KBArticle[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category_id) query.append('category_id', String(params.category_id));
      if (params?.search) query.append('search', params.search);
      if (params?.published !== undefined) query.append('published', String(params.published));
      if (params?.published_only) query.append('published_only', String(params.published_only));
      const response = await api.get(`/kb/articles${query.toString() ? `?${query}` : ''}`);
      return (Array.isArray(response) ? response : (response as any).items || []) as KBArticle[];
    } catch (error) {
      console.warn('Failed to fetch KB articles, using mock data');
      const now = new Date().toISOString();
      return [
        {
          id: 1,
          workspace_id: 1,
          title: 'How to create a ticket',
          slug: 'how-to-create-a-ticket',
          summary: 'Learn how to create and manage support tickets',
          body: 'Detailed instructions on creating tickets...',
          content: 'Detailed instructions on creating tickets...',
          category_id: 1,
          category_name: 'Getting Started',
          tags: ['tickets', 'basics'],
          is_published: true,
          is_internal: false,
          view_count: 150,
          helpful_count: 25,
          not_helpful_count: 3,
          author_id: 1,
          author_name: 'Admin',
          created_at: now,
          updated_at: now
        },
        {
          id: 2,
          workspace_id: 1,
          title: 'Using the Chat Widget',
          slug: 'using-chat-widget',
          summary: 'Everything you need to know about the native chat widget',
          body: 'The chat widget allows you to...',
          content: 'The chat widget allows you to...',
          category_id: 2,
          category_name: 'User Guide',
          tags: ['chat', 'widget'],
          is_published: true,
          is_internal: false,
          view_count: 85,
          helpful_count: 12,
          not_helpful_count: 1,
          author_id: 1,
          author_name: 'Admin',
          created_at: now,
          updated_at: now
        },
      ];
    }
  },

  async getKBArticle(slugOrId: string | number): Promise<KBArticle> {
    try {
      const response = await api.get(`/kb/articles/${slugOrId}`);
      return (response as any) as KBArticle;
    } catch (error) {
      console.warn('Failed to fetch KB article, using mock data');
      const now = new Date().toISOString();
      return {
        id: 1,
        workspace_id: 1,
        title: 'How to create a ticket',
        slug: 'how-to-create-a-ticket',
        summary: 'Learn how to create and manage support tickets',
        body: 'Detailed instructions on creating tickets...',
        content: 'Detailed instructions on creating tickets via the dashboard or email. <br/><br/> 1. Navigate to the Tickets page <br/> 2. Click "New Ticket" <br/> 3. Fill in the details and save.',
        category_id: 1,
        category_name: 'Getting Started',
        tags: ['tickets', 'basics'],
        is_published: true,
        is_internal: false,
        view_count: 150,
        helpful_count: 25,
        not_helpful_count: 2,
        author_id: 1,
        author_name: 'Admin',
        created_at: now,
        updated_at: now
      };
    }
  },

  async createKBArticle(data: Partial<KBArticle>): Promise<{ id: number; slug: string }> {
    const response = await api.post('/kb/articles', data);
    return response as any;
  },

  async updateKBArticle(id: number, data: Partial<KBArticle>): Promise<{ message: string }> {
    const response = await api.put(`/kb/articles/${id}`, data);
    return response as any;
  },

  async deleteKBArticle(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/kb/articles/${id}`);
    return response as any;
  },

  async listKBCategories(): Promise<KBCategory[]> {
    try {
      const response = await api.get('/kb/categories');
      return (Array.isArray(response) ? response : (response as any).items || []) as KBCategory[];
    } catch (error) {
      console.warn('Failed to fetch KB categories, using mock data');
      const now = new Date().toISOString();
      return [
        { id: 1, workspace_id: 1, name: 'Getting Started', slug: 'getting-started', description: 'Basic setup and platform overview', icon: 'zap', sequence: 1, is_published: true, article_count: 5, created_at: now, updated_at: now },
        { id: 2, workspace_id: 1, name: 'User Guide', slug: 'user-guide', description: 'Detailed guides for all platform features', icon: 'book', sequence: 2, is_published: true, article_count: 12, created_at: now, updated_at: now },
        { id: 3, workspace_id: 1, name: 'Billing', slug: 'billing', description: 'Invoices, plans, and payment methods', icon: 'credit-card', sequence: 3, is_published: true, article_count: 3, created_at: now, updated_at: now },
      ];
    }
  },

  async createKBCategory(data: Partial<KBCategory>): Promise<{ id: number; slug: string }> {
    const response = await api.post('/kb/categories', data);
    return response as any;
  },

  async updateKBCategory(id: number, data: Partial<KBCategory>): Promise<{ message: string }> {
    const response = await api.put(`/kb/categories/${id}`, data);
    return response as any;
  },

  async deleteKBCategory(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/kb/categories/${id}`);
    return response as any;
  },

};

export default ticketsApi;
