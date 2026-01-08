import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface CampaignSettings {
  email: {
    trackOpens: boolean;
    trackClicks: boolean;
    sendingWindowStart: string;
    sendingWindowEnd: string;
    timezone: string;
    enableUnsubscribe: boolean;
    unsubscribeText: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    dailyLimit: number;
    delayBetweenEmails: number;
  };
  sms: {
    quietHoursStart: string;
    quietHoursEnd: string;
    retryAttempts: number;
    retryDelay: number;
    timezone: string;
    dailyLimit: number;
    fromNumber: string;
    enableDeliveryReports: boolean;
  };
  call: {
    workingHoursStart: string;
    workingHoursEnd: string;
    timezone: string;
    callDelay: number;
    maxRetries: number;
    retryDelay: number;
    voicemailMessage: string;
    callerId: string;
  };
  forms: {
    enableNotifications: boolean;
    notificationEmail: string;
    autoReplyEnabled: boolean;
    autoReplySubject: string;
    autoReplyMessage: string;
    enableSpamProtection: boolean;
    spamKeywords: string[];
  };
  shared: {
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
  };
}

const defaultSettings: CampaignSettings = {
  email: {
    trackOpens: true,
    trackClicks: true,
    sendingWindowStart: '09:00',
    sendingWindowEnd: '17:00',
    timezone: 'UTC',
    enableUnsubscribe: true,
    unsubscribeText: 'Unsubscribe from this list',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    dailyLimit: 100,
    delayBetweenEmails: 60,
  },
  sms: {
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    retryAttempts: 3,
    retryDelay: 300,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dailyLimit: 50,
    fromNumber: '',
    enableDeliveryReports: true,
  },
  call: {
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    timezone: 'UTC',
    callDelay: 60,
    maxRetries: 2,
    retryDelay: 300,
    voicemailMessage: 'Please leave a message after the tone',
    callerId: '',
  },
  forms: {
    enableNotifications: true,
    notificationEmail: '',
    autoReplyEnabled: true,
    autoReplySubject: 'Thank you for your submission',
    autoReplyMessage: 'Thank you for your submission. We will get back to you soon.',
    enableSpamProtection: false,
    spamKeywords: [],
  },
  shared: {
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    currency: 'USD',
    language: 'en',
  },
};

export function useCampaignSettings() {
  const [settings, setSettings] = useState<CampaignSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiSettings = await api.getSettings();
      
      if (apiSettings) {
        const mergedSettings: CampaignSettings = {
          email: {
            ...defaultSettings.email,
            ...apiSettings.emailSettings,
            timezone: apiSettings.emailSettings?.timezone || apiSettings.timezone || defaultSettings.email.timezone,
          },
          sms: {
            ...defaultSettings.sms,
            ...apiSettings.smsSettings,
            timezone: apiSettings.smsSettings?.timezone || apiSettings.timezone || defaultSettings.sms.timezone,
          },
          call: {
            ...defaultSettings.call,
            ...apiSettings.callSettings,
            timezone: apiSettings.callSettings?.timezone || apiSettings.timezone || defaultSettings.call.timezone,
          },
          forms: {
            ...defaultSettings.forms,
            ...apiSettings.formSettings,
          },
          shared: {
            ...defaultSettings.shared,
            timezone: apiSettings.timezone || defaultSettings.shared.timezone,
            dateFormat: apiSettings.dateFormat || defaultSettings.shared.dateFormat,
            timeFormat: apiSettings.timeFormat || defaultSettings.shared.timeFormat,
            currency: apiSettings.currency || defaultSettings.shared.currency,
            language: apiSettings.language || defaultSettings.shared.language,
          },
        };
        
        setSettings(mergedSettings);
      }
    } catch (err) {
      console.error('Failed to load campaign settings:', err);
      setError('Failed to load campaign settings');
    } finally {
      setLoading(false);
    }
  };

  const validateRequiredSettings = (campaignType: 'email' | 'sms' | 'call' | 'forms'): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];
    const campaignSettings = settings[campaignType];
    
    switch (campaignType) {
      case 'email':
        if (!campaignSettings.fromEmail) missing.push('From Email');
        if (!campaignSettings.fromName) missing.push('From Name');
        break;
      case 'sms':
        if (!campaignSettings.fromNumber) missing.push('From Number');
        break;
      case 'call':
        if (!campaignSettings.callerId) missing.push('Caller ID');
        break;
      case 'forms':
        if (campaignSettings.enableNotifications && !campaignSettings.notificationEmail) {
          missing.push('Notification Email');
        }
        break;
    }
    
    return {
      valid: missing.length === 0,
      missing
    };
  };

  const validateConsistency = (): { valid: boolean; inconsistencies: string[] } => {
    const inconsistencies: string[] = [];
    
    // Check timezone consistency across campaigns
    const timezones = [
      { type: 'Email', tz: settings.email.timezone },
      { type: 'SMS', tz: settings.sms.timezone },
      { type: 'Call', tz: settings.call.timezone },
      { type: 'Shared', tz: settings.shared.timezone }
    ];
    
    const uniqueTimezones = new Set(timezones.map(t => t.tz));
    if (uniqueTimezones.size > 1) {
      inconsistencies.push(`Timezone mismatch detected: ${timezones.map(t => `${t.type}: ${t.tz}`).join(', ')}`);
    }
    
    // Check for overlapping quiet hours and working hours
    const emailStart = settings.email.sendingWindowStart;
    const emailEnd = settings.email.sendingWindowEnd;
    const smsStart = settings.sms.quietHoursStart;
    const smsEnd = settings.sms.quietHoursEnd;
    const callStart = settings.call.workingHoursStart;
    const callEnd = settings.call.workingHoursEnd;
    
    // Convert time strings to minutes for comparison
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const emailStartMin = timeToMinutes(emailStart);
    const emailEndMin = timeToMinutes(emailEnd);
    const smsStartMin = timeToMinutes(smsStart);
    const smsEndMin = timeToMinutes(smsEnd);
    const callStartMin = timeToMinutes(callStart);
    const callEndMin = timeToMinutes(callEnd);
    
    // Check if SMS quiet hours overlap with email sending window
    if ((smsStartMin <= emailStartMin && smsEndMin >= emailStartMin) || 
        (smsStartMin <= emailEndMin && smsEndMin >= emailEndMin)) {
      inconsistencies.push('SMS quiet hours overlap with email sending window');
    }
    
    // Check if call working hours overlap with SMS quiet hours
    if ((callStartMin <= smsStartMin && callEndMin >= smsStartMin) || 
        (callStartMin <= smsEndMin && callEndMin >= smsEndMin)) {
      inconsistencies.push('Call working hours overlap with SMS quiet hours');
    }
    
    return {
      valid: inconsistencies.length === 0,
      inconsistencies
    };
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    loadSettings,
    validateRequiredSettings,
    validateConsistency,
  };
}
