import { api } from './api';

import { createLogger } from '@/utils/logger';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const logger = createLogger('sms-api');

export interface SMSSendingAccount {
  id: string;
  name: string;
  type: 'signalwire' | 'twilio' | 'nexmo';
  phone_number: string;
  status: 'active' | 'inactive';
  provider_config: Record<string, unknown>;
}

export interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  category: string;
  description?: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface SMSRecipient {
  id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  tags?: string[];
  group_id?: string;
  group_name?: string;
  status: 'active' | 'unsubscribed';
  created_at: string;
  updated_at: string;
}

export interface SMSCampaign {
  id: string;
  user_id: string;
  group_id?: string;
  name: string;
  description: string;
  message: string;
  sender_id: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  recipient_method: 'all' | 'tags' | 'groups' | 'manual';
  recipient_tags?: string | string[];
  recipient_groups?: string | string[];
  scheduled_at?: string;
  throttle_rate: number;
  throttle_unit: 'minute' | 'hour' | 'day';
  enable_retry: number | boolean;
  retry_attempts: number;
  respect_quiet_hours: number | boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
  sequence_id?: string;
  recipient_count: number;
  reply_count: number;
  follow_up_messages?: FollowUpMessage[];
  timezone?: string;
}

export interface FollowUpMessage {
  id: string;
  delay_days: number;
  delay_hours: number;
  message: string;
  condition: 'no_reply' | 'always';
}

export interface SMSSettings {
  signalwireProjectId: string;
  signalwireSpaceUrl: string;
  signalwireApiToken: string;
  defaultSenderNumber: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  retryAttempts: number;
  retryDelay: number;
  unsubscribeKeywords: string[];
  averageDelay: number;
  sendingPriority: string;
  timezone: string;
  enableQuietHours: boolean;
  enableRetries: boolean;
}

export interface SMSAnalytics {
  totalCampaigns: number;
  totalRecipients: number;
  totalMessagesSent: number;
  totalReplies: number;
  deliveryRate: number;
  replyRate: number;
  dailyVolume: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    replies: number;
  }>;
}

export interface SMSReply {
  id: string;
  campaign_id?: string;
  recipient_id?: string;
  phone_number: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  received_at: string;
  is_starred: boolean;
}

class SMSAPI {
  private baseUrl = API_URL;

  private getToken() {
    return localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
  }

  private getHeaders() {
    const token = this.getToken();
    const tenantId = localStorage.getItem('tenant_id');
    const activeClientId = localStorage.getItem('active_client_id');

    return {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      ...(tenantId ? { 'X-Workspace-Id': tenantId } : {}),
      ...(activeClientId ? { 'X-Client-Id': activeClientId, 'X-Company-Id': activeClientId } : {}),
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }
    return response.json();
  }



  // Sending Accounts
  // Get SMS accounts (sending accounts) - wrapper for frontend compatibility
  async getSMSAccounts(): Promise<{ accounts: SMSSendingAccount[] }> {
    try {
      const accounts = await this.getSendingAccounts();
      return { accounts };
    } catch (error) {
      logger.warn('Failed to fetch SMS accounts:', error);
      return { accounts: [] };
    }
  }

