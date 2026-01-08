import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UnifiedContactSelector } from '@/components/UnifiedContactSelector';
import { Contact } from '@/types/contact';
import {
  Plus,
  Smartphone,
  FileTextIcon,
  Users,
  Settings,
  Eye,
  Send,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Clock,
  Target,
  AlertTriangle,
} from 'lucide-react';

import { toast } from 'sonner';
import { api, SMSCampaign, SMSTemplate, SMSRecipient } from '@/lib/api';
import CSVColumnMapper from '@/components/CSVColumnMapper';

type WizardStep = 'account' | 'content' | 'audience' | 'settings' | 'followups' | 'review';

interface RecipientData {
  phone: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

interface SMSFollowUp {
  content: string;
  delayDays: number;
  smsOrder: number;
}

const SMSCampaignWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State management
  const [currentStep, setCurrentStep] = useState<WizardStep>('account');
  const [availableNumbers, setAvailableNumbers] = useState<Array<{ phone_number: string, friendly_name: string }>>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [abTests, setAbTests] = useState<api.ABTest[]>([]);
  const [selectedAbTestId, setSelectedAbTestId] = useState<string>('none');

  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');

  const [campaignData, setCampaignData] = useState<SMSCampaign | null>(null);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | undefined>(id);

  // Sync currentCampaignId with URL parameter changes
  useEffect(() => {
    setCurrentCampaignId(id);
  }, [id]);

