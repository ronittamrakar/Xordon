import api from '@/lib/api';

export interface InstagramAccount {
    id: number;
    workspace_id: number;
    company_id: number | null;
    instagram_id: string;
    username: string;
    access_token: string;
    profile_picture_url: string | null;
    followers_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface InstagramConversation {
    id: string;
    participants: Array<{
        id: string;
        username?: string;
        name?: string;
    }>;
    messages: InstagramMessage[];
    updated_time: string;
}

export interface InstagramMessage {
    id: string;
    from: {
        id: string;
        username?: string;
    };
    to: {
        id: string;
    };
    message: string;
    created_time: string;
}

export interface SendInstagramMessageRequest {
    account_id: number;
    recipient_id: string;
    message: string;
    media_url?: string;
}

export const instagramApi = {
    // Connect Instagram account
    connectAccount: async (data: {
        instagram_id: string;
        username: string;
        access_token: string;
    }) => {
        const res = await api.post<{ success: boolean; message: string; account: any }>('/instagram/connect', data);
        return res.data;
    },

    // List connected Instagram accounts
    listAccounts: async () => {
        const res = await api.get<{ success: boolean; data: InstagramAccount[] }>('/instagram/accounts');
        return res.data.data;
    },

    // Disconnect Instagram account
    disconnectAccount: async (accountId: number) => {
        const res = await api.delete<{ success: boolean; message: string }>(`/instagram/accounts/${accountId}`);
        return res.data;
    },

    // Get Instagram conversations
    getConversations: async (accountId: number) => {
        const res = await api.get<{ success: boolean; data: InstagramConversation[] }>('/instagram/conversations', {
            params: { account_id: accountId }
        });
        return res.data.data;
    },

    // Send Instagram DM
    sendMessage: async (data: SendInstagramMessageRequest) => {
        const res = await api.post<{ success: boolean; message: string; message_id?: string }>('/instagram/send', data);
        return res.data;
    },
};

export default instagramApi;
