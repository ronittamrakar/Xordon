import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, defaultAiSettings, type AiSettings } from '@/lib/api';

export const useAiSettings = () => {
  const query = useQuery<AiSettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      try {
        const settings = await api.getSettings();
        if (settings && settings.ai) {
          return settings.ai as AiSettings;
        }
      } catch (error) {
        console.warn('useAiSettings: Failed to load AI settings, falling back to defaults', error);
      }
      return defaultAiSettings();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const aiSettings = useMemo(() => query.data ?? defaultAiSettings(), [query.data]);

  return {
    aiSettings,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
