import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiWorkforceApi } from '@/services/aiWorkforceApi';
import type { AiEmployee, AiWorkHistory, AiApproval, AiPerformanceMetric, AiHierarchyNode, AiWorkflow } from '@/lib/api';

/**
 * Hook for managing AI Employees
 */
export const useAiEmployees = () => {
    return useQuery<AiEmployee[]>({
        queryKey: ['ai-employees'],
        queryFn: () => aiWorkforceApi.getAiEmployees(),
    });
};

export const useAiEmployee = (id: string) => {
    return useQuery<AiEmployee>({
        queryKey: ['ai-employees', id],
        queryFn: () => aiWorkforceApi.getAiEmployee(id),
        enabled: !!id,
    });
};

export const useCreateAiEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<AiEmployee>) => aiWorkforceApi.createAiEmployee(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-employees'] });
            queryClient.invalidateQueries({ queryKey: ['ai-hierarchy'] });
        },
    });
};

export const useUpdateAiEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AiEmployee> }) =>
            aiWorkforceApi.updateAiEmployee(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['ai-employees'] });
            queryClient.invalidateQueries({ queryKey: ['ai-employees', id] });
            queryClient.invalidateQueries({ queryKey: ['ai-hierarchy'] });
        },
    });
};

export const useDeleteAiEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => aiWorkforceApi.deleteAiEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-employees'] });
            queryClient.invalidateQueries({ queryKey: ['ai-hierarchy'] });
        },
    });
};

/**
 * Hook for AI Work History
 */
export const useAiWorkHistory = (params?: { employee_id?: string; limit?: number; offset?: number }) => {
    return useQuery<AiWorkHistory[]>({
        queryKey: ['ai-work-history', params],
        queryFn: () => aiWorkforceApi.getAiWorkHistory(params),
    });
};

/**
 * Hook for AI Approvals
 */
export const useAiApprovals = (status: string = 'pending') => {
    return useQuery<AiApproval[]>({
        queryKey: ['ai-approvals', status],
        queryFn: () => aiWorkforceApi.getAiApprovals(status),
        refetchInterval: 10000, // Poll every 10 seconds for new approvals
    });
};

export const useDecideAiApproval = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, decision, reason }: { id: string; decision: 'approve' | 'reject'; reason?: string }) =>
            aiWorkforceApi.decideAiApproval(id, decision, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['ai-work-history'] });
        },
    });
};

/**
 * Hook for AI Performance Metrics
 */
export const useAiPerformanceMetrics = (params?: { employee_id?: string; start_date?: string; end_date?: string }) => {
    return useQuery<AiPerformanceMetric[]>({
        queryKey: ['ai-performance-metrics', params],
        queryFn: () => aiWorkforceApi.getAiPerformanceMetrics(params),
    });
};

/**
 * Hook for AI Workforce Hierarchy
 */
export const useAiWorkforceHierarchy = () => {
    return useQuery<AiHierarchyNode[]>({
        queryKey: ['ai-hierarchy'],
        queryFn: () => aiWorkforceApi.getAiWorkforceHierarchy(),
    });
};

/**
 * Hooks for AI Workflows
 */
export const useAiWorkflows = () => {
    return useQuery<AiWorkflow[]>({
        queryKey: ['ai-workflows'],
        queryFn: () => aiWorkforceApi.getAiWorkflows(),
    });
};

export const useCreateAiWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<AiWorkflow>) => aiWorkforceApi.createAiWorkflow(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-workflows'] });
        },
    });
};

export const useDeleteAiWorkflow = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => aiWorkforceApi.deleteAiWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-workflows'] });
        },
    });
};

export const useExecuteAiWorkflow = () => {
    return useMutation({
        mutationFn: (id: string) => aiWorkforceApi.executeAiWorkflow(id),
    });
};
