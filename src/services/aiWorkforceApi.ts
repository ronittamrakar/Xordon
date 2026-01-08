import api from '@/lib/api';
import type {
    AiEmployee,
    AiWorkHistory,
    AiApproval,
    AiPerformanceMetric,
    AiHierarchyNode,
    AiWorkflow
} from '@/lib/api';

export const aiWorkforceApi = {
    // AI Employees
    async getAiEmployees(): Promise<AiEmployee[]> {
        return await api.getAiEmployees();
    },

    async getAiEmployee(id: string): Promise<AiEmployee> {
        return await api.getAiEmployee(id);
    },

    async createAiEmployee(data: Partial<AiEmployee>) {
        return await api.createAiEmployee(data);
    },

    async updateAiEmployee(id: string, data: Partial<AiEmployee>) {
        return await api.updateAiEmployee(id, data);
    },

    async deleteAiEmployee(id: string) {
        return await api.deleteAiEmployee(id);
    },

    // Work History
    async getAiWorkHistory(params?: { employee_id?: string; limit?: number; offset?: number }): Promise<AiWorkHistory[]> {
        return await api.getAiWorkHistory(params);
    },

    async logAiWorkAction(data: Partial<AiWorkHistory>) {
        return await api.logAiWorkAction(data);
    },

    // Approvals Queue
    async getAiApprovals(status: string = 'pending'): Promise<AiApproval[]> {
        return await api.getAiApprovals(status);
    },

    async decideAiApproval(id: string, decision: 'approve' | 'reject', rejection_reason?: string) {
        return await api.decideAiApproval(id, decision, rejection_reason);
    },

    // Performance Metrics
    async getAiPerformanceMetrics(params?: { employee_id?: string; start_date?: string; end_date?: string }): Promise<AiPerformanceMetric[]> {
        return await api.getAiPerformanceMetrics(params);
    },

    // Organizational Hierarchy
    async getAiWorkforceHierarchy(): Promise<AiHierarchyNode[]> {
        return await api.getAiWorkforceHierarchy();
    },

    // AI Workflows
    async getAiWorkflows(): Promise<AiWorkflow[]> {
        return await api.getAiWorkflows();
    },

    async createAiWorkflow(data: Partial<AiWorkflow>) {
        return await api.createAiWorkflow(data);
    },

    async deleteAiWorkflow(id: string) {
        return await api.deleteAiWorkflow(id);
    },

    async executeAiWorkflow(id: string) {
        return await api.executeAiWorkflow(id);
    }
};
