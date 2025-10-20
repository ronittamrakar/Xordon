// Mock data management for campaigns, recipients, and analytics

export interface SendingAccount {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'smtp';
  status: 'active' | 'inactive';
  dailyLimit: number;
  sentToday: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  sendingAccountId: string;
  createdAt: string;
  scheduledAt?: string;
  totalRecipients: number;
  sent: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
}

export interface Recipient {
  id: string;
  campaignId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export interface AnalyticsData {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalUnsubscribes: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  dailyStats: Array<{
    date: string;
    sent: number;
    opens: number;
    clicks: number;
  }>;
}

const STORAGE_KEYS = {
  SENDING_ACCOUNTS: 'sendingAccounts',
  CAMPAIGNS: 'campaigns',
  RECIPIENTS: 'recipients',
};

export const mockData = {
  // Sending Accounts
  getSendingAccounts: (): SendingAccount[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SENDING_ACCOUNTS) || '[]');
  },

  addSendingAccount: (account: Omit<SendingAccount, 'id' | 'sentToday'>): SendingAccount => {
    const accounts = mockData.getSendingAccounts();
    const newAccount: SendingAccount = {
      ...account,
      id: crypto.randomUUID(),
      sentToday: 0,
    };
    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEYS.SENDING_ACCOUNTS, JSON.stringify(accounts));
    return newAccount;
  },

  updateSendingAccount: (id: string, updates: Partial<SendingAccount>): void => {
    const accounts = mockData.getSendingAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.SENDING_ACCOUNTS, JSON.stringify(accounts));
    }
  },

  deleteSendingAccount: (id: string): void => {
    const accounts = mockData.getSendingAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.SENDING_ACCOUNTS, JSON.stringify(filtered));
  },

  // Campaigns
  getCampaigns: (): Campaign[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPAIGNS) || '[]');
  },

  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'sent' | 'opens' | 'clicks' | 'bounces' | 'unsubscribes'>): Campaign => {
    const campaigns = mockData.getCampaigns();
    const newCampaign: Campaign = {
      ...campaign,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sent: 0,
      opens: 0,
      clicks: 0,
      bounces: 0,
      unsubscribes: 0,
    };
    campaigns.push(newCampaign);
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    return newCampaign;
  },

  updateCampaign: (id: string, updates: Partial<Campaign>): void => {
    const campaigns = mockData.getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index] = { ...campaigns[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    }
  },

  deleteCampaign: (id: string): void => {
    const campaigns = mockData.getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(filtered));
    
    // Also delete associated recipients
    const recipients = mockData.getRecipients();
    const filteredRecipients = recipients.filter(r => r.campaignId !== id);
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(filteredRecipients));
  },

  // Recipients
  getRecipients: (campaignId?: string): Recipient[] => {
    const recipients = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPIENTS) || '[]');
    return campaignId ? recipients.filter((r: Recipient) => r.campaignId === campaignId) : recipients;
  },

  addRecipients: (recipients: Omit<Recipient, 'id' | 'status'>[]): Recipient[] => {
    const existing = mockData.getRecipients();
    const newRecipients: Recipient[] = recipients.map(r => ({
      ...r,
      id: crypto.randomUUID(),
      status: 'pending',
    }));
    existing.push(...newRecipients);
    localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(existing));
    return newRecipients;
  },

  updateRecipient: (id: string, updates: Partial<Recipient>): void => {
    const recipients = mockData.getRecipients();
    const index = recipients.findIndex(r => r.id === id);
    if (index !== -1) {
      recipients[index] = { ...recipients[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.RECIPIENTS, JSON.stringify(recipients));
    }
  },

  // Analytics
  getAnalytics: (campaignId?: string): AnalyticsData => {
    const campaigns = campaignId 
      ? mockData.getCampaigns().filter(c => c.id === campaignId)
      : mockData.getCampaigns();

    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + c.opens, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalBounces = campaigns.reduce((sum, c) => sum + c.bounces, 0);
    const totalUnsubscribes = campaigns.reduce((sum, c) => sum + c.unsubscribes, 0);

    // Generate mock daily stats for the last 7 days
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        sent: Math.floor(totalSent / 7) + Math.floor(Math.random() * 50),
        opens: Math.floor(totalOpens / 7) + Math.floor(Math.random() * 20),
        clicks: Math.floor(totalClicks / 7) + Math.floor(Math.random() * 10),
      };
    });

    return {
      totalSent,
      totalOpens,
      totalClicks,
      totalBounces,
      totalUnsubscribes,
      openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounces / totalSent) * 100 : 0,
      dailyStats,
    };
  },

  // Simulate sending campaign
  simulateSend: (campaignId: string): void => {
    const campaign = mockData.getCampaigns().find(c => c.id === campaignId);
    if (!campaign) return;

    const recipients = mockData.getRecipients(campaignId);
    const pendingRecipients = recipients.filter(r => r.status === 'pending');

    // Simulate sending to all pending recipients
    pendingRecipients.forEach(recipient => {
      mockData.updateRecipient(recipient.id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
      });

      // Simulate some opens and clicks
      if (Math.random() > 0.4) {
        setTimeout(() => {
          mockData.updateRecipient(recipient.id, {
            status: 'opened',
            openedAt: new Date().toISOString(),
          });

          if (Math.random() > 0.7) {
            setTimeout(() => {
              mockData.updateRecipient(recipient.id, {
                status: 'clicked',
                clickedAt: new Date().toISOString(),
              });
            }, 1000);
          }
        }, 500);
      }
    });

    // Update campaign stats
    mockData.updateCampaign(campaignId, {
      status: 'completed',
      sent: campaign.totalRecipients,
      opens: Math.floor(campaign.totalRecipients * 0.6),
      clicks: Math.floor(campaign.totalRecipients * 0.2),
      bounces: Math.floor(campaign.totalRecipients * 0.02),
    });
  },
};
