import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiAgentsApi, AiAgent } from '@/services/aiAgentsApi';

export const useAiAgents = () => {
  return useQuery<AiAgent[]>({
    queryKey: ['ai-agents'],
    queryFn: async () => await aiAgentsApi.getAiAgents(),
  });
};

export const useCreateAiAgent = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { name: string; type?: string; config?: Record<string, unknown> }>({
    mutationFn: (payload) => aiAgentsApi.createAiAgent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-agents'] }),
  });
};

export const useUpdateAiAgent = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => aiAgentsApi.updateAiAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-agents'] }),
  });
};

export const useDeleteAiAgent = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => aiAgentsApi.deleteAiAgent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-agents'] }),
  });
};
