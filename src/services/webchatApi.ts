import { api } from '@/lib/api';

export interface WebchatWidget {
  id: number;
  workspace_id: number;
  company_id?: number;
  name: string;
  widget_key: string;
  is_active: boolean;
  theme_color: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  greeting_message?: string;
  offline_message?: string;
  auto_open: boolean;
  auto_open_delay: number;
  show_agent_avatars: boolean;
  enable_file_uploads: boolean;
  enable_emojis: boolean;
  assigned_user_id?: number;
  assigned_team_id?: number;
  business_hours_only: boolean;
  domains_whitelist?: string;
  created_at: string;
  updated_at: string;
}

export interface WebchatSession {
  id: number;
  widget_id: number;
  conversation_id?: number;
  session_key: string;
  visitor_id?: string;
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  current_page?: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}

const webchatApi = {
  // Widget management
  listWidgets: async (): Promise<WebchatWidget[]> => {
    const response = await api.get('/webchat/widgets');
    return response.data;
  },

  createWidget: async (data: Partial<WebchatWidget>): Promise<WebchatWidget> => {
    const response = await api.post('/webchat/widgets', data);
    return response.data;
  },

  getWidget: async (id: number): Promise<WebchatWidget> => {
    const response = await api.get(`/webchat/widgets/${id}`);
    return response.data;
  },

  updateWidget: async (id: number, data: Partial<WebchatWidget>): Promise<WebchatWidget> => {
    const response = await api.put(`/webchat/widgets/${id}`, data);
    return response.data;
  },

  // Public endpoints (no auth)
  initSession: async (widgetKey: string, visitorData?: any): Promise<any> => {
    const response = await fetch('/api/webchat/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget_key: widgetKey, ...visitorData })
    });
    return response.json();
  },

  sendMessage: async (sessionKey: string, message: string): Promise<any> => {
    const response = await fetch('/api/webchat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_key: sessionKey, message })
    });
    return response.json();
  },

  // Generate embed code
  getEmbedCode: (widgetKey: string): string => {
    return `<script>
  (function(w,d,s,o,f,js,fjs){
    w['XordonWebchat']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','xw','https://cdn.xordon.com/webchat.js'));
  xw('init', { widgetKey: '${widgetKey}' });
</script>`;
  }
};

export default webchatApi;