  const [pendingRecipients, setPendingRecipients] = useState<Contact[]>([]);
  const [manualRecipient, setManualRecipient] = useState<Partial<Contact>>({});
  const [recipientMethod, setRecipientMethod] = useState<'csv' | 'manual' | 'existing'>('csv');
  const [existingRecipients, setExistingRecipients] = useState<SMSRecipient[]>([]);
  const [selectedExistingRecipients, setSelectedExistingRecipients] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showColumnMapper, setShowColumnMapper] = useState(false);

  // Follow-up SMS state
  const [followUpSMSs, setFollowUpSMSs] = useState<SMSFollowUp[]>([]);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSMSHistory, setTestSMSHistory] = useState<Array<{ phone: string; timestamp: Date }>>([]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [formData, setFormData] = useState<Partial<SMSCampaign>>({
    name: '',
    message: '',
    sender_id: '',

    // Scheduling settings
    scheduled_at: '',
    scheduledAt: '',
    useCustomScheduling: false,
    throttle_rate: 30,
    throttle_unit: 'minute' as 'minute' | 'hour',
    enable_retry: true,
    retry_attempts: 3,
    respect_quiet_hours: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',

    // Recipient settings
    recipient_method: 'csv' as 'manual' | 'csv' | 'tags',
    recipient_tags: [],

    // Additional wizard fields
    timezone: 'UTC',
    respectSendingWindow: false,
    sendingWindowStart: '09:00',
    sendingWindowEnd: '17:00',
    sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    smsDelay: 5,
    batchSize: 50,
    priority: 'normal' as 'high' | 'normal' | 'low',
    unsubscribePlainText: 'Reply STOP to unsubscribe: {{unsubscribeUrl}}',

    // Status and metadata
    status: 'draft' as 'draft' | 'active' | 'paused' | 'completed',
    created_at: '',
    updated_at: '',

    // Analytics (optional)
    recipient_count: 0,
    sent_count: 0,
    delivered_count: 0,
    failed_count: 0,
    reply_count: 0,

    // A/B testing
    ab_test_id: null as string | null,
  });

  const steps: Array<{ id: WizardStep; title: string; icon: React.ReactNode; description: string }> = [
    { id: 'account', title: 'SMS Account', icon: <Smartphone className="h-4 w-4" />, description: 'Choose the SMS service to send from' },
    { id: 'content', title: 'Content', icon: <FileTextIcon className="h-4 w-4" />, description: 'Create your SMS content and campaign basics' },
    { id: 'followups', title: 'Follow-ups', icon: <MessageSquare className="h-4 w-4" />, description: 'Set up follow-up SMS messages to increase response rates' },
    { id: 'audience', title: 'Audience', icon: <Users className="h-4 w-4" />, description: 'Select your recipients and target audience' },
    { id: 'settings', title: 'Settings', icon: <Settings className="h-4 w-4" />, description: 'Configure sending schedule and preferences' },
    { id: 'review', title: 'Review', icon: <Eye className="h-4 w-4" />, description: 'Review and launch your SMS campaign' },
  ];

  const loadCampaignData = useCallback(async () => {
    if (!currentCampaignId) return;

    try {
      const campaign = await api.getSMSCampaign(currentCampaignId);
      setCampaignData(campaign);
      setFormData(campaign);
      setSelectedNumber(campaign.sender_id || '');
      setCampaignName(campaign.name || '');
      setSelectedAbTestId((campaign as any).ab_test_id ? String((campaign as any).ab_test_id) : 'none');
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast.error('Failed to load campaign data');
    }
  }, [currentCampaignId]);

  useEffect(() => {
    loadTemplates();
    // Load AB tests for selector
    api.getABTests()
      .then((d) => setAbTests(d.items || []))
      .catch(() => setAbTests([]));
    loadExistingRecipients();
    loadAvailableNumbers();
    if (currentCampaignId) {
      loadCampaignData();
    }
  }, [currentCampaignId, loadCampaignData]);

  // Persist A/B test selection to form data
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ab_test_id: selectedAbTestId === 'none' ? null : selectedAbTestId
    }));
  }, [selectedAbTestId]);

  // Fetch available phone numbers for each connection
  const fetchConnectionNumbers = async (connectionId: string) => {
    try {
      const result = await api.getConnectionPhoneNumbers(connectionId);
      return result.phoneNumbers || [];
    } catch (error) {
      console.error(`Failed to fetch numbers for connection ${connectionId}:`, error);
      return [];
    }
  };

  const loadAvailableNumbers = async () => {
    setIsLoadingNumbers(true);
    try {
      // Get connections and fetch phone numbers dynamically
      const connections = await api.getConnections();
      const signalwireConnections = connections.filter(c => c.provider === 'signalwire' && c.status === 'active');

      const numbers: Array<{ phone_number: string, friendly_name: string }> = [];

      // Fetch numbers for each SignalWire connection
      for (const connection of signalwireConnections) {
        try {
          const connectionNumbers = await fetchConnectionNumbers(connection.id);

          if (connectionNumbers.length > 0) {
            connectionNumbers.forEach((number: { phone_number?: string; phoneNumber?: string; friendly_name?: string; friendlyName?: string }) => {
              numbers.push({
                phone_number: number.phone_number || number.phoneNumber,
                friendly_name: number.friendly_name || number.friendlyName || connection.name || 'SignalWire Number'
              });
            });
          } else {
            // Fallback to connection config if no numbers fetched
            if (connection.config?.defaultSenderNumber) {
              numbers.push({
                phone_number: connection.config.defaultSenderNumber,
                friendly_name: connection.name || 'SignalWire Number'
              });
            }
          }
        } catch (error) {
          console.error(`Failed to fetch numbers for ${connection.name}:`, error);
          // Fallback to connection config if API fails
          if (connection.config?.defaultSenderNumber) {
            numbers.push({
              phone_number: connection.config.defaultSenderNumber,
              friendly_name: connection.name || 'SignalWire Number'
            });
          }
        }
      }

      setAvailableNumbers(numbers);

      if (numbers.length === 0) {
        toast.warning('No phone numbers found in your SignalWire connections. Please set up SignalWire in the Connections page first.');
      }
    } catch (error) {
      console.error('Failed to load numbers from connections:', error);

      // Last resort fallback: try to get from SMS settings directly
      const smsSettings = await api.getSMSSettings();
      if (smsSettings.defaultSenderNumber) {
        setAvailableNumbers([{
          phone_number: smsSettings.defaultSenderNumber,
          friendly_name: 'SignalWire Number'
        }]);
      } else {
        setAvailableNumbers([]);
        toast.warning('No phone numbers configured. Please set up SignalWire in the Connections page.');
      }
    } finally {
      setIsLoadingNumbers(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await api.getSMSTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading SMS templates:', error);
      setTemplates([]);
    }
  };

  const loadExistingRecipients = async () => {
    try {
      const data = await api.getSMSRecipients();
      setExistingRecipients(data);
    } catch (error) {
      console.error('Error loading SMS recipients:', error);
      setExistingRecipients([]);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'account':
        // Allow proceeding if campaign name is entered - don't block on phone number loading
        // If no numbers are available, user can still create campaign and add numbers later
        return campaignName.trim(); // Removed isLoadingNumbers dependency
      case 'content':
        return formData.message && formData.message.trim().length > 0;
      case 'followups':
        return true; // Follow-ups are optional
      case 'audience':
        return pendingRecipients.length > 0;
      case 'settings':
        return true; // Settings have defaults
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    // Check if we can proceed before advancing
    if (!canProceedToNextStep()) {
      toast.error('Please fill in the required fields to continue');
      return;
    }

    const stepOrder: WizardStep[] = ['account', 'content', 'followups', 'audience', 'settings', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    const stepOrder: WizardStep[] = ['account', 'content', 'followups', 'audience', 'settings', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      setCurrentStep(previousStep);
    }
  };

  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a phone number to send the test to.');
      return;
    }

    if (!formData.message?.trim()) {
      toast.error('Please add SMS content before sending a test.');
      return;
    }

    if (!selectedNumber) {
      toast.error('Please select a sender number in the first step.');
      return;
    }

    setIsSendingTest(true);
    try {
      // Create a test SMS payload
      const testPayload = {
        phone_number: testPhone,
        message: `[TEST] ${formData.message}`,
        sender_number: selectedNumber,
      };

      // Send test SMS via API
      const result = await api.sendTestSMS(testPayload);

      // Add to history
      setTestSMSHistory(prev => [
        { phone: testPhone, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5 entries
      ]);

      toast.success(`Test SMS sent successfully to ${testPhone}! Status: ${result.status}`);
      setTestPhone('');
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast.error('Failed to send test SMS');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleColumnMappingComplete = (mappedData: Record<string, string>[], mapping: Record<string, string>) => {
    // Convert MappedRecipient[] to Contact[]
    const contacts: Contact[] = mappedData.map(recipient => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      phone: recipient.phone || '',
      firstName: recipient.firstName || '',
      lastName: recipient.lastName || '',
      company: recipient.company || '',
      email: '',
      status: 'pending' as const,
      type: 'sms' as const,
      createdAt: new Date().toISOString()
    }));

    setPendingRecipients(prev => [...prev, ...contacts]);
    setShowColumnMapper(false);
    setCsvData([]);
    toast.success(`${mappedData.length} recipients added from CSV`);
  };

  const handleColumnMappingCancel = () => {
    setShowColumnMapper(false);
    setCsvData([]);
  };

  const addManualRecipient = () => {
    if (!manualRecipient.phone) {
      toast.error('Please enter a phone number.');
      return;
    }

    const newContact: Contact = {
      id: `temp-${Date.now()}-${Math.random()}`,
      phone: manualRecipient.phone || '',
      firstName: manualRecipient.firstName,
      lastName: manualRecipient.lastName,
      company: manualRecipient.company,
      email: '',
      status: 'pending' as const,
      type: 'sms' as const,
      createdAt: new Date().toISOString()
    };

    setPendingRecipients(prev => [...prev, newContact]);
    setManualRecipient({});
    toast.success('Recipient added to the list.');
  };

  const handleLaunchCampaign = async () => {
    try {
      let campaignId = currentCampaignId;

      // Create or update campaign
      if (!campaignId) {
        const payload = {
          name: campaignName,
          message: formData.message,
          sender_number: selectedNumber,
          totalRecipients: pendingRecipients.length,
          status: 'scheduled' as const,
        };

        const campaign = await api.createSMSCampaign(payload);
        campaignId = campaign.id;
        setCurrentCampaignId(campaign.id);
        toast.success(`${campaign.name} has been created successfully.`);
      } else {
        const payload = {
          name: campaignName,
          message: formData.message,
          sender_number: selectedNumber,
          totalRecipients: pendingRecipients.length,
          status: 'scheduled' as const,
        };

        await api.updateSMSCampaign(currentCampaignId, payload);
        toast.success(`${payload.name} has been updated successfully.`);
      }

      // Create follow-ups
      if (campaignId && followUpSMSs.length > 0) {
        try {
          // Create a sequence for the follow-ups
          const sequenceData = {
            name: `${campaignName} Follow-ups`,
            description: `Auto-generated follow-up sequence for campaign: ${campaignName}`,
            steps: followUpSMSs.map((sms, index) => ({
              id: `temp-${index}`,
              sequence_id: 'temp',
              message: sms.content,
              delay_hours: sms.delayDays * 24, // Convert days to hours
              delay_amount: sms.delayDays * 24, // Convert days to hours
              delay_unit: 'hours',
              step_order: index + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          };

          const sequence = await api.createSMSSequence(sequenceData);

          // Update the campaign to link it with the sequence
          await api.updateSMSCampaign(campaignId, {
            sequence_id: sequence.id
          });

          toast.success(`${followUpSMSs.length} follow-up SMS messages have been created for this campaign.`);
        } catch (err: unknown) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : 'Could not create follow-ups';
          toast.error(`Failed to create follow-ups: ${errorMessage}`);
        }
      }

      // Add recipients if any
      if (pendingRecipients.length > 0 && campaignId) {
        try {
          const recipientData = pendingRecipients.map(r => ({
            campaignId: campaignId,
            phone: r.phone || '',
            name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || '',
            company: r.company || ''
          }));

          await api.addSMSRecipients(recipientData);
          toast.success(`${pendingRecipients.length} recipients added to campaign`);
        } catch (err: unknown) {
          console.error('Error adding recipients:', err);
          const errorMessage = err instanceof Error ? err.message : 'Could not add recipients';
          toast.error(`Failed to add recipients: ${errorMessage}`);
        }
      }

      // Navigate back to campaigns list
      navigate('/reach/outbound/sms/campaigns');

    } catch (error) {
      console.error('Error launching campaign:', error);
      toast.error('Failed to launch campaign');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'account':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SMS Account
                </CardTitle>
                <CardDescription>Choose the SMS service to send from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    placeholder="Q1 Product Launch SMS"
                    value={campaignName}
                    onChange={(e) => {
                      console.log('Campaign name changed:', e.target.value);
                      setCampaignName(e.target.value);
                    }}
                    required
                  />

                </div>

                <div className="space-y-2">
                  <Label>A/B Test (Optional)</Label>
                  <Select
                    value={selectedAbTestId}
                    onValueChange={(value) => {
                      setSelectedAbTestId(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {abTests
                        .filter(t => t.test_type === 'sms_content')
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose an A/B test to apply to this SMS campaign.
                  </p>
                </div>

                {isLoadingNumbers ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg dark:border-gray-600 dark:text-gray-300">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Loading Phone Numbers...</h3>
                    <p className="text-sm mb-4">Connecting to SignalWire to fetch available numbers.</p>
                  </div>
                ) : availableNumbers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="senderNumber">Sender Phone Number</Label>
                      <Select
                        value={selectedNumber}
                        onValueChange={(value) => {
                          setSelectedNumber(value);
                          setFormData(prev => ({ ...prev, sender_id: value, name: campaignName }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a phone number..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNumbers.map((numberObj) => (
                            <SelectItem key={numberObj.phone_number} value={numberObj.phone_number}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <div className="flex flex-col">
                                  <span className="font-mono">{numberObj.phone_number}</span>
                                  {numberObj.friendly_name && numberObj.friendly_name !== numberObj.phone_number && (
                                    <span className="text-xs text-muted-foreground">{numberObj.friendly_name}</span>
                                  )}
                                </div>
                                <Badge variant="secondary" className="ml-2">SignalWire</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedNumber && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">
                            Number "{selectedNumber}" selected
                          </p>
                          <p className="text-green-700 dark:text-green-400">
                            Your SMS campaign will be sent from this phone number. Recipients will see this as the sender.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg dark:border-gray-600 dark:text-gray-300">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2 dark:text-gray-200">No Phone Numbers Available</h3>
                    <p className="text-sm mb-4">No phone numbers found in your SignalWire account or connection failed.</p>
                    <div className="flex gap-2 justify-center mb-4">
                      <Button
                        onClick={loadAvailableNumbers}
                        variant="outline"
                        disabled={isLoadingNumbers}
                      >
                        {isLoadingNumbers ? 'Retrying...' : 'Retry Connection'}
                      </Button>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-left">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">You can still create your campaign</p>
                          <p className="text-yellow-700 dark:text-yellow-400">
                            You can proceed without selecting a phone number now and configure it later in campaign settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Campaign Content
                </CardTitle>
                <CardDescription>Create your SMS content and campaign basics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template">SMS Template (Optional)</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(value) => {
                      setSelectedTemplateId(value);
                      if (value === 'none') {
                        setFormData(prev => ({ ...prev, message: '' }));
                      } else {
                        const template = templates.find(t => t.id === value);
                        if (template) {
                          setFormData(prev => ({ ...prev, message: template.message }));
                        }
                      }
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template or start from scratch..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template - start from scratch</SelectItem>
                      {Array.isArray(templates) && templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {template.message}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">SMS Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, message: e.target.value }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Write your SMS message here. Use {{firstName}}, {{lastName}}, {{company}} for personalization..."
                    className="min-h-[120px]"
                    maxLength={160}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{company}}'}, {'{{unsubscribeUrl}}'}</span>
                    <span>{formData.message?.length || 0}/160 characters</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test SMS Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Test SMS
                </CardTitle>
                <CardDescription>
                  Send a test SMS to verify your content before launching the campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter phone number for testing (e.g., +1234567890)"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      type="tel"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendTestSMS();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSendTestSMS}
                    disabled={isSendingTest || !testPhone.trim() || !formData.message?.trim()}
                  >
                    {isSendingTest ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>

                {testSMSHistory.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Recent Test SMS</Label>
                    <div className="space-y-1">
                      {testSMSHistory.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-muted-foreground bg-muted dark:bg-gray-700 dark:text-gray-300 p-2 rounded">
                          <span>{entry.phone}</span>
                          <span>{entry.timestamp.toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground dark:text-gray-300">
                  <p>• Test SMS will be prefixed with "[TEST]"</p>
                  <p>• You can send multiple test messages to the same number</p>
                  <p>• Make sure to select an SMS account in the first step</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'followups':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Follow-up SMS Messages
                </CardTitle>
                <CardDescription>
                  Set up follow-up SMS messages to increase response rates (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {followUpSMSs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg dark:border-gray-600 dark:text-gray-300">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2 dark:text-gray-200">No Follow-up SMS Messages</h3>
                    <p className="text-sm mb-4">Add follow-up SMS messages to increase engagement</p>
                    <Button
                      onClick={() => {
                        setFollowUpSMSs([{
                          content: '',
                          delayDays: 3,
                          smsOrder: 1
                        }]);
                      }}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Follow-up SMS
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followUpSMSs.map((sms, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Follow-up SMS {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFollowUpSMSs(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Delay (days after previous message)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={sms.delayDays}
                              onChange={(e) => {
                                const newFollowUps = [...followUpSMSs];
                                newFollowUps[index].delayDays = parseInt(e.target.value) || 1;
                                setFollowUpSMSs(newFollowUps);
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>SMS Content</Label>
                          <Textarea
                            value={sms.content}
                            onChange={(e) => {
                              const newFollowUps = [...followUpSMSs];
                              newFollowUps[index].content = e.target.value;
                              setFollowUpSMSs(newFollowUps);
                            }}
                            placeholder="Enter follow-up SMS content..."
                            className="min-h-[100px]"
                            maxLength={160}
                          />
                          <div className="text-xs text-muted-foreground dark:text-gray-300 text-right">
                            {sms.content.length}/160 characters
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={() => {
                        setFollowUpSMSs(prev => [...prev, {
                          content: '',
                          delayDays: 7,
                          smsOrder: prev.length + 1
                        }]);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Follow-up SMS
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'audience':
        return (
          <div className="space-y-6">
            <UnifiedContactSelector
              campaignType="sms"
              selectedContacts={pendingRecipients}
              onContactsChange={(contacts: Contact[]) => {
                setPendingRecipients(contacts);
                setHasUnsavedChanges(true);
              }}
              showUpload={true}
              className="w-full"
            />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Campaign Settings
                </CardTitle>
                <CardDescription>Configure sending schedule and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sending Schedule */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Sending Schedule</Label>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useCustomScheduling"
                        checked={formData.useCustomScheduling}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({ ...prev, useCustomScheduling: checked as boolean }));
                        }}
                      />
                      <Label htmlFor="useCustomScheduling">Use custom scheduling</Label>
                    </div>

                    {formData.useCustomScheduling && (
                      <div className="space-y-4 pl-6 border-l-2 border-muted dark:border-gray-600 dark:text-gray-300">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="scheduledAt">Send Date & Time</Label>
                            <Input
                              id="scheduledAt"
                              type="datetime-local"
                              value={formData.scheduledAt}
                              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select
                              value={formData.timezone}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Sending Window */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Sending Window</Label>

                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="respectSendingWindow"
                      checked={formData.respectSendingWindow}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ ...prev, respectSendingWindow: checked as boolean }));
                      }}
                    />
                    <Label htmlFor="respectSendingWindow">Only send during specific hours</Label>
                  </div>

                  {formData.respectSendingWindow && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted dark:border-gray-600">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="sendingWindowStart">Start Time</Label>
                          <Input
                            id="sendingWindowStart"
                            type="time"
                            value={formData.sendingWindowStart}
                            onChange={(e) => setFormData(prev => ({ ...prev, sendingWindowStart: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sendingWindowEnd">End Time</Label>
                          <Input
                            id="sendingWindowEnd"
                            type="time"
                            value={formData.sendingWindowEnd}
                            onChange={(e) => setFormData(prev => ({ ...prev, sendingWindowEnd: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Sending Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={formData.sendingDays?.includes(day) || false}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    sendingDays: checked
                                      ? [...(prev.sendingDays || []), day]
                                      : (prev.sendingDays || []).filter(d => d !== day)
                                  }));
                                }}
                              />
                              <Label htmlFor={day} className="text-sm capitalize">
                                {day.slice(0, 3)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* SMS Sending Configuration */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">SMS Sending Configuration</Label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smsDelay">Delay Between SMS (seconds)</Label>
                      <Input
                        id="smsDelay"
                        type="number"
                        min="1"
                        value={formData.smsDelay}
                        onChange={(e) => setFormData(prev => ({ ...prev, smsDelay: parseInt(e.target.value) || 5 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Batch Size</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        min="1"
                        value={formData.batchSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 50 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        min="0"
                        max="5"
                        value={formData.retry_attempts}
                        onChange={(e) => setFormData(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Sending Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: 'low' | 'normal' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Unsubscribe Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Unsubscribe Settings</Label>

                  <div className="space-y-2">
                    <Label htmlFor="unsubscribePlainText">Unsubscribe Text</Label>
                    <Textarea
                      id="unsubscribePlainText"
                      value={formData.unsubscribePlainText}
                      onChange={(e) => setFormData(prev => ({ ...prev, unsubscribePlainText: e.target.value }))}
                      placeholder="Reply STOP to unsubscribe: {{unsubscribeUrl}}"
                      className="min-h-[60px]"
                    />
                    <p className="text-xs text-muted-foreground dark:text-gray-300">
                      Use {'{{unsubscribeUrl}}'} to include the unsubscribe link
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            {/* Campaign Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Campaign Summary
                </CardTitle>
                <CardDescription>Review your SMS campaign before launching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Name</Label>
                      <p className="text-sm font-semibold">{campaignName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender Number</Label>
                      <p className="text-sm font-semibold">{selectedNumber}</p>
                      <p className="text-xs text-muted-foreground">Signalwire</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipients</Label>
                      <p className="text-sm font-semibold">{pendingRecipients.length} recipients</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-300">
                        Method: {recipientMethod === 'csv' ? 'CSV Upload' : recipientMethod === 'manual' ? 'Manual Entry' : 'Existing Recipients'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Follow-ups</Label>
                      <p className="text-sm font-semibold">
                        {followUpSMSs.length} follow-up SMS message{followUpSMSs.length !== 1 ? 's' : ''} configured
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-300">
                        {followUpSMSs.length === 0 ? 'No follow-up messages' : 'SMS follow-up sequence'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SMS Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  SMS Preview
                </CardTitle>
                <CardDescription>How your initial SMS will appear to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg bg-white dark:bg-gray-800 max-w-sm mx-auto">
                  {/* SMS Header */}
                  <div className="border-b p-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>From: {selectedNumber || 'No number selected'}</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* SMS Body */}
                  <div className="p-4">
                    <div className="bg-blue-500 dark:bg-blue-600 text-white rounded-lg p-3 max-w-[80%] ml-auto">
                      <p className="text-sm whitespace-pre-wrap">
                        {formData.message?.replace(/\{\{firstName\}\}/g, 'John')
                          .replace(/\{\{lastName\}\}/g, 'Doe')
                          .replace(/\{\{company\}\}/g, 'Acme Corp')
                          .replace(/\{\{unsubscribeUrl\}\}/g, 'https://example.com/unsubscribe') || 'Your SMS message will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Details */}
            {followUpSMSs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Follow-up Details
                  </CardTitle>
                  <CardDescription>Your configured follow-up SMS messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                      SMS Follow-up Sequence ({followUpSMSs.length} message{followUpSMSs.length !== 1 ? 's' : ''})
                    </div>
                    <div className="space-y-3">
                      {followUpSMSs.map((sms, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-muted dark:bg-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">SMS Follow-up {index + 1}</Badge>
                            <span className="text-xs text-muted-foreground dark:text-gray-300">
                              Delay: {sms.delayDays} day{sms.delayDays !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground dark:text-gray-300">Content Preview</Label>
                              <div className="text-sm text-muted-foreground dark:text-gray-300 max-h-20 overflow-hidden">
                                {sms.content.substring(0, 100)}{sms.content.length > 100 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Launch Campaign */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Launch Campaign
                </CardTitle>
                <CardDescription>Ready to send your SMS campaign?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Ready to Launch</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Your SMS campaign is configured and ready to be sent to {pendingRecipients.length} recipient{pendingRecipients.length !== 1 ? 's' : ''}.
                          {followUpSMSs.length > 0 && ` ${followUpSMSs.length} follow-up message${followUpSMSs.length !== 1 ? 's' : ''} will be sent automatically.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleLaunchCampaign}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Launch SMS Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground dark:text-gray-300">Loading step content...</p>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mt-2">Current step: {currentStep}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[18px] font-bold text-foreground">
              {currentCampaignId ? 'Edit SMS Campaign' : 'Create SMS Campaign'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Set up your SMS marketing campaign with our step-by-step wizard
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/reach/outbound/sms/campaigns')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>

        {/* Progress Steps with Xordon styling */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);
              const isCompleted = getCurrentStepIndex() > index;
              const isActive = getCurrentStepIndex() === index;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getCurrentStepIndex() >= index
                      ? 'bg-hunter-orange border-hunter-orange text-white'
                      : 'border-border text-muted-foreground'
                    }`}>
                    {getCurrentStepIndex() > index ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-2 ${getCurrentStepIndex() > index ? 'bg-hunter-orange' : 'bg-border'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{steps[steps.findIndex(s => s.id === currentStep)].title}</span>
              <span className="text-muted-foreground">{steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-hunter-orange h-2 rounded-full transition-all duration-300"
                style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{steps[steps.findIndex(s => s.id === currentStep)].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'account'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep !== 'review' ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleLaunchCampaign}
              >
                <Send className="h-4 w-4 mr-2" />
                Launch Campaign
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSCampaignWizard;

