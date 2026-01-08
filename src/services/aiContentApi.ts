import api from '@/lib/api';

export type AiGeneratePayload = {
    channel: string;
    action?: string;
    prompt?: string;
    context?: unknown;
    provider?: string;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    messages?: any[];
};

export type AiGenerateResult = {
    provider: string;
    model: string;
    output: string;
    usage?: Record<string, unknown> | null;
    raw?: Record<string, unknown>;
};

export const aiContentApi = {
    // Generate content (text, image, etc.)
    async generateAiContent(payload: AiGeneratePayload): Promise<AiGenerateResult> {
        try {
            const response = await api.post<AiGenerateResult>('/ai/content/generate', payload);
            return response;
        } catch (error) {
            console.error('AI Content Generation Failed:', error);
            throw error;
        }
    }
};
