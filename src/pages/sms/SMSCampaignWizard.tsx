import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { api, type Connection } from '@/lib/api';
import { smsAPI, type SMSSendingAccount, type SMSCampaign } from '@/lib/sms-api';
import { useCampaignSettings } from '@/hooks/useCampaignSettings';
import {
  Smartphone,
  MessageSquare,
  Users,
  Settings,
  Eye,
  Send,
  RefreshCw,
  Target,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { CampaignData, ExtendedSMSRecipient } from '@/components/sms/campaign-wizard/types';
import { InfoStep } from '@/components/sms/campaign-wizard/InfoStep';
import { AccountStep } from '@/components/sms/campaign-wizard/AccountStep';
import { ContentStep } from '@/components/sms/campaign-wizard/ContentStep';
import { FollowUpsStep } from '@/components/sms/campaign-wizard/FollowUpsStep';
import { AudienceStep } from '@/components/sms/campaign-wizard/AudienceStep';
import { SettingsStep } from '@/components/sms/campaign-wizard/SettingsStep';
import { ReviewStep } from '@/components/sms/campaign-wizard/ReviewStep';
import { LaunchStep } from '@/components/sms/campaign-wizard/LaunchStep';

const normalizeStringArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v));
    }
  } catch {
    // ignore
  }
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const SMSCampaignWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>(); // For editing existing campaigns
  const [searchParams] = useSearchParams();
  const isEditMode = !!id && id !== ':id';
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { settings: campaignSettings, loading: settingsLoading, validateRequiredSettings, validateConsistency } = useCampaignSettings();
  const [sendingAccounts, setSendingAccounts] = useState<SMSSendingAccount[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<Array<{ phone_number: string, friendly_name: string, connection_id: string }>>([]);
  const [recipients, setRecipients] = useState<ExtendedSMSRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [isSenderLocked, setIsSenderLocked] = useState(false);

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    sender_id: '',
    message: '',
    recipient_method: 'all',
    recipient_tags: [],
    recipient_groups: [],
    throttle_rate: 1,
    throttle_unit: 'minute',
    enable_retry: true,
    retry_attempts: campaignSettings.sms.retryAttempts,
    respect_quiet_hours: true,
    quiet_hours_start: campaignSettings.sms.quietHoursStart,
    quiet_hours_end: campaignSettings.sms.quietHoursEnd,
    timezone: campaignSettings.sms.timezone,
    group_id: undefined,
    follow_up_messages: [],
  });

  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // 8-Step Flow for SMS Campaign Creation
  const steps = [
    { id: 1, title: 'Info', icon: Target, description: 'Campaign details' },
    { id: 2, title: 'Account', icon: Smartphone, description: 'Choose sending number' },
    { id: 3, title: 'Content', icon: MessageSquare, description: 'Create SMS message' },
    { id: 4, title: 'Follow-ups', icon: RefreshCw, description: 'Set up follow-ups' },
    { id: 5, title: 'Audience', icon: Users, description: 'Select recipients' },
    { id: 6, title: 'Settings', icon: Settings, description: 'Configure schedule' },
    { id: 7, title: 'Review', icon: Eye, description: 'Review campaign' },
    { id: 8, title: 'Launch', icon: Send, description: 'Launch campaign' },
  ];

  function updateCampaignData(updates: Partial<CampaignData>) {
    // Use functional update to ensure we always have the latest state
    setCampaignData(prev => {
      const newState = { ...prev, ...updates };
      return newState;
    });
    // Only mark as unsaved if we're not just typing in text fields
    const isTextInput = Object.keys(updates).some(key =>
      ['name', 'description', 'message'].includes(key)
    );
    if (!isTextInput) {
      setHasUnsavedChanges(true);
    } else {
      // For text inputs, delay marking as unsaved to prevent interference
      setTimeout(() => setHasUnsavedChanges(true), 1000);
    }
  };

  async function loadInitialData() {
    try {
      setIsLoading(true);

      const accountsData = await smsAPI.getSendingAccounts();
      const recipientsData = await smsAPI.getSMSRecipients();

      // Load SignalWire connections for SMS numbers
      const connectionsResponse = await api.getConnections();
      const connectionsData = connectionsResponse || [];

      // Convert SignalWire connections to sending accounts format
      const signalWireAccounts: SMSSendingAccount[] = [];
      const availableNumbers: Array<{ phone_number: string, friendly_name: string, connection_id: string }> = [];

      for (const connection of connectionsData) {
        if (connection.provider === 'signalwire' && (connection.status === 'connected' || connection.status === 'active')) {
          try {
            const numbersResponse = await api.getConnectionPhoneNumbers(connection.id);

            if (numbersResponse.phoneNumbers && numbersResponse.phoneNumbers.length > 0) {
              for (const number of numbersResponse.phoneNumbers) {
                signalWireAccounts.push({
                  id: `signalwire_${connection.id}_${number.phone_number}`,
                  name: `${connection.name} - ${number.friendly_name || number.phone_number}`,
                  type: 'signalwire',
                  status: 'active',
                  phone_number: number.phone_number,
                  provider_config: {}
                });

                availableNumbers.push({
                  phone_number: number.phone_number,
                  friendly_name: number.friendly_name || number.phone_number,
                  connection_id: connection.id
                });
              }
            }
          } catch (error) {
            console.error(`Error loading numbers for connection ${connection.id}:`, error);
          }
        }
      }

      setSendingAccounts([...accountsData, ...signalWireAccounts]);
      setConnections(connectionsData);
      setAvailableNumbers(availableNumbers);
      setRecipients(recipientsData || []);

      // If we have accounts, set the first one as default (prefer SignalWire)
      const allAccounts: SMSSendingAccount[] = [...accountsData, ...signalWireAccounts];
      if (allAccounts.length > 0 && !campaignData.sender_id) {
        const defaultAccount = signalWireAccounts.length > 0 ? signalWireAccounts[0] : accountsData[0];
        updateCampaignData({
          sender_id: defaultAccount.id
        });
      }

      // Load existing campaign if editing
      if (id) {
        try {
          const existingCampaign = await smsAPI.getSMSCampaign(id);
          if (existingCampaign) {
            setCurrentCampaignId(id);

            // Update campaign data with existing campaign data
            setCampaignData({
              name: existingCampaign.name || '',
              description: existingCampaign.description || '',
              sender_id: existingCampaign.sender_id || '',
              message: existingCampaign.message || '',
              recipient_method: existingCampaign.recipient_method || 'all',
              recipient_tags: normalizeStringArray(existingCampaign.recipient_tags),
              recipient_groups: normalizeStringArray(existingCampaign.recipient_groups),
              scheduled_at: existingCampaign.scheduled_at,
              throttle_rate: existingCampaign.throttle_rate || 1,
              throttle_unit: existingCampaign.throttle_unit || 'minute',
              enable_retry: !!existingCampaign.enable_retry,
              retry_attempts: existingCampaign.retry_attempts || 3,
              respect_quiet_hours: !!existingCampaign.respect_quiet_hours,
              quiet_hours_start: existingCampaign.quiet_hours_start || '22:00',
              quiet_hours_end: existingCampaign.quiet_hours_end || '08:00',
              timezone: existingCampaign.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              group_id: existingCampaign.group_id,
              follow_up_messages: existingCampaign.follow_up_messages || [],
            });

            // Set selected recipients based on recipient_tags
            if (existingCampaign.recipient_tags && existingCampaign.recipient_tags.length > 0) {
              if (existingCampaign.recipient_method === 'manual') {
                // For manual selection, match by phone numbers
                const matchingRecipients = recipientsData.filter(recipient =>
                  existingCampaign.recipient_tags.includes(recipient.phone_number)
                );
                setSelectedRecipients(matchingRecipients.map(r => r.id));
              } else {
                // For tag-based selection, match by tags
                const matchingRecipients = recipientsData.filter(recipient =>
                  recipient.tags && recipient.tags.some(tag =>
                    existingCampaign.recipient_tags.includes(tag)
                  )
                );
                setSelectedRecipients(matchingRecipients.map(r => r.id));
              }
            }

            // Lock sender only if campaign is already launched (not draft) and we're editing
            if (existingCampaign.sender_id && existingCampaign.status !== 'draft' && id) {
              setIsSenderLocked(true);
            }

            setHasUnsavedChanges(false); // Mark as saved since we just loaded
          }
        } catch (error) {
          console.error('Error loading existing campaign:', error);
          toast.error('Failed to load existing campaign');
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
      setSendingAccounts([]);
      setRecipients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update campaign data when settings load
  useEffect(() => {
    if (!settingsLoading) {
      setCampaignData(prev => ({
        ...prev,
        retry_attempts: campaignSettings.sms.retryAttempts,
        quiet_hours_start: campaignSettings.sms.quietHoursStart,
        quiet_hours_end: campaignSettings.sms.quietHoursEnd,
        timezone: campaignSettings.sms.timezone,
      }));
    }
  }, [settingsLoading, campaignSettings, isEditMode]);

  useEffect(() => {
    if (!settingsLoading) {
      const validation = validateRequiredSettings('sms');
      if (!validation.valid) {
        toast.error(`Please configure: ${validation.missing.join(', ')} in Settings page`);
      }

      // Check for settings consistency
      const consistency = validateConsistency();
      if (!consistency.valid) {
        toast.error(`Settings inconsistency: ${consistency.inconsistencies.join('. ')}`);
      }
    }
  }, [settingsLoading, validateRequiredSettings, validateConsistency]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Handle recipient parameter from URL
    const recipientParam = searchParams.get('recipient');
    if (recipientParam && recipients.length > 0) {
      const recipientId = recipientParam;
      if (recipients.some(r => r.id === recipientId)) {
        setSelectedRecipients([recipientId]);
        const recipient = recipients.find(r => r.id === recipientId);
        if (recipient) {
          updateCampaignData({
            recipient_method: 'manual',
            recipient_tags: [recipient.phone_number],
          });
        }
        // Navigate to step 5 (Audience step) if we're on step 1
        if (currentStep === 1) {
          setCurrentStep(5);
        }
      }
    }
  }, [searchParams, recipients, currentStep, setSelectedRecipients]);


  const handleNext = async () => {
    if (validateCurrentStep()) {
      // Auto-save current step data before proceeding
      try {
        await saveCurrentStepData();

        if (currentStep < 8) {
          setCurrentStep(currentStep + 1);
        }
      } catch (error) {
        console.error('Error saving campaign data:', error);
        toast.error('Failed to save campaign data. Please try again.');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || validatePreviousSteps(step)) {
      setCurrentStep(step);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Info
        if (!campaignData.name.trim()) {
          toast.error('Please enter a campaign name');
          return false;
        }
        return true;

      case 2: // Account
        if (!campaignData.sender_id) {
          toast.error('Please select a sending account');
          return false;
        }
        return true;

      case 3: // Content
        if (!campaignData.message.trim()) {
          toast.error('Please enter a message');
          return false;
        }
        if (campaignData.message.length > 1600) {
          toast.error('Message is too long (max 1600 characters)');
          return false;
        }
        return true;

      case 4: // Follow-ups
        // Optional step, always valid
        return true;

      case 5: // Audience
        if (selectedRecipients.length === 0) {
          toast.error('Please select at least one recipient');
          return false;
        }
        // Also check if campaign data has proper recipient settings
        if (campaignData.recipient_method === 'tags' && (!campaignData.recipient_tags || campaignData.recipient_tags.length === 0)) {
          toast.error('Please select recipients with valid tags');
          return false;
        }
        return true;

      case 6: // Settings
        if (campaignData.scheduled_at && new Date(campaignData.scheduled_at) <= new Date()) {
          toast.error('Scheduled time must be in the future');
          return false;
        }
        return true;

      case 7: // Review
        return true;

      case 8: // Launch
        return true;

      default:
        return true;
    }
  };

  const validatePreviousSteps = (targetStep: number): boolean => {
    // Allow navigation to previous steps
    return targetStep < currentStep;
  };


  // Auto-save functionality
  const saveCurrentStepData = async (showToast = false) => {
    try {
      if (!campaignData.name.trim()) {
        return; // Don't save without a name
      }

      const payload = {
        name: campaignData.name,
        description: campaignData.description,
        message: campaignData.message,
        sender_id: campaignData.sender_id,
        status: 'draft' as const,
        recipient_method: campaignData.recipient_method,
        recipient_tags: campaignData.recipient_tags || [],
        recipient_groups: campaignData.recipient_groups || [],
        scheduled_at: campaignData.scheduled_at,
        throttle_rate: campaignData.throttle_rate,
        throttle_unit: campaignData.throttle_unit,
        enable_retry: campaignData.enable_retry,
        retry_attempts: campaignData.retry_attempts,
        respect_quiet_hours: campaignData.respect_quiet_hours,
        quiet_hours_start: campaignData.quiet_hours_start,
        quiet_hours_end: campaignData.quiet_hours_end,
        timezone: campaignData.timezone,
        group_id: campaignData.group_id,
        follow_up_messages: campaignData.follow_up_messages || [],
      };

      if (currentCampaignId) {
        // Update existing campaign
        await smsAPI.updateSMSCampaign(currentCampaignId, payload);
      } else {
        // Create new campaign
        const createdCampaign = await smsAPI.createSMSCampaign(payload);
        setCurrentCampaignId(createdCampaign.id);
      }

      setHasUnsavedChanges(false);

      if (showToast) {
        toast.success('Campaign saved successfully!');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      if (showToast) {
        toast.error('Failed to save campaign');
      }
    }
  };

  // Auto-save when campaign data changes - with improved debouncing
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Only auto-save if there are unsaved changes and we have a campaign name
    // Use a much longer delay to prevent interference with typing
    if (hasUnsavedChanges && campaignData.name.trim()) {
      const timeout = setTimeout(() => {
        saveCurrentStepData();
      }, 5000); // Auto-save after 5 seconds of inactivity (increased from 3s)
      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [campaignData, hasUnsavedChanges, autoSaveTimeout]);

  // Warn about unsaved changes when leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => {
      const newSelection = prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId];

      const selectedRecipientData = recipients.filter(r => newSelection.includes(r.id));

      if (newSelection.length > 0) {
        const phoneNumbers = selectedRecipientData.map(r => r.phone_number);
        updateCampaignData({
          recipient_method: 'manual',
          recipient_tags: phoneNumbers,
        });
      } else {
        updateCampaignData({
          recipient_method: 'all',
          recipient_tags: [],
        });
      }

      return newSelection;
    });
  };

  const getFilteredRecipients = () => {
    return recipients.filter((recipient: ExtendedSMSRecipient) => {
      const matchesSearch = searchQuery === '' ||
        recipient.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (recipient.first_name && recipient.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (recipient.last_name && recipient.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (recipient.company && recipient.company.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = tagFilter === 'all' ||
        (recipient.tags && recipient.tags.includes(tagFilter));

      return matchesSearch && matchesTag;
    });
  };

  const selectAllRecipients = () => {
    const filteredRecipients = getFilteredRecipients();
    const allIds = filteredRecipients.map(r => r.id);
    setSelectedRecipients(allIds);

    const phoneNumbers = filteredRecipients.map(r => r.phone_number);
    updateCampaignData({
      recipient_method: 'manual',
      recipient_tags: phoneNumbers,
    });
  };

  const clearAllRecipients = () => {
    setSelectedRecipients([]);
    updateCampaignData({
      recipient_method: 'all',
      recipient_tags: [],
    });
  };

  const handleLaunchCampaign = async () => {
    try {
      setIsLoading(true);

      const selectedRecipientData = recipients.filter((r: ExtendedSMSRecipient) => selectedRecipients.includes(r.id));
      const recipientTags = [...new Set(selectedRecipientData.flatMap(r => r.tags || []))];

      const campaignPayload: Partial<SMSCampaign> = {
        name: campaignData.name,
        description: campaignData.description,
        message: campaignData.message,
        sender_id: campaignData.sender_id,
        status: 'draft' as const,
        recipient_method: selectedRecipients.length > 0 ? 'tags' : 'all',
        recipient_tags: recipientTags,
        scheduled_at: campaignData.scheduled_at,
        throttle_rate: campaignData.throttle_rate,
        throttle_unit: campaignData.throttle_unit,
        enable_retry: campaignData.enable_retry,
        retry_attempts: campaignData.retry_attempts,
        respect_quiet_hours: campaignData.respect_quiet_hours,
        quiet_hours_start: campaignData.quiet_hours_start,
        quiet_hours_end: campaignData.quiet_hours_end,
        group_id: campaignData.group_id,
      };

      let campaignId = currentCampaignId;

      if (currentCampaignId) {
        await smsAPI.updateSMSCampaign(currentCampaignId, campaignPayload);
      } else {
        const createdCampaign = await smsAPI.createSMSCampaign(campaignPayload);
        campaignId = createdCampaign.id;
        setCurrentCampaignId(campaignId);
      }

      if (campaignId) {
        await smsAPI.startSMSCampaign(campaignId);
      }

      toast.success('SMS Campaign launched successfully!');
      navigate('/reach/outbound/sms/campaigns');
    } catch (error: any) {
      console.error('Error launching campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to launch campaign';
      toast.error(`Failed to launch campaign: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isSenderActuallyLocked = isSenderLocked || (campaignData?.status && campaignData.status !== 'draft' && !!id);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <InfoStep campaignData={campaignData} updateCampaignData={updateCampaignData} />;
      case 2:
        return <AccountStep
          campaignData={campaignData}
          updateCampaignData={updateCampaignData}
          sendingAccounts={sendingAccounts}
          isSenderActuallyLocked={isSenderActuallyLocked || false}
        />;
      case 3:
        return <ContentStep campaignData={campaignData} updateCampaignData={updateCampaignData} />;
      case 4:
        return <FollowUpsStep campaignData={campaignData} updateCampaignData={updateCampaignData} />;
      case 5:
        return <AudienceStep
          recipients={recipients}
          selectedRecipients={selectedRecipients}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          filteredRecipients={getFilteredRecipients()}
          toggleRecipient={toggleRecipient}
          selectAllRecipients={selectAllRecipients}
          clearAllRecipients={clearAllRecipients}
          updateCampaignData={updateCampaignData}
        />;
      case 6:
        return <SettingsStep campaignData={campaignData} updateCampaignData={updateCampaignData} />;
      case 7:
        return <ReviewStep
          campaignData={campaignData}
          sendingAccounts={sendingAccounts}
          recipients={recipients}
          selectedRecipients={selectedRecipients}
        />;
      case 8:
        return <LaunchStep
          campaignData={campaignData}
          selectedRecipients={selectedRecipients}
          handleLaunchCampaign={handleLaunchCampaign}
          isLoading={isLoading}
        />;
      default:
        return <InfoStep campaignData={campaignData} updateCampaignData={updateCampaignData} />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-[18px] font-bold mb-2">
          {id ? 'Edit SMS Campaign' : 'Create SMS Campaign'}
        </h1>
        <p className="text-muted-foreground">
          {id
            ? 'Update your SMS campaign settings and launch when ready'
            : 'Follow the steps below to create and launch your SMS campaign'
          }
        </p>
        {hasUnsavedChanges && (
          <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
            Unsaved changes
          </div>
        )}
      </div>

      <div className="mb-8">
        <Progress value={(currentStep / 8) * 100} className="mb-4" />
        <div className="flex justify-between items-center px-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isClickable = step.id <= currentStep || validatePreviousSteps(step.id);

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center cursor-pointer ${isClickable ? 'opacity-100' : 'opacity-40 cursor-not-allowed'}`}
                onClick={() => isClickable && handleStepClick(step.id)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                      : isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="text-center hidden md:block">
                  <div className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isLoading}
          className="hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/reach/outbound/sms/campaigns')}
            disabled={isLoading}
            className="hover:bg-gray-50"
          >
            Cancel
          </Button>
          {hasUnsavedChanges && campaignData.name.trim() && (
            <Button
              variant="outline"
              onClick={() => saveCurrentStepData(true)}
              disabled={isLoading}
              className="hover:bg-gray-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          )}
          {currentStep === 8 ? (
            null
          ) : (
            <Button onClick={handleNext} disabled={isLoading}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMSCampaignWizard;
