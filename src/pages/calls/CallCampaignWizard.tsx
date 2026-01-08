import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UnifiedContactSelector } from '@/components/UnifiedContactSelector';
import {
  Phone,
  Users,
  Settings,
  FileTextIcon,
  Upload,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Save,
  Play,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  Search,
  X
} from 'lucide-react';
import { api, CallCampaign as ApiCallCampaign, CallRecipient as ApiCallRecipient, CallScript } from '@/lib/api';
import { CallCampaign, CallRecipient, Contact } from '@/types';
import { useCampaignSettings } from '@/hooks/useCampaignSettings';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Call Script Selector Component
interface CallScriptSelectorProps {
  selectedScriptId: string;
  onScriptChange: (scriptId: string, scriptContent: string) => void;
}

const CallScriptSelector: React.FC<CallScriptSelectorProps> = ({ selectedScriptId, onScriptChange }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewScript, setPreviewScript] = useState<CallScript | null>(null);
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptContent, setNewScriptContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const { data: scripts = [], isLoading, refetch } = useQuery({
    queryKey: ['call-scripts'],
    queryFn: async () => {
      const result = await api.getCallScripts();
      return result;
    }
  });

  const createScriptMutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
      return await api.createCallScript({
        name: data.name,
        content: data.content,
        description: 'Created from campaign wizard',
        category: 'general'
      });
    },
    onSuccess: (newScript) => {
      toast({
        title: 'Script Created',
        description: 'Your call script has been saved as a template'
      });
      setShowCreateDialog(false);
      setNewScriptName('');
      setNewScriptContent('');
      refetch();
      onScriptChange(newScript.id, newScript.script || '');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create script template',
        variant: 'destructive'
      });
    }
  });

  const filteredScripts = scripts.filter((script: CallScript) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      script.name?.toLowerCase().includes(query) ||
      script.description?.toLowerCase().includes(query) ||
      script.script?.toLowerCase().includes(query)
    );
  });

  const handleCreateScript = () => {
    if (!newScriptName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your script',
        variant: 'destructive'
      });
      return;
    }
    if (!newScriptContent.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter script content',
        variant: 'destructive'
      });
      return;
    }
    createScriptMutation.mutate({ name: newScriptName, content: newScriptContent });
  };

  const handlePreview = (script: CallScript) => {
    setPreviewScript(script);
    setShowPreviewDialog(true);
  };

  const handleSelectFromPreview = () => {
    if (previewScript) {
      onScriptChange(previewScript.id, previewScript.script || '');
      setShowPreviewDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading scripts...</span>
      </div>
    );
  }

  const selectedScript = scripts.find((s: CallScript) => s.id === selectedScriptId);

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-start space-x-2">
          <MessageSquare className="h-4 w-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Call Script Templates</p>
            <p className="text-xs text-green-700 mt-1">
              Select an existing script template or create a new one. Scripts help guide your conversations and can be customized with variables.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search scripts by name or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Call Script Template</DialogTitle>
              <DialogDescription>
                Create a reusable script template that can be used across multiple campaigns
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scriptName">Script Name *</Label>
                <Input
                  id="scriptName"
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  placeholder="e.g., Sales Outreach Script"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scriptContent">Script Content *</Label>
                <Textarea
                  id="scriptContent"
                  value={newScriptContent}
                  onChange={(e) => setNewScriptContent(e.target.value)}
                  placeholder="Hi {{firstName}}, this is {{callerName}} from {{companyName}}..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like {'{{firstName}}'}, {'{{company}}'}, {'{{callerName}}'} to personalize your script
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateScript} disabled={createScriptMutation.isPending}>
                {createScriptMutation.isPending ? 'Creating...' : 'Create Script'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-lg">
          <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Script Templates</h3>
          <p className="text-muted-foreground mb-4">
            Create your first call script template to guide your conversations
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Script Template
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Script Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* No Script Option */}
                <TableRow
                  className={`cursor-pointer ${!selectedScriptId ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => onScriptChange('', '')}
                >
                  <TableCell>
                    {!selectedScriptId && <CheckCircle className="h-5 w-5 text-primary" />}
                  </TableCell>
                  <TableCell className="font-medium">No Script</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    Call without a script template. Freestyle your conversations.
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScriptChange('', '');
                      }}
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Script Templates */}
                {filteredScripts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No scripts match your search
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScripts.map((script: CallScript) => (
                    <TableRow
                      key={script.id}
                      className={`cursor-pointer ${selectedScriptId === script.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => onScriptChange(script.id, script.script || '')}
                    >
                      <TableCell>
                        {selectedScriptId === script.id && <CheckCircle className="h-5 w-5 text-primary" />}
                      </TableCell>
                      <TableCell className="font-medium">{script.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {script.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(script);
                            }}
                          >
                            <FileTextIcon className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {selectedScriptId && selectedScript && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Selected: {selectedScript.name}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      This script will be available during your calls for guidance.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(selectedScript)}
                >
                  <FileTextIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {previewScript?.name}
            </DialogTitle>
            <DialogDescription>
              {previewScript?.description || 'Script preview'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {previewScript?.script || 'No script content available'}
              </pre>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-700">
                    Variables like {'{{firstName}}'}, {'{{company}}'}, and {'{{callerName}}'} will be automatically replaced with actual values during calls.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            {selectedScriptId !== previewScript?.id && (
              <Button onClick={handleSelectFromPreview}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Select This Script
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start space-x-2">
          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Script Tips</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Use scripts as a guide, not a rigid template</li>
              <li>• Personalize with variables like {'{{firstName}}'} and {'{{company}}'}</li>
              <li>• Keep scripts conversational and natural</li>
              <li>• You can skip using a script if you prefer freestyle calling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contact Selector Component


interface CampaignData {
  name: string;
  description: string;
  callScript: string;  // Script ID or direct content
  callScriptContent: string;  // Actual script content
  callProvider: string;
  callerId: string;
  agentId: string;  // Selected agent ID
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
}

interface FieldMapping {
  csvField: string;
  systemField: string;
}

const CallCampaignWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: campaignId } = useParams<{ id: string }>();
  const isEditMode = Boolean(campaignId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings: campaignSettings, loading: settingsLoading, validateRequiredSettings, validateConsistency } = useCampaignSettings();

  // Ref to prevent repeated validation toasts
  const hasValidatedSettingsRef = useRef(false);

  // Add error boundary for debugging
  useEffect(() => {
    console.log('CallCampaignWizard: Component mounted');
    console.log('CallCampaignWizard: Edit mode:', isEditMode, 'Campaign ID:', campaignId);
    console.log('CallCampaignWizard: Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VITE_DEV_MODE: import.meta.env.VITE_DEV_MODE,
      DEV: import.meta.env.DEV
    });
  }, [isEditMode, campaignId]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(isEditMode);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    callScript: '',
    callScriptContent: '',
    callProvider: 'signalwire',
    callerId: '',
    agentId: '',
    recipients: [],
    scheduleType: 'immediate',
    timezone: campaignSettings.call.timezone,
    dailyStartTime: campaignSettings.call.workingHoursStart,
    dailyEndTime: campaignSettings.call.workingHoursEnd,
    callDelay: campaignSettings.call.callDelay,
    voicemailEnabled: true,
    recordingEnabled: true,
    maxRetries: campaignSettings.call.maxRetries,
    retryDelay: campaignSettings.call.retryDelay
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [availableCallerIds, setAvailableCallerIds] = useState<Array<{ phone_number: string, friendly_name: string, connection_id: string }>>([]);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);

  // Load existing campaign data in edit mode
  useEffect(() => {
    const loadCampaignData = async () => {
      if (isEditMode && campaignId) {
        setIsLoadingCampaign(true);
        try {
          // Fetch campaign details
          const campaign = await api.getCallCampaign(campaignId);
          console.log('Loaded campaign for editing:', campaign);

          // Fetch campaign recipients
          const recipients = await api.getCallRecipients(campaignId);
          console.log('Loaded campaign recipients:', recipients);

          // Map recipients to the expected format (using any to bypass strict type checking for API response)
          const mappedRecipients = recipients.map((r: Contact) => ({
            id: r.id,
            phone: r.phone || r.phone_number || '',
            firstName: r.firstName || r.first_name || '',
            lastName: r.lastName || r.last_name || '',
            email: r.email || '',
            company: r.company || '',
            title: r.title || '',
            status: r.status || 'pending',
            callCount: r.callCount || r.call_count || 0,
            lastCallAt: r.lastCallAt || r.last_call_at || undefined,
            notes: r.notes || '',
            customFields: r.customFields || {},
            createdAt: r.createdAt || r.created_at || new Date().toISOString(),
            updatedAt: r.updatedAt || r.updated_at || new Date().toISOString()
          })) as CallRecipient[];

          // Update campaign data with loaded values
          setCampaignData(prev => ({
            ...prev,
            name: campaign.name || '',
            description: campaign.description || '',
            callScript: campaign.call_script || '',
            callScriptContent: campaign.call_script || '',  // Store the actual content
            callProvider: campaign.call_provider || 'signalwire',
            callerId: campaign.caller_id || '',
            agentId: campaign.agent_id || '',
            recipients: mappedRecipients,
          }));

          toast({
            title: 'Campaign Loaded',
            description: `Editing "${campaign.name}" with ${mappedRecipients.length} contacts`,
          });
        } catch (error) {
          console.error('Failed to load campaign:', error);
          toast({
            title: 'Error',
            description: 'Failed to load campaign data',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingCampaign(false);
        }
      }
    };

    loadCampaignData();
  }, [isEditMode, campaignId]);

  // Update campaign data when settings load
  useEffect(() => {
    if (!settingsLoading && !isEditMode) {
      setCampaignData(prev => ({
        ...prev,
        timezone: campaignSettings.call.timezone,
        dailyStartTime: campaignSettings.call.workingHoursStart,
        dailyEndTime: campaignSettings.call.workingHoursEnd,
        callDelay: campaignSettings.call.callDelay,
        maxRetries: campaignSettings.call.maxRetries,
        retryDelay: campaignSettings.call.retryDelay,
      }));
    }
  }, [settingsLoading, campaignSettings, isEditMode]);

  // Validate required settings before proceeding (only once when settings are loaded)
  useEffect(() => {
    if (!settingsLoading && !hasValidatedSettingsRef.current) {
      hasValidatedSettingsRef.current = true;

      const validation = validateRequiredSettings('call');
      if (!validation.valid) {
        toast({
          title: 'Missing Required Settings',
          description: `Please configure: ${validation.missing.join(', ')} in Settings page`,
          variant: 'destructive',
        });
      }

      // Check for settings consistency
      const consistency = validateConsistency();
      if (!consistency.valid) {
        toast({
          title: 'Settings Inconsistency Detected',
          description: consistency.inconsistencies.join('. '),
          variant: 'destructive',
        });
      }
    }
  }, [settingsLoading]);

  // Handle workflow state from call campaign creation
  React.useEffect(() => {
    const workflowState = location.state as { scriptId?: string; workflow?: string };
    if (workflowState?.workflow === 'call-campaign-creation' && workflowState?.scriptId) {
      // Pre-select the script that was created in the previous step
      setCampaignData(prev => ({ ...prev, callScript: workflowState.scriptId! }));
    }
  }, [location.state]);

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      try {
        console.log('CallCampaignWizard: Fetching connections...');
        const response = await api.getConnections();
        console.log('CallCampaignWizard: Connections fetched:', response);
        return response || [];
      } catch (error) {
        console.error('CallCampaignWizard: Failed to fetch connections:', error);
        return [];
      }
    },
    staleTime: 15 * 1000, // 15 seconds - aggressive memory optimization
    gcTime: 30 * 1000, // 30 seconds - fast garbage collection
    retry: 1
  });

  // Fetch available agents
  const { data: agents = [] } = useQuery({
    queryKey: ['call-agents'],
    queryFn: async () => {
      try {
        const response = await api.getCallAgents();
        return response || [];
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        return [];
      }
    },
    staleTime: 15 * 1000, // 15 seconds - aggressive memory optimization
    gcTime: 30 * 1000 // 30 seconds - fast garbage collection
  });

  // Fetch available phone numbers for each connection
  const fetchConnectionNumbers = async (connectionId: string) => {
    try {
      console.log(`Fetching phone numbers for connection: ${connectionId}`);
      const result = await api.getConnectionPhoneNumbers(connectionId);
      console.log(`Fetched numbers for connection ${connectionId}:`, result);
      return result.phoneNumbers || [];
    } catch (error) {
      console.error(`Failed to fetch numbers for connection ${connectionId}:`, error);
      return [];
    }
  };

  // Populate available caller IDs from connections and their phone numbers
  React.useEffect(() => {
    console.log('CallCampaignWizard: Loading numbers, connections:', connections);
    const loadAllNumbers = async () => {
      if (connections && connections.length > 0) {
        setIsLoadingNumbers(true);
        const allCallerIds: Array<{ phone_number: string, friendly_name: string, connection_id: string }> = [];

        console.log('CallCampaignWizard: Processing connections:', connections);

        // Process each connection - use cached numbers first for fast loading
        for (const connection of connections) {
          if (connection.status === 'active') {
            console.log('CallCampaignWizard: Processing connection:', connection);

            // First, check if connection already has cached phone numbers
            const cachedNumbers = connection.phoneNumbers || connection.phone_numbers || [];
            if (cachedNumbers.length > 0) {
              console.log(`Using ${cachedNumbers.length} cached numbers for connection ${connection.id}`);
              cachedNumbers.forEach((number: { phone_number?: string; phoneNumber?: string; friendly_name?: string; friendlyName?: string }) => {
                allCallerIds.push({
                  phone_number: number.phone_number || number.phoneNumber || '',
                  friendly_name: number.friendly_name || number.friendlyName || number.phone_number || number.phoneNumber || '',
                  connection_id: connection.id
                });
              });
            } else if (connection.provider === 'signalwire' || connection.provider === 'twilio') {
              // Only fetch from API if no cached numbers
              try {
                console.log(`No cached numbers, fetching from API for connection ${connection.id}...`);
                const numbers = await fetchConnectionNumbers(connection.id);
                console.log(`Fetched ${numbers.length} numbers for connection ${connection.id}:`, numbers);

                if (numbers.length > 0) {
                  numbers.forEach((number: { phone_number?: string; phoneNumber?: string; friendly_name?: string; friendlyName?: string }) => {
                    allCallerIds.push({
                      phone_number: number.phone_number || number.phoneNumber || '',
                      friendly_name: number.friendly_name || number.friendlyName || number.phone_number || number.phoneNumber || '',
                      connection_id: connection.id
                    });
                  });
                } else if (connection.config?.defaultSenderNumber) {
                  // Fallback to config if no numbers fetched
                  allCallerIds.push({
                    phone_number: connection.config.defaultSenderNumber,
                    friendly_name: connection.config.defaultSenderNumber,
                    connection_id: connection.id
                  });
                }
              } catch (error) {
                console.error(`Failed to fetch numbers for ${connection.name}:`, error);
                // Fallback to connection config if API fails
                if (connection.config?.defaultSenderNumber) {
                  allCallerIds.push({
                    phone_number: connection.config.defaultSenderNumber,
                    friendly_name: connection.config.defaultSenderNumber,
                    connection_id: connection.id
                  });
                }
              }
            } else if (connection.provider === 'vonage' && connection.config?.phoneNumber) {
              // Vonage fallback to config
              allCallerIds.push({
                phone_number: connection.config.phoneNumber,
                friendly_name: connection.config.phoneNumber,
                connection_id: connection.id
              });
            }
          }
        }

        console.log('CallCampaignWizard: Final caller IDs:', allCallerIds);
        setAvailableCallerIds(allCallerIds);
        setIsLoadingNumbers(false);

        // Auto-select first available caller ID if none selected
        if (!campaignData.callerId && allCallerIds.length > 0) {
          setCampaignData(prev => ({
            ...prev,
            callerId: allCallerIds[0].phone_number,
            callProvider: connections.find(c => c.id === allCallerIds[0].connection_id)?.provider || 'signalwire'
          }));
        }
      } else {
        console.log('CallCampaignWizard: No connections available');
        setIsLoadingNumbers(false);
      }
    };

    loadAllNumbers();
  }, [connections, campaignData.callerId]);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: Partial<ApiCallCampaign>) => {
      console.log('Creating campaign with data:', data);
      console.log('Recipients to add:', campaignData.recipients);

      // Create the campaign first
      const campaign = await api.createCallCampaign(data);
      console.log('Campaign created:', campaign);

      if (!campaign || !campaign.id) {
        throw new Error('Failed to create campaign - no ID returned');
      }

      // If we have recipients, add them to the campaign
      if (campaignData.recipients && campaignData.recipients.length > 0) {
        console.log(`Adding ${campaignData.recipients.length} recipients to campaign ${campaign.id}`);

        let successCount = 0;
        let failCount = 0;

        // Add each recipient to the campaign
        for (const recipient of campaignData.recipients) {
          try {
            console.log('Adding recipient:', recipient);
            const result = await api.createCallRecipient({
              campaign_id: campaign.id,
              phone: recipient.phone,
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              email: recipient.email || '',
              company: recipient.company || '',
              title: recipient.title || '',
              status: 'pending'
            } as Partial<ApiCallRecipient>);
            console.log('Recipient added:', result);
            successCount++;
          } catch (error) {
            console.error('Failed to add recipient:', recipient, error);
            failCount++;
          }
        }

        console.log(`Recipients added: ${successCount} success, ${failCount} failed`);
      }

      return campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['call-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['call-campaign-recipients', data.id] });
      toast({
        title: 'Success',
        description: `Call campaign created with ${campaignData.recipients.length} contacts`,
      });

      // Navigate to campaign details page with the new campaign
      navigate(`/reach/outbound/calls/campaigns/${data.id}`, { state: { campaign: data } });
    },
    onError: (error) => {
      console.error('Create campaign error:', error);

      // Extract detailed error message
      let errorMessage = 'Failed to create call campaign';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: Partial<ApiCallCampaign>) => {
      console.log('Updating campaign with data:', data);
      console.log('Recipients to add:', campaignData.recipients);

      // Update the campaign
      await api.updateCallCampaign(campaignId!, data);

      // If we have NEW recipients (not already in the campaign), add them
      if (campaignData.recipients && campaignData.recipients.length > 0) {
        // Get existing recipients to avoid duplicates
        const existingRecipients = await api.getCallRecipients(campaignId!);
        const existingPhones = new Set(existingRecipients.map((r: CallRecipient) => r.phone || r.phone_number));

        // Filter to only new recipients
        const newRecipients = campaignData.recipients.filter(r => !existingPhones.has(r.phone));

        if (newRecipients.length > 0) {
          console.log(`Adding ${newRecipients.length} new recipients to campaign ${campaignId}`);

          let successCount = 0;
          let failCount = 0;

          for (const recipient of newRecipients) {
            // Skip recipients without phone numbers
            if (!recipient.phone) {
              console.warn('Skipping recipient without phone:', recipient);
              failCount++;
              continue;
            }

            try {
              console.log('Adding recipient:', recipient);
              const result = await api.createCallRecipient({
                campaign_id: campaignId!,
                phone: recipient.phone,
                firstName: recipient.firstName,
                lastName: recipient.lastName,
                email: recipient.email || '',
                company: recipient.company || '',
                title: recipient.title || '',
                status: 'pending'
              } as { [key: string]: unknown });
              console.log('Recipient added successfully:', result);
              successCount++;
            } catch (error) {
              console.error('Failed to add recipient:', recipient, error);
              failCount++;
            }
          }

          console.log(`Recipients added: ${successCount} success, ${failCount} failed`);

          if (failCount > 0 && successCount === 0) {
            throw new Error(`Failed to add all ${failCount} recipients`);
          }
        } else {
          console.log('No new recipients to add (all already exist or none selected)');
        }
      }

      // Return the updated campaign data
      return { ...data, id: campaignId! } as ApiCallCampaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['call-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['call-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['call-campaign-recipients', campaignId] });
      toast({
        title: 'Success',
        description: `Call campaign updated with ${campaignData.recipients.length} contacts`,
      });

      // Navigate to campaign details page
      navigate(`/reach/outbound/calls/campaigns/${campaignId}`);
    },
    onError: (error) => {
      console.error('Failed to update campaign:', error);

      // Extract detailed error message
      let errorMessage = 'Failed to update call campaign';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const preview = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim()));
        setCsvPreview([headers, ...preview]);

        // Auto-map common fields
        const mappings: FieldMapping[] = headers.map(header => ({
          csvField: header,
          systemField: getSystemFieldMapping(header)
        }));
        setFieldMappings(mappings);
      };
      reader.readAsText(file);
    }
  };

  const getSystemFieldMapping = (csvField: string): string => {
    const field = csvField.toLowerCase();
    if (field.includes('first') && field.includes('name')) return 'firstName';
    if (field.includes('last') && field.includes('name')) return 'lastName';
    if (field.includes('name')) return 'name';
    if (field.includes('email')) return 'email';
    if (field.includes('phone')) return 'phone';
    if (field.includes('company')) return 'company';
    if (field.includes('title')) return 'title';
    return 'none';
  };

  const handleFieldMappingChange = (index: number, systemField: string) => {
    const newMappings = [...fieldMappings];
    newMappings[index].systemField = systemField;
    setFieldMappings(newMappings);
  };

  const processCsvData = (): CallRecipient[] => {
    if (!csvPreview.length || !fieldMappings.length) return [];

    const headers = csvPreview[0];
    const dataRows = csvPreview.slice(1);

    return dataRows.map((row, index) => {
      const recipient: CallRecipient = {
        id: `temp-${index}`,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        customFields: {}
      };

      fieldMappings.forEach(mapping => {
        if (mapping.systemField && mapping.systemField !== 'none' && mapping.csvField) {
          const csvIndex = headers.indexOf(mapping.csvField);
          if (csvIndex !== -1 && row[csvIndex]) {
            const value = row[csvIndex];
            switch (mapping.systemField) {
              case 'firstName':
                recipient.firstName = value;
                break;
              case 'lastName':
                recipient.lastName = value;
                break;
              case 'name': {
                const nameParts = value.split(' ');
                recipient.firstName = nameParts[0] || '';
                recipient.lastName = nameParts.slice(1).join(' ') || '';
                break;
              }
              case 'email':
                recipient.email = value;
                break;
              case 'phone':
                recipient.phone = value;
                break;
              case 'company':
                recipient.company = value;
                break;
              case 'title':
                recipient.title = value;
                break;
              default:
                recipient.customFields[mapping.systemField] = value;
            }
          }
        }
      });

      return recipient;
    });
  };

  const handleNext = async () => {
    // Step 2: Process and save CSV contacts to database
    if (currentStep === 2 && csvFile && csvPreview.length > 0) {
      const processedRecipients = processCsvData();

      // Save contacts to database
      try {
        const savedContacts = await Promise.all(
          processedRecipients.map(async (recipient) => {
            try {
              // Create contact in database
              const contact = await api.createContact({
                name: `${recipient.firstName} ${recipient.lastName}`.trim(),
                firstName: recipient.firstName,
                lastName: recipient.lastName,
                email: recipient.email,
                phone: recipient.phone,
                company: recipient.company,
                title: recipient.title,
                type: 'call', // Mark as call contact
                status: 'active'
              });

              // Return as CallRecipient format
              return {
                ...recipient,
                id: contact.id
              };
            } catch (error) {
              console.error('Error creating contact:', error);
              return recipient; // Keep temp ID if creation fails
            }
          })
        );

        setCampaignData(prev => ({ ...prev, recipients: savedContacts }));
        toast({
          title: 'Contacts Saved',
          description: `${savedContacts.length} contacts have been added to your contacts list`
        });
      } catch (error) {
        console.error('Error saving contacts:', error);
        toast({
          title: 'Warning',
          description: 'Some contacts may not have been saved to your contacts list',
          variant: 'destructive'
        });
        // Still use the processed recipients even if save fails
        setCampaignData(prev => ({ ...prev, recipients: processedRecipients }));
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    // Use stored script content, or fetch if we only have an ID
    let scriptContent = campaignData.callScriptContent;
    if (!scriptContent && campaignData.callScript && /^\d+$/.test(campaignData.callScript)) {
      try {
        const script = await api.getCallScript(campaignData.callScript);
        scriptContent = script.script || '';
      } catch (error) {
        console.error('Failed to fetch script content:', error);
      }
    }

    const campaignPayload: Partial<ApiCallCampaign> = {
      name: campaignData.name,
      description: campaignData.description,
      caller_id: campaignData.callerId,
      call_provider: campaignData.callProvider as 'twilio' | 'vonage' | 'signalwire',
      call_script: scriptContent,
      agent_id: campaignData.agentId || null,
      agent_name: campaignData.agentId ? agents.find((a: { id: string; name: string }) => a.id === campaignData.agentId)?.name || null : null,
      status: 'draft' as const
    };

    if (isEditMode) {
      updateCampaignMutation.mutate(campaignPayload);
    } else {
      createCampaignMutation.mutate(campaignPayload);
    }
  };

  const handleStart = async () => {
    // Use stored script content, or fetch if we only have an ID
    let scriptContent = campaignData.callScriptContent;
    if (!scriptContent && campaignData.callScript && /^\d+$/.test(campaignData.callScript)) {
      try {
        const script = await api.getCallScript(campaignData.callScript);
        scriptContent = script.script || '';
      } catch (error) {
        console.error('Failed to fetch script content:', error);
      }
    }

    const campaignPayload: Partial<ApiCallCampaign> = {
      name: campaignData.name,
      description: campaignData.description,
      caller_id: campaignData.callerId,
      call_provider: campaignData.callProvider as 'twilio' | 'vonage' | 'signalwire',
      call_script: scriptContent,
      agent_id: campaignData.agentId || null,
      agent_name: campaignData.agentId ? agents.find((a: { id: string; name: string }) => a.id === campaignData.agentId)?.name || null : null,
      status: 'active' as const
    };

    if (isEditMode) {
      updateCampaignMutation.mutate(campaignPayload);
    } else {
      createCampaignMutation.mutate(campaignPayload);
    }
  };

  const steps = [
    { number: 1, title: 'Campaign Setup', icon: FileTextIcon },
    { number: 2, title: 'Select Contacts', icon: Users },
    { number: 3, title: 'Call Script', icon: MessageSquare },
    { number: 4, title: 'Settings', icon: Settings },
    { number: 5, title: isEditMode ? 'Review & Update' : 'Review & Create', icon: Calendar }
  ];

  // Show loading state when loading campaign data in edit mode
  if (isLoadingCampaign) {
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading campaign data...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="space-y-4">
          <Breadcrumb
            items={[
              { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
              { label: 'Campaigns', href: '/reach/outbound/calls/campaigns' },
              { label: isEditMode ? 'Edit Campaign' : 'New Campaign' }
            ]}
          />
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {isEditMode ? 'Edit Call Campaign' : 'Create Call Campaign'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditMode
                  ? 'Update your existing campaign settings and schedule'
                  : 'Set up a new automated calling campaign in 4 easy steps'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= step.number
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white'
                      }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Step {step.number}</div>
                      <div className="text-sm">{step.title}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-24 h-0.5 mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Set up your manual calling campaign with SignalWire integration"}
              {currentStep === 2 && "Select contacts for your manual calling campaign"}
              {currentStep === 3 && "Select or create a call script template to guide your conversations"}
              {currentStep === 4 && "Configure campaign settings including call recording and scheduling"}
              {currentStep === 5 && "Review your manual calling campaign and create it"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Campaign Details */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Q4 Sales Outreach"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={campaignData.description}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose of this campaign"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callerId">Select Number *</Label>
                  {isLoadingNumbers ? (
                    <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading available numbers from your SignalWire account...</span>
                    </div>
                  ) : availableCallerIds.length > 0 ? (
                    <>
                      <Select
                        value={campaignData.callerId}
                        onValueChange={(value) => {
                          const selectedNumber = availableCallerIds.find(n => n.phone_number === value);
                          if (selectedNumber) {
                            const connection = connections.find(c => c.id === selectedNumber.connection_id);
                            setCampaignData(prev => ({
                              ...prev,
                              callerId: value,
                              callProvider: 'signalwire'
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a phone number from your SignalWire account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCallerIds
                            .filter((callerId, index, self) =>
                              // Deduplicate by phone_number to avoid duplicate keys
                              index === self.findIndex(c => c.phone_number === callerId.phone_number)
                            )
                            .map((callerId, index) => {
                              const connection = connections.find(c => c.id === callerId.connection_id);
                              return (
                                <SelectItem key={`${callerId.phone_number}-${index}`} value={callerId.phone_number}>
                                  {callerId.phone_number} - {callerId.friendly_name}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Select from your available phone numbers. This will be the Caller ID that recipients see.
                      </p>
                    </>
                  ) : connections.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> No phone numbers found for your SignalWire connection.
                        Please ensure you have purchased or verified numbers in your SignalWire dashboard.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-blue-800 underline mt-1"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Numbers
                      </Button>
                    </div>
                  ) : connections.length === 0 ? (
                    <>
                      <Input
                        id="callerId"
                        value={campaignData.callerId}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, callerId: e.target.value }))}
                        placeholder="+1234567890"
                        required
                      />
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> No SignalWire connections found. Please connect your SignalWire account in{' '}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-yellow-800 underline inline"
                            onClick={() => navigate('/settings#sms')}
                          >
                            Settings → SMS & Voice
                          </Button>
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Agent Selection */}
                <div className="space-y-2">
                  <Label htmlFor="agent">Assign Agent (Optional)</Label>
                  <Select
                    value={campaignData.agentId || 'none'}
                    onValueChange={(value) => setCampaignData(prev => ({
                      ...prev,
                      agentId: value === 'none' ? '' : value
                    }))}
                  >
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Select an agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No agent assigned</SelectItem>
                      {agents.map((agent: { id: string; name: string }) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} {agent.email && `(${agent.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Optionally assign an agent to handle calls for this campaign
                  </p>
                  {agents.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                      <p className="text-xs text-blue-800">
                        No agents found.{' '}
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-blue-800 underline inline"
                          onClick={() => navigate('/reach/outbound/calls/agents')}
                        >
                          Create agents
                        </Button>
                        {' '}to assign them to campaigns.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <div className="flex items-start space-x-2">
                    <Phone className="h-4 w-4 text-hunter-orange mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Calling Campaign</p>
                      <p className="text-xs text-orange-700 mt-1">
                        This campaign will enable calling with click-to-call functionality.
                        You'll be able to call contacts one by one and track notes and dispositions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Contacts */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <UnifiedContactSelector
                  campaignType="call"
                  selectedContacts={campaignData.recipients}
                  onContactsChange={(contacts) => {
                    setCampaignData(prev => ({ ...prev, recipients: contacts }));
                  }}
                  showUpload={true}
                  className="w-full"
                />
              </div>
            )}

            {/* Step 3: Call Script */}
            {currentStep === 3 && (
              <CallScriptSelector
                selectedScriptId={campaignData.callScript}
                onScriptChange={(scriptId, scriptContent) => {
                  setCampaignData(prev => ({
                    ...prev,
                    callScript: scriptId,
                    callScriptContent: scriptContent
                  }));
                }}
              />
            )}

            {/* Step 4: Settings */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Campaign Settings</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Configure call recording, scheduling, and other campaign settings
                      </p>
                    </div>
                  </div>
                </div>

                {/* General Campaign Settings */}
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-1">General Settings</h3>
                    <p className="text-sm text-muted-foreground">Basic campaign configuration</p>
                  </div>

                  {/* Call Recording */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="recordingEnabled"
                        checked={campaignData.recordingEnabled}
                        onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, recordingEnabled: checked as boolean }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="recordingEnabled" className="font-medium">Enable Call Recording</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Record all calls for quality assurance, training, and compliance purposes. Recordings will be stored securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Voicemail Detection */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="voicemailEnabled"
                        checked={campaignData.voicemailEnabled}
                        onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, voicemailEnabled: checked as boolean }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="voicemailEnabled" className="font-medium">Enable Voicemail Detection</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Automatically detect when calls go to voicemail and mark them accordingly
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-3">
                    <Label className="font-medium">Working Hours</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyStartTime" className="text-sm">Start Time</Label>
                        <Input
                          id="dailyStartTime"
                          type="time"
                          value={campaignData.dailyStartTime}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, dailyStartTime: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dailyEndTime" className="text-sm">End Time</Label>
                        <Input
                          id="dailyEndTime"
                          type="time"
                          value={campaignData.dailyEndTime}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, dailyEndTime: e.target.value }))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Calls will only be made during these hours in the contact's timezone
                    </p>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Campaign Timezone</Label>
                    <Select
                      value={campaignData.timezone}
                      onValueChange={(value) => setCampaignData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto-Dialing Settings (Optional) */}
                <div className="space-y-6 border-t pt-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-1">Auto-Dialing Settings (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Configure automatic dialing behavior - only needed if using auto-dialer feature</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Auto-Dialer Feature</p>
                        <p className="text-xs text-amber-700 mt-1">
                          These settings only apply if you enable the auto-dialer feature. For manual calling campaigns, you can skip these settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Call Delay */}
                  <div className="space-y-2">
                    <Label htmlFor="callDelay">Call Delay (seconds)</Label>
                    <Input
                      id="callDelay"
                      type="number"
                      min="0"
                      max="300"
                      value={campaignData.callDelay}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, callDelay: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time to wait between automatic calls (0-300 seconds). Only applies when auto-dialer is enabled.
                    </p>
                  </div>

                  {/* Max Retries */}
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Maximum Retry Attempts</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      min="0"
                      max="10"
                      value={campaignData.maxRetries}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of times to automatically retry calling a contact if they don't answer (0-10)
                    </p>
                  </div>

                  {/* Retry Delay */}
                  <div className="space-y-2">
                    <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
                    <Input
                      id="retryDelay"
                      type="number"
                      min="5"
                      max="1440"
                      value={campaignData.retryDelay}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, retryDelay: parseInt(e.target.value) || 5 }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Time to wait before automatically retrying a failed call (5-1440 minutes)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Launch Campaign */}
            {currentStep === 5 && (
              <div className="space-y-8">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <Phone className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Calling Campaign Ready</p>
                      <p className="text-xs text-green-700 mt-1">
                        Review your settings below and create the campaign. You'll then be able to call
                        each contact with full script display, note-taking, and disposition tracking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campaign Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border mb-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Campaign Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Campaign Name:</span>
                      <span className="font-medium">{campaignData.name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Caller ID Number:</span>
                      <span className="font-medium">{campaignData.callerId || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Contacts to Call:</span>
                      <span className="font-medium">{campaignData.recipients.length} contacts</span>
                    </div>
                    {campaignData.recipients.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Preview (first 5):</span>
                        <div className="mt-1 space-y-1">
                          {campaignData.recipients.slice(0, 5).map((r, i) => (
                            <div key={i} className="text-xs text-gray-600 dark:text-gray-300">
                              • {r.firstName} {r.lastName} - {r.phone}
                            </div>
                          ))}
                          {campaignData.recipients.length > 5 && (
                            <div className="text-xs text-gray-400">
                              ... and {campaignData.recipients.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Call Script:</span>
                      <span className="font-medium">
                        {campaignData.callScriptContent
                          ? `${campaignData.callScriptContent.substring(0, 50)}${campaignData.callScriptContent.length > 50 ? '...' : ''}`
                          : 'Not set (optional)'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Call Recording:</span>
                      <span className="font-medium">{campaignData.recordingEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Next Steps After Creation:</p>
                      <ol className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                        <li>1. Campaign created with your selected contacts</li>
                        <li>2. Access your contact spreadsheet with click-to-call buttons</li>
                        <li>3. Call contacts manually with full tracking and notes</li>
                        <li>4. Optional script available during calls for guidance</li>
                        <li>5. Track call outcomes with dispositions and notes</li>
                        <li>6. Monitor progress with real-time analytics</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-3">
                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === 1 && !campaignData.name}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isEditMode ? 'Save Changes' : 'Save as Draft'}</span>
                    </Button>
                    <Button
                      onClick={handleStart}
                      disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>{isEditMode ? 'Update & Start' : 'Create Campaign'}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CallCampaignWizard;

