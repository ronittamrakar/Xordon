import api from '@/lib/api';

export interface AISettings {
    id: number;
    workspace_id: number;
    chatbot_enabled: boolean;
    chatbot_name: string;
    chatbot_greeting: string;
    chatbot_model: string;
    call_answering_enabled: boolean;
    call_answering_hours: Record<string, any> | null;
    call_hours_start?: string;
    call_hours_end?: string;
    call_timezone?: string;
    conversation_booking_enabled: boolean;
    analytics_insights_enabled: boolean;
    facebook_messenger_enabled: boolean;
    auto_response_delay: number;
    escalation_keywords: string[] | null;
    business_context: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChatbotConfig {
    name: string;
    greeting: string;
    model: string;
    auto_response_delay: number;
    escalation_keywords: string[];
    business_context: string | null;
}

export const aiSettingsApi = {
    // Get AI settings for current workspace
    getSettings: async (): Promise<AISettings> => {
        const response = await api.get<AISettings>('/ai/settings');
        return (response as any).data;
    },

    // Update AI settings
    updateSettings: async (settings: Partial<AISettings>): Promise<AISettings> => {
        const response = await api.put<any>('/ai/settings', settings);
        return response.data;
    },

    // Check if a specific feature is enabled
    checkFeature: async (feature: string): Promise<{ feature: string; enabled: boolean }> => {
        const response = await api.get<any>(`/ai/settings/feature/${feature}`);
        return response.data;
    },

    // Get chatbot configuration
    getChatbotConfig: async (): Promise<ChatbotConfig> => {
        const response = await api.get<any>('/ai/chatbot/config');
        return response.data;
    },
};
