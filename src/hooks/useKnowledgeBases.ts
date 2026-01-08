import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { knowledgeBaseApi, KnowledgeBase } from '@/services/knowledgeBaseApi';

export const useKnowledgeBases = () => {
    return useQuery<KnowledgeBase[]>({
        queryKey: ['knowledge-bases'],
        queryFn: async (): Promise<KnowledgeBase[]> => {
            try {
                const response = await knowledgeBaseApi.getKnowledgeBases();
                // Handle various response formats
                if (response && typeof response === 'object') {
                    // Direct items array
                    if ('items' in response && Array.isArray(response.items)) {
                        return response.items;
                    }
                    // Nested in data
                    if ('data' in response) {
                        const data = (response as any).data;
                        if (data && 'items' in data) {
                            return data.items || [];
                        }
                        if (Array.isArray(data)) {
                            return data;
                        }
                    }
                }
                return [];
            } catch (error) {
                // Return empty array if API endpoint doesn't exist yet
                console.warn('Knowledge base API not available:', error);
                return [];
            }
        },
    });
};

export const useKnowledgeBase = (id: string) => {
    return useQuery({
        queryKey: ['knowledge-base', id],
        queryFn: async () => {
            const response = await knowledgeBaseApi.getKnowledgeBase(id);
            return response.data;
        },
        enabled: !!id,
    });
};

export const useCreateKnowledgeBase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string; type: string }) =>
            knowledgeBaseApi.createKnowledgeBase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
        },
    });
};

export const useUpdateKnowledgeBase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<KnowledgeBase> }) =>
            knowledgeBaseApi.updateKnowledgeBase(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
        },
    });
};

export const useDeleteKnowledgeBase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => knowledgeBaseApi.deleteKnowledgeBase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
        },
    });
};

export const useAddKnowledgeSource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            knowledgeBaseId,
            data,
        }: {
            knowledgeBaseId: string;
            data: {
                source_type: 'document' | 'url' | 'text';
                source_name: string;
                source_url?: string;
                content?: string;
                metadata?: Record<string, unknown>;
            };
        }) => knowledgeBaseApi.addSource(knowledgeBaseId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
        },
    });
};
