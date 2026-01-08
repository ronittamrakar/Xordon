import api, { AiAgentTemplate } from '@/lib/api';

export const aiTemplatesApi = {
    // Get all AI templates
    async getAiTemplates(): Promise<AiAgentTemplate[]> {
        const response = await api.get<{ items: AiAgentTemplate[] }>('/ai/templates');
        if (Array.isArray(response)) return response;
        return (response as any).items || [];
    },

    // Get a specific template
    async getAiTemplate(id: string): Promise<AiAgentTemplate> {
        const response = await api.get<{ data: AiAgentTemplate }>(`/ai/templates/${id}`);
        return (response as any).data || response;
    },

    // Use a template to create an agent
    async useAiTemplate(id: string, data: { name?: string }): Promise<{ id: string; message: string }> {
        const response = await api.post<{ id: string; message: string }>(`/ai/templates/${id}/use`, data);
        return response;
    }
};
