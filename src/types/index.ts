export * from './contact';

export interface Connection {
    id: string;
    name: string;
    provider: 'signalwire' | 'twilio' | 'vonage';
    status: 'active' | 'inactive' | 'connected' | 'error';
    config?: {
        defaultSenderNumber?: string;
        phoneNumber?: string;
        projectId?: string;
        spaceUrl?: string;
        apiToken?: string;
        accountSid?: string;
        authToken?: string;
    };
}

export interface CallRecipient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    title: string;
    customFields: Record<string, unknown>;
}

export interface CallCampaign {
    id: string;
    name: string;
    description: string;
    callScript: string;
    callProvider: string;
    callerId: string;
    recipients: CallRecipient[];
    scheduleType: 'immediate' | 'scheduled' | 'recurring';
    scheduledDate?: string;
    scheduledTime?: string;
    timezone: string;
    dailyStartTime: string;
    dailyEndTime: string;
    callDelay: number;
    voicemailEnabled: boolean;
    voicemailFile?: File;
    recordingEnabled: boolean;
    maxRetries: number;
    retryDelay: number;
    status: 'draft' | 'active' | 'completed' | 'paused';
}
