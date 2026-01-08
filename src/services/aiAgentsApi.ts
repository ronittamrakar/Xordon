import api from '@/lib/api';

export type AiAgent = {
    id: string;
    user_id: string;
    name: string;
    type: string; // e.g. 'chat' | 'voice'
    config?: Record<string, unknown> | null;
    status?: string;
    created_at?: string;
    updated_at?: string;
};

export const aiAgentsApi = {
    // Get all AI agents
    async getAiAgents() {
        // Fallback to empty array if endpoint doesn't exist yet/404s
        try {
            const response = await api.get<{ text: string }>('/ai/agents');
            // Check if response is the items array directly or wrapped
            if (Array.isArray(response)) return response;
            if ((response as any).items) return (response as any).items;
            return [];
        } catch (error) {
            console.warn('Failed to fetch AI agents:', error);
            return [];
        }
    },

    // Create a new AI agent
    async createAiAgent(data: { name: string; type?: string; config?: Record<string, unknown> }) {
        const response = await api.post<{ id: string }>('/ai/agents', data);
        return response;
    },

    // Update an AI agent
    async updateAiAgent(id: string, data: Record<string, unknown>) {
        const response = await api.put<{ success: boolean }>(`/ai/agents/${id}`, data);
        return response;
    },

    // Delete an AI agent
    async deleteAiAgent(id: string) {
        const response = await api.delete<{ success: boolean }>(`/ai/agents/${id}`);
        return response;
    },

    // Get a single AI agent
    async getAiAgent(id: string) {
        const response = await api.get<{ data: AiAgent }>(`/ai/agents/${id}`);
        return response;
    }
};