  async getSendingAccounts(): Promise<SMSSendingAccount[]> {
    try {
      const accountsUrl = `${API_URL}/sms-accounts`;
      const response = await fetch(accountsUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.accounts || data || [];
    } catch (error) {
      logger.error('Error fetching SMS accounts:', error);
      throw error;
    }
  }

  async getAvailableNumbers(): Promise<SMSSendingAccount[]> {
    try {
      const accountsUrl = `${API_URL}/sms-accounts`;
      const response = await fetch(accountsUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.accounts || [];
    } catch (error) {
      logger.error('Error fetching available numbers:', error);
      throw error;
    }
  }

  async createSendingAccount(account: Partial<SMSSendingAccount>): Promise<SMSSendingAccount> {
    try {
      const accountsUrl = `${API_URL}/sms-accounts`;
      const response = await fetch(accountsUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(account),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error creating sending account:', error);
      throw error;
    }
  }

  async updateSendingAccount(id: string, account: Partial<SMSSendingAccount>): Promise<SMSSendingAccount> {
    try {
      const accountUrl = `${API_URL}/sms-accounts/${id}`;
      const response = await fetch(accountUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(account),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error updating sending account:', error);
      throw error;
    }
  }

  async deleteSendingAccount(id: string): Promise<void> {
    try {
      const accountUrl = `${API_URL}/sms-accounts/${id}`;
      const response = await fetch(accountUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error deleting sending account:', error);
      throw error;
    }
  }

  // Templates
  async getSMSTemplates(): Promise<SMSTemplate[]> {
    try {
      const templatesUrl = `${API_URL}/sms-templates`;
      const response = await fetch(templatesUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.templates || [];
    } catch (error) {
      logger.error('Error fetching SMS templates:', error);
      throw error;
    }
  }

  async createSMSTemplate(template: Partial<SMSTemplate>): Promise<SMSTemplate> {
    try {
      const templatesUrl = `${API_URL}/sms-templates`;
      const response = await fetch(templatesUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(template),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error creating SMS template:', error);
      throw error;
    }
  }

  async updateSMSTemplate(id: string, template: Partial<SMSTemplate>): Promise<SMSTemplate> {
    try {
      const templateUrl = `${API_URL}/sms-templates/${id}`;
      const response = await fetch(templateUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(template),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error updating SMS template:', error);
      throw error;
    }
  }

  async deleteSMSTemplate(id: string): Promise<void> {
    try {
      const templateUrl = `${API_URL}/sms-templates/${id}`;
      const response = await fetch(templateUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error deleting SMS template:', error);
      throw error;
    }
  }

  async duplicateSMSTemplate(id: string): Promise<SMSTemplate> {
    try {
      const duplicateUrl = `${API_URL}/sms-templates/${id}/duplicate`;
      const response = await fetch(duplicateUrl, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error duplicating SMS template:', error);
      throw error;
    }
  }

  // Recipients
  async getSMSRecipients(): Promise<SMSRecipient[]> {
    try {
      const recipientsUrl = `${API_URL}/sms-recipients`;
      const response = await fetch(recipientsUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.recipients || [];
    } catch (error) {
      logger.error('Error fetching SMS recipients:', error);
      throw error;
    }
  }

  async createSMSRecipient(recipient: Partial<SMSRecipient>): Promise<SMSRecipient> {
    try {
      const recipientsUrl = `${API_URL}/sms-recipients`;
      const response = await fetch(recipientsUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(recipient),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error creating SMS recipient:', error);
      throw error;
    }
  }

  async updateSMSRecipient(id: string, recipient: Partial<SMSRecipient>): Promise<SMSRecipient> {
    try {
      const recipientUrl = `${API_URL}/sms-recipients/${id}`;
      const response = await fetch(recipientUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(recipient),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error updating SMS recipient:', error);
      throw error;
    }
  }

  async deleteSMSRecipient(id: string): Promise<void> {
    try {
      const recipientUrl = `${API_URL}/sms-recipients/${id}`;
      const response = await fetch(recipientUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error deleting SMS recipient:', error);
      throw error;
    }
  }

  async importSMSRecipients(recipients: Partial<SMSRecipient>[]): Promise<{ imported: number; failed: number; message: string }> {
    try {
      const importUrl = `${API_URL}/sms-recipients/import`;
      const response = await fetch(importUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recipients }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error importing SMS recipients:', error);
      throw error;
    }
  }

  async importRecipientsFromCSV(file: File): Promise<{ imported: number; failed: number; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const importUrl = `${API_URL}/sms-recipients/import`;
      const token = this.getToken();
      const tenantId = localStorage.getItem('tenant_id');
      const activeClientId = localStorage.getItem('active_client_id');
      const response = await fetch(importUrl, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(tenantId ? { 'X-Workspace-Id': tenantId } : {}),
          ...(activeClientId ? { 'X-Client-Id': activeClientId, 'X-Company-Id': activeClientId } : {}),
        },
        body: formData,
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error importing SMS recipients from CSV:', error);
      throw error;
    }
  }

  async exportRecipientsToCSV(): Promise<string> {
    try {
      const exportUrl = `${API_URL}/sms-recipients/export-csv`;
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await response.text();
    } catch (error) {
      logger.error('Error exporting SMS recipients to CSV:', error);
      throw error;
    }
  }

  async bulkSMSUnsubscribe(phones: string[]): Promise<{ success: string[]; failed: string[]; message: string }> {
    try {
      const unsubscribeUrl = `${API_URL}/sms-recipients/bulk-unsubscribe`;
      const response = await fetch(unsubscribeUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phones }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error bulk unsubscribing SMS recipients:', error);
      throw error;
    }
  }

  async bulkUnsubscribe(recipientIds: string[]): Promise<{ success: string[]; failed: string[]; message: string }> {
    try {
      const unsubscribeUrl = `${API_URL}/sms-recipients/bulk-unsubscribe`;
      const response = await fetch(unsubscribeUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recipient_ids: recipientIds }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error bulk unsubscribing SMS recipients:', error);
      throw error;
    }
  }

  async bulkDeleteRecipients(recipientIds: string[]): Promise<{ success: string[]; failed: string[]; message: string }> {
    try {
      const bulkActionUrl = `${API_URL}/sms-recipients/bulk-action`;
      const response = await fetch(bulkActionUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ action: 'delete', recipient_ids: recipientIds }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error bulk deleting SMS recipients:', error);
      throw error;
    }
  }

  // Campaigns
  async getSMSCampaigns(): Promise<SMSCampaign[]> {
    try {
      const campaignsUrl = `${API_URL}/sms-campaigns`;
      const response = await fetch(campaignsUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.campaigns || [];
    } catch (error) {
      logger.error('Error fetching SMS campaigns:', error);
      throw error;
    }
  }

  async getSMSCampaign(id: string): Promise<SMSCampaign> {
    try {
      const campaignUrl = `${API_URL}/sms-campaigns/${id}`;
      const response = await fetch(campaignUrl, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error fetching SMS campaign:', error);
      throw error;
    }
  }

  async createSMSCampaign(campaign: Partial<SMSCampaign>): Promise<SMSCampaign> {
    try {
      const campaignsUrl = `${API_URL}/sms-campaigns`;
      const response = await fetch(campaignsUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(campaign),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error creating SMS campaign:', error);
      throw error;
    }
  }

  async updateSMSCampaign(id: string, campaign: Partial<SMSCampaign>): Promise<SMSCampaign> {
    try {
      const campaignUrl = `${API_URL}/sms-campaigns/${id}`;
      const response = await fetch(campaignUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(campaign),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error updating SMS campaign:', error);
      throw error;
    }
  }

  async deleteSMSCampaign(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/sms-campaigns/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error deleting SMS campaign:', error);
      throw error;
    }
  }

  async startSMSCampaign(id: string): Promise<void> {
    try {
      const startUrl = `${API_URL}/sms-campaigns/${id}/start`;
      const response = await fetch(startUrl, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error starting SMS campaign:', error);
      throw error;
    }
  }

  async pauseSMSCampaign(id: string): Promise<void> {
    try {
      const pauseUrl = `${API_URL}/sms-campaigns/${id}/pause`;
      const response = await fetch(pauseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error pausing SMS campaign:', error);
      throw error;
    }
  }

  async archiveSMSCampaign(id: string): Promise<void> {
    try {
      const archiveUrl = `${API_URL}/sms-campaigns/${id}/archive`;
      const response = await fetch(archiveUrl, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error archiving SMS campaign:', error);
      throw error;
    }
  }

  async launchSMSCampaign(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/sms-campaigns/${id}/start`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      await this.handleResponse(response);
    } catch (error) {
      logger.error('Error launching SMS campaign:', error);
      throw error;
    }
  }

  // Settings
  async getSMSSettings(): Promise<SMSSettings> {
    try {
      const settingsUrl = `${API_URL}/sms-settings`;
      const response = await fetch(settingsUrl, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error fetching SMS settings:', error);
      throw error;
    }
  }

  async updateSMSSettings(settings: Partial<SMSSettings>): Promise<SMSSettings> {
    try {
      const settingsUrl = `${API_URL}/sms-settings`;
      const response = await fetch(settingsUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error updating SMS settings:', error);
      throw error;
    }
  }

  // Analytics
  async getSMSAnalytics(): Promise<SMSAnalytics> {
    try {
      const analyticsUrl = `${API_URL}/sms-analytics`;
      const response = await fetch(analyticsUrl, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error fetching SMS analytics:', error);
      throw error;
    }
  }

  async getSMSCampaignAnalytics(campaignId: string): Promise<SMSAnalytics> {
    try {
      const analyticsUrl = `${API_URL}/sms-analytics/campaigns/${campaignId}`;
      const response = await fetch(analyticsUrl, {
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error fetching SMS campaign analytics:', error);
      throw error;
    }
  }

  // Replies
  async getSMSReplies(): Promise<SMSReply[]> {
    try {
      const repliesUrl = `${API_URL}/sms-replies`;
      const response = await fetch(repliesUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.replies || [];
    } catch (error) {
      logger.error('Error fetching SMS replies:', error);
      throw error;
    }
  }

  async bulkAction(action: 'mark_read' | 'mark_starred' | 'mark_archived' | 'delete', replyIds: string[]): Promise<Record<string, unknown>> {
    try {
      const bulkActionUrl = `${API_URL}/sms-replies/bulk-action`;
      const response = await fetch(bulkActionUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ action, reply_ids: replyIds }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error performing bulk action on SMS replies:', error);
      throw error;
    }
  }

  async getSMSCampaignReplies(campaignId: string): Promise<SMSReply[]> {
    try {
      const campaignRepliesUrl = `${API_URL}/sms-replies/campaign/${campaignId}`;
      const response = await fetch(campaignRepliesUrl, {
        headers: this.getHeaders(),
      });
      const data = await this.handleResponse(response);
      return data.replies || [];
    } catch (error) {
      logger.error('Error fetching SMS campaign replies:', error);
      throw error;
    }
  }

  // Test Connection
  async testSignalWireConnection(credentials: { projectId: string; spaceUrl: string; apiToken: string }): Promise<{ success: boolean; message: string; numbers?: string[] }> {
    try {
      const testConnectionUrl = `${API_URL}/sms-settings/test-connection`;
      const response = await fetch(testConnectionUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error testing SignalWire connection:', error);
      throw error;
    }
  }

  // Test SMS
  async sendTestSMS(phoneNumber: string, message: string, senderId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const testSMSUrl = `${API_URL}/sms/send-test`;
      const response = await fetch(testSMSUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phoneNumber, message, senderId }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error sending test SMS:', error);
      throw error;
    }
  }

  async sendIndividualSMS(phoneNumber: string, message: string, senderNumber: string): Promise<{ message: string; status: string; external_id?: string }> {
    try {
      const sendSMSUrl = `${API_URL}/sms/send`;
      const response = await fetch(sendSMSUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone_number: phoneNumber, message, sender_number: senderNumber }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error sending individual SMS:', error);
      throw error;
    }
  }

  async sendCampaign(campaignId: string): Promise<{ message: string; total_recipients: number; sent_count: number; failed_count: number }> {
    try {
      const sendCampaignUrl = `${API_URL}/sms-campaigns/${campaignId}/send`;
      const response = await fetch(sendCampaignUrl, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      logger.error('Error sending SMS campaign:', error);
      throw error;
    }
  }
}

export const smsAPI = new SMSAPI();

// Extend the main API with SMS methods
export function extendAPIWithSMS(api: Record<string, unknown>) {
  return {
    ...api,
    // SMS Accounts
    getSMSAccounts: () => smsAPI.getSMSAccounts(),
    getSendingAccounts: () => smsAPI.getSendingAccounts(),
    getAvailableNumbers: () => smsAPI.getAvailableNumbers(),
    createSendingAccount: (account: Partial<SMSSendingAccount>) => smsAPI.createSendingAccount(account),
    updateSendingAccount: (id: string, account: Partial<SMSSendingAccount>) => smsAPI.updateSendingAccount(id, account),
    deleteSendingAccount: (id: string) => smsAPI.deleteSendingAccount(id),

    // SMS Templates
    getSMSTemplates: () => smsAPI.getSMSTemplates(),
    createSMSTemplate: (template: Partial<SMSTemplate>) => smsAPI.createSMSTemplate(template),
    updateSMSTemplate: (id: string, template: Partial<SMSTemplate>) => smsAPI.updateSMSTemplate(id, template),
    deleteSMSTemplate: (id: string) => smsAPI.deleteSMSTemplate(id),

    // SMS Recipients
    getSMSRecipients: () => smsAPI.getSMSRecipients(),
    createSMSRecipient: (recipient: Partial<SMSRecipient>) => smsAPI.createSMSRecipient(recipient),
    updateSMSRecipient: (id: string, recipient: Partial<SMSRecipient>) => smsAPI.updateSMSRecipient(id, recipient),
    deleteSMSRecipient: (id: string) => smsAPI.deleteSMSRecipient(id),
    importSMSRecipients: (recipients: Partial<SMSRecipient>[]) => smsAPI.importSMSRecipients(recipients),
    importRecipientsFromCSV: (file: File) => smsAPI.importRecipientsFromCSV(file),
    exportRecipientsToCSV: () => smsAPI.exportRecipientsToCSV(),
    bulkSMSUnsubscribe: (phones: string[]) => smsAPI.bulkSMSUnsubscribe(phones),
    bulkUnsubscribe: (recipientIds: string[]) => smsAPI.bulkUnsubscribe(recipientIds),
    bulkDeleteRecipients: (recipientIds: string[]) => smsAPI.bulkDeleteRecipients(recipientIds),

    // SMS Campaigns
    getSMSCampaigns: () => smsAPI.getSMSCampaigns(),
    getSMSCampaign: (id: string) => smsAPI.getSMSCampaign(id),
    createSMSCampaign: (campaign: Partial<SMSCampaign>) => smsAPI.createSMSCampaign(campaign),
    updateSMSCampaign: (id: string, campaign: Partial<SMSCampaign>) => smsAPI.updateSMSCampaign(id, campaign),
    deleteSMSCampaign: (id: string) => smsAPI.deleteSMSCampaign(id),
    startSMSCampaign: (id: string) => smsAPI.startSMSCampaign(id),
    pauseSMSCampaign: (id: string) => smsAPI.pauseSMSCampaign(id),
    archiveSMSCampaign: (id: string) => smsAPI.archiveSMSCampaign(id),
    launchSMSCampaign: (id: string) => smsAPI.launchSMSCampaign(id),
    sendSMSCampaign: (id: string) => smsAPI.sendCampaign(id),

    // SMS Settings
    getSMSSettings: () => smsAPI.getSMSSettings(),
    updateSMSSettings: (settings: Partial<SMSSettings>) => smsAPI.updateSMSSettings(settings),

    // SMS Analytics
    getSMSAnalytics: () => smsAPI.getSMSAnalytics(),
    getSMSCampaignAnalytics: (campaignId: string) => smsAPI.getSMSCampaignAnalytics(campaignId),

    // SMS Replies
    getSMSReplies: () => smsAPI.getSMSReplies(),
    getSMSCampaignReplies: (campaignId: string) => smsAPI.getSMSCampaignReplies(campaignId),

    // Test Connection
    testSignalWireConnection: (credentials: { projectId: string; spaceUrl: string; apiToken: string }) =>
      smsAPI.testSignalWireConnection(credentials),

    // Test SMS
    sendTestSMS: (phoneNumber: string, message: string, senderId?: string) =>
      smsAPI.sendTestSMS(phoneNumber, message, senderId),

    // Individual SMS
    sendIndividualSMS: (phoneNumber: string, message: string, senderNumber: string) =>
      smsAPI.sendIndividualSMS(phoneNumber, message, senderNumber),
  };
}
