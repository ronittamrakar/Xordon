export interface LoyaltyProgram {
    id?: number;
    name: string;
    description?: string;
    points_to_currency_ratio: number;
    signup_bonus: number;
    birthday_bonus: number;
    is_active: boolean;
}

export interface LoyaltyStats {
    total_earned: number;
    total_redeemed: number;
    enrolled_customers: number;
}

export interface LoyaltyReward {
    id: number;
    name: string;
    description: string;
    points_cost: number;
    reward_type: 'discount_fixed' | 'discount_percent' | 'free_product' | 'gift_card';
    reward_value: number;
    is_active: boolean;
}

export interface LoyaltyTransaction {
    id: number;
    contact_id: string;
    type: 'earn' | 'redeem' | 'bonus' | 'adjustment';
    points: number;
    description: string;
    created_at: string;
}

export const loyaltyApi = {
    getProgram: async (): Promise<LoyaltyProgram> => {
        const response = await fetch('/api/marketing/loyalty/program', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    updateProgram: async (data: Partial<LoyaltyProgram>): Promise<{ success: boolean }> => {
        const response = await fetch('/api/marketing/loyalty/program', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    getStats: async (): Promise<LoyaltyStats> => {
        const response = await fetch('/api/marketing/loyalty/stats', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    getRewards: async (): Promise<LoyaltyReward[]> => {
        const response = await fetch('/api/marketing/loyalty/rewards', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    adjustPoints: async (data: { contact_id: string; points: number; type: string; description?: string }): Promise<{ success: boolean }> => {
        const response = await fetch('/api/marketing/loyalty/adjust', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    createReward: async (data: Partial<LoyaltyReward>): Promise<{ success: boolean }> => {
        const response = await fetch('/api/marketing/loyalty/rewards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    updateReward: async (id: number, data: Partial<LoyaltyReward>): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/loyalty/rewards/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    deleteReward: async (id: number): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/loyalty/rewards/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    getTransactions: async (contactId?: string): Promise<LoyaltyTransaction[]> => {
        const url = contactId ? `/api/marketing/loyalty/transactions?contact_id=${contactId}` : '/api/marketing/loyalty/transactions';
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    searchContacts: async (query: string): Promise<any[]> => {
        const response = await fetch(`/api/contacts?search=${encodeURIComponent(query)}&limit=5`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const data = await response.json();
        return data.contacts || [];
    }
};
