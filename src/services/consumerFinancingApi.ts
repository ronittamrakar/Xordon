

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);


export interface FinancingProvider {
    id: string;
    name: string;
    logo: string;
    enabled: boolean;
    minAmount: number;
    maxAmount: number;
    terms: string[];
    apr: string;
}

export interface FinancingApplication {
    id: string;
    contactId: string;
    contactName: string;
    provider: string;
    amount: number;
    term: number;
    status: 'pending' | 'approved' | 'declined' | 'completed';
    createdAt: string;
    approvedAt?: string;
    declinedAt?: string;
}

// Mock data
let providers: FinancingProvider[] = [
    {
        id: '1',
        name: 'Affirm',
        logo: '💳',
        enabled: true,
        minAmount: 50,
        maxAmount: 30000,
        terms: ['3', '6', '12', '18', '24'],
        apr: '0-30%'
    },
    {
        id: '2',
        name: 'Klarna',
        logo: '🛍️',
        enabled: true,
        minAmount: 35,
        maxAmount: 10000,
        terms: ['4', '6', '12', '24', '36'],
        apr: '0-29.99%'
    },
    {
        id: '3',
        name: 'Afterpay',
        logo: '💰',
        enabled: false,
        minAmount: 1,
        maxAmount: 2000,
        terms: ['4'],
        apr: '0%'
    }
];

let applications: FinancingApplication[] = [
    {
        id: '1',
        contactId: '101',
        contactName: 'John Doe',
        provider: 'Affirm',
        amount: 5000,
        term: 12,
        status: 'approved',
        createdAt: '2024-01-15T10:30:00Z',
        approvedAt: '2024-01-15T11:00:00Z'
    },
    {
        id: '2',
        contactId: '102',
        contactName: 'Jane Smith',
        provider: 'Klarna',
        amount: 3500,
        term: 6,
        status: 'pending',
        createdAt: '2024-01-16T14:20:00Z'
    }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const consumerFinancingApi = {
    getProviders: async (): Promise<FinancingProvider[]> => {
        await delay(500);
        return [...providers];
    },

    updateProvider: async (id: string, updates: Partial<FinancingProvider>): Promise<FinancingProvider> => {
        await delay(300);
        const index = providers.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Provider not found');
        providers[index] = { ...providers[index], ...updates };
        return providers[index];
    },

    getApplications: async (): Promise<FinancingApplication[]> => {
        await delay(500);
        return [...applications];
    },

    createApplication: async (data: Omit<FinancingApplication, 'id' | 'createdAt' | 'status'>): Promise<FinancingApplication> => {
        await delay(500);
        const newApp: FinancingApplication = {
            id: generateId(),
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        applications = [newApp, ...applications];
        return newApp;
    },

    approveApplication: async (id: string): Promise<FinancingApplication> => {
        await delay(500);
        const index = applications.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Application not found');
        applications[index] = {
            ...applications[index],
            status: 'approved',
            approvedAt: new Date().toISOString()
        };
        return applications[index];
    },

    declineApplication: async (id: string): Promise<FinancingApplication> => {
        await delay(500);
        const index = applications.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Application not found');
        applications[index] = {
            ...applications[index],
            status: 'declined',
            declinedAt: new Date().toISOString()
        };
        return applications[index];
    }
};
