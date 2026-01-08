import api from '@/lib/api';

export type KnowledgeBase = {
    id: string;
    name: string;
    description?: string;
    sources: number;
    lastUpdated: string;
    status: 'active' | 'inactive';
    type: 'Documents' | 'URLs' | 'Text';
    created_at?: string;
    updated_at?: string;
};

export type KnowledgeSource = {
    id: string;
    knowledge_base_id: string;
    source_type: 'document' | 'url' | 'text';
    source_name: string;
    source_url?: string;
    content?: string;
    metadata?: Record<string, unknown>;
    status: 'processing' | 'indexed' | 'failed';
    created_at: string;
    updated_at: string;
};

export const knowledgeBaseApi = {
    // Get all knowledge bases
    async getKnowledgeBases() {
        const response = await api.get<{ items: KnowledgeBase[] }>('/ai/knowledge-bases');
        return response;
    },

    // Get a single knowledge base
    async getKnowledgeBase(id: string) {
        const response = await api.get<{ data: KnowledgeBase }>(`/ai/knowledge-bases/${id}`);
        return response;
    },

    // Create a new knowledge base
    async createKnowledgeBase(data: { name: string; description?: string; type: string }) {
        const response = await api.post<{ id: string }>('/ai/knowledge-bases', data);
        return response;
    },

    // Update a knowledge base
    async updateKnowledgeBase(id: string, data: Partial<KnowledgeBase>) {
        const response = await api.put<{ success: boolean }>(`/ai/knowledge-bases/${id}`, data);
        return response;
    },

    // Delete a knowledge base
    async deleteKnowledgeBase(id: string) {
        const response = await api.delete<{ success: boolean }>(`/ai/knowledge-bases/${id}`);
        return response;
    },

    // Get sources for a knowledge base
    async getSources(knowledgeBaseId: string) {
        const response = await api.get<{ items: KnowledgeSource[] }>(`/ai/knowledge-bases/${knowledgeBaseId}/sources`);
        return response;
    },

    // Add a source to a knowledge base
    async addSource(knowledgeBaseId: string, data: {
        source_type: 'document' | 'url' | 'text';
        source_name: string;
        source_url?: string;
        content?: string;
        metadata?: Record<string, unknown>;
    }) {
        const response = await api.post<{ id: string }>(`/ai/knowledge-bases/${knowledgeBaseId}/sources`, data);
        return response;
    },

    // Delete a source
    async deleteSource(knowledgeBaseId: string, sourceId: string) {
        const response = await api.delete<{ success: boolean }>(`/ai/knowledge-bases/${knowledgeBaseId}/sources/${sourceId}`);
        return response;
    },
};
