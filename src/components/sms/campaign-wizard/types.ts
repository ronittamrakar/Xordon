import { SMSSendingAccount, SMSRecipient, FollowUpMessage } from '@/lib/sms-api';

export interface CampaignData {
    name: string;
    description: string;
    sender_id: string;
    message: string;
    template_id?: string;
    recipient_method: 'all' | 'tags' | 'groups' | 'manual';
    recipient_tags?: string[];
    recipient_groups?: string[];
    recipients?: SMSRecipient[];
    scheduled_at?: string;
    throttle_rate: number;
    throttle_unit: 'minute' | 'hour' | 'day';
    enable_retry: boolean;
    retry_attempts: number;
    respect_quiet_hours: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    timezone: string;
    group_id?: string;
    user_id?: string;
    status?: 'draft' | 'active' | 'paused' | 'completed';
    follow_up_messages?: FollowUpMessage[];
}

export type ExtendedSMSRecipient = SMSRecipient;
