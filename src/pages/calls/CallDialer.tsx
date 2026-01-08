import React, { useState, useEffect, useRef } from 'react';
import { CallSession } from '@/services/signalwire-webrtc';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  FileTextIcon,
  Clock,
  MessageSquare,
  Tag,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Square,
  Save,
  SkipForward,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock3,
  UserPlus,
  Edit3,
  Trash2,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  RotateCcw,
  History,
  Star,
  Flag,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Share2,
  Settings,
  MoreVertical,
  Calendar,
  MapPin,
  Mail,
  Briefcase,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCallSession, CallSessionStatus, SharedCallSession } from '@/contexts/CallSessionContext';
import { CallCampaign, CallRecipient, CallScript, CallDisposition } from '@/types';
import { getSignalWireWebRTCService, type SignalWireCredentials } from '@/services/signalwire-webrtc';

interface CallSession {
  id: string;
  recipient: CallRecipient;
  startTime?: Date;
  endTime?: Date;
  duration: number;
  status: 'idle' | 'calling' | 'connected' | 'completed' | 'failed';
  notes: string;
  disposition?: CallDisposition;
  recordingUrl?: string;
  isMuted?: boolean;
  isOnHold?: boolean;
  callQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

const CallDialer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const webRTCService = getSignalWireWebRTCService();
  const { requestSoftphoneCall, session: softphoneSession } = useCallSession();

  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CallSession[]>([]);
  const [remainingRecipients, setRemainingRecipients] = useState<CallRecipient[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('');
  const [currentScript, setCurrentScript] = useState<CallScript | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [manualPhoneNumber, setManualPhoneNumber] = useState('');
  const [manualRecipientName, setManualRecipientName] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [showContactTable, setShowContactTable] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadInput, setKeypadInput] = useState('');
  const [callQuality, setCallQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [webRTCSession, setWebRTCSession] = useState<CallSession | null>(null);
  const [isWebRTCInitialized, setIsWebRTCInitialized] = useState(false);

  const campaign = location.state?.campaign as CallCampaign;
  const mode = location.state?.mode || (campaign ? 'campaign' : 'manual');

  const { data: scripts = [] } = useQuery({
    queryKey: ['call-scripts'],
    queryFn: api.getCallScripts
  });

  const { data: dispositions = [] } = useQuery({
    queryKey: ['call-dispositions'],
    queryFn: api.getCallDispositions
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['call-campaigns'],
    queryFn: api.getCallCampaigns
  });

  useEffect(() => {
    if (mode === 'campaign' && !campaign) {
      toast({
        title: 'Error',
        description: 'No campaign selected. Please select a campaign first.',
        variant: 'destructive',
      });
      navigate('/reach/outbound/calls/campaigns');
      return;
    }

    // Load campaign recipients in both campaign and manual modes
    if (campaign) {
      loadCampaignRecipients();
    } else if (selectedCampaignId) {
      loadCampaignRecipients();
    }
  }, [campaign, mode, selectedCampaignId, loadCampaignRecipients, navigate, toast]);

  useEffect(() => {
    if (currentSession?.status === 'connected') {
      const interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [currentSession?.status, timerInterval]);

  // Initialize WebRTC service when component mounts
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Get SignalWire credentials from campaign or settings
        const credentials: SignalWireCredentials = {
          projectId: campaign?.call_provider === 'signalwire' ? 'your_project_id' : '',
          spaceUrl: campaign?.call_provider === 'signalwire' ? 'your-space.signalwire.com' : '',
          apiToken: campaign?.call_provider === 'signalwire' ? 'your_api_token' : '',
          callerId: campaign?.caller_id || ''
        };

        if (credentials.projectId && credentials.spaceUrl && credentials.apiToken) {
          await webRTCService.initialize(credentials);
          setIsWebRTCInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        toast({
          title: 'WebRTC Error',
          description: 'Failed to initialize WebRTC calling. Falling back to REST API.',
          variant: 'destructive',
        });
      }
    };

    initializeWebRTC();

    // Cleanup on unmount
    return () => {
      webRTCService.destroy();
    };
  }, [campaign?.call_provider, campaign?.caller_id, toast, webRTCService]);

  const loadCampaignRecipients = async () => {
    try {
      const campaignId = campaign?.id || selectedCampaignId;
      if (!campaignId) return;

      const recipients = await api.getCallRecipients(campaignId);
      const pendingRecipients = recipients.filter(r => !r.last_called_at);
      setRemainingRecipients(pendingRecipients);

      if (pendingRecipients.length === 0) {
        toast({
          title: 'Campaign Complete',
          description: 'All recipients have been called.',
        });
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign recipients.',
        variant: 'destructive',
      });
    }
  };

  const handleRecipientSelection = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    if (recipientId && recipientId !== 'manual') {
      const recipient = remainingRecipients.find(r => r.id === recipientId);
      if (recipient) {
        setManualPhoneNumber(recipient.phone);
        setManualRecipientName(`${recipient.first_name} ${recipient.last_name}`.trim());
        setShowContactTable(false); // Hide table when recipient is selected
      }
    } else {
      setManualPhoneNumber('');
      setManualRecipientName('');
    }
  };

  const handleContactTableCall = (recipient: CallRecipient) => {
    setSelectedRecipientId(recipient.id);
    setManualPhoneNumber(recipient.phone);
    setManualRecipientName(`${recipient.first_name} ${recipient.last_name}`.trim());
    setShowContactTable(false); // Hide table when calling from table
  };

  const resetManualInput = () => {
    setSelectedRecipientId('');
    setManualPhoneNumber('');
    setManualRecipientName('');
    setShowContactTable(true); // Show table again
  };

  const getDispositionIcon = (category: string) => {
    switch (category) {
      case 'positive': return <CheckCircle className="h-4 w-4" />;
      case 'negative': return <XCircle className="h-4 w-4" />;
      case 'neutral': return <Clock3 className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getDispositionColor = (category: string) => {
    switch (category) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'neutral': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    let recipient: CallRecipient;

    if (mode === 'manual') {
      // Manual mode - create a temporary recipient from manual input
      if (!manualPhoneNumber.trim()) {
        toast({
          title: 'Phone Number Required',
          description: 'Please enter a phone number to call.',
          variant: 'destructive',
        });
        return;
      }

      recipient = {
        id: `manual-${Date.now()}`,
        first_name: manualRecipientName || 'Unknown',
        last_name: '',
        phone: manualPhoneNumber,
        company: '',
        title: '',
        email: '',
        status: 'active',
        campaign_id: selectedCampaignId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      // Campaign mode - use next recipient from list
      if (remainingRecipients.length === 0) {
        toast({
          title: 'No Recipients',
          description: 'No remaining recipients to call.',
          variant: 'destructive',
        });
        return;
      }

      recipient = remainingRecipients[0];
    }

    // Use softphone integration instead of WebRTC
    try {
      setIsCalling(true);

      // Request softphone to make the call
      requestSoftphoneCall({
        number: recipient.phone,
        recipientName: `${recipient.first_name} ${recipient.last_name}`.trim() || recipient.phone,
        campaignId: selectedCampaignId,
        source: 'dialer',
        note: callNotes,
        metadata: {
          recipientId: recipient.id,
          campaignId: selectedCampaignId,
          mode: mode
        }
      });

      // Create local session for tracking
      const session: CallSession = {
        id: `session-${Date.now()}`,
        recipient: recipient,
        duration: 0,
        status: 'calling',
        notes: callNotes,
        isMuted: false,
        isOnHold: false,
        callQuality: 'good'
      };

      setCurrentSession(session);
      setCallTimer(0);

      // Remove from remaining recipients if in campaign mode
      if (mode === 'campaign') {
        setRemainingRecipients(prev => prev.slice(1));
      }

      toast({
        title: 'Call Initiated',
        description: `Calling ${recipient.first_name} ${recipient.last_name} at ${recipient.phone}`,
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      toast({
        title: 'Call Failed',
        description: 'Failed to initiate call. Please try again.',
        variant: 'destructive',
      });
      setIsCalling(false);
    }
  };

  const endCall = async () => {
    if (!currentSession) return;

    setIsCalling(false);
    setIsRecording(false);
    setIsMuted(false);

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    const endedSession = {
      ...currentSession,
      status: 'completed' as const,
      endTime: new Date(),
      duration: callTimer,
      notes: editingNotes || callNotes,
      disposition: dispositions.find(d => d.id === selectedDisposition)
    };

    setSessionHistory(prev => [...prev, endedSession]);
    setCallHistory(prev => [...prev, endedSession]);

    if (mode !== 'manual') {
      setRemainingRecipients(prev => prev.slice(1));
    }

    setCurrentSession(null);
    setCallTimer(0);
    setIsEditingNotes(false);
    setKeypadInput('');
    setShowKeypad(false);

    try {
      // End WebRTC call if active
      if (webRTCSession && webRTCService.isCallActive()) {
        await webRTCService.endCall();
        setWebRTCSession(null);
      }

      // Save call log
      const campaignId = campaign?.id || selectedCampaignId;
      if (campaignId) {
        await api.createCallLog({
          campaign_id: campaignId,
          recipient_id: endedSession.recipient.id,
          call_duration: endedSession.duration,
          outcome: endedSession.disposition?.category || 'completed',
          notes: endedSession.notes,
          disposition_id: endedSession.disposition?.id,
          recording_url: endedSession.recordingUrl
        });
      }

      toast({
        title: 'Call Completed',
        description: `Call with ${endedSession.recipient.first_name} completed.`,
      });

      // Reset for next call
      if (mode === 'manual') {
        resetManualInput();
      }
    } catch (error) {
      console.error('Error saving call log:', error);
      toast({
        title: 'Error',
        description: 'Failed to save call log.',
        variant: 'destructive',
      });
    }
  };

  const skipRecipient = () => {
    if (!currentSession) return;

    const skippedSession = {
      ...currentSession,
      status: 'completed' as const,
      notes: 'Skipped - No answer'
    };

    setSessionHistory(prev => [...prev, skippedSession]);
    setCallHistory(prev => [...prev, skippedSession]);

    if (mode !== 'manual') {
      setRemainingRecipients(prev => prev.slice(1));
    }

    setCurrentSession(null);
    setIsCalling(false);
    setCallTimer(0);
    setCallNotes('');
    setSelectedDisposition('');
    setIsRecording(false);
    setIsMuted(false);
    setShowKeypad(false);
    setKeypadInput('');

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const toggleMute = () => {
    if (!currentSession) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setCurrentSession(prev => prev ? { ...prev, isMuted: newMutedState } : null);

    // Try WebRTC mute first, fallback to API
    if (webRTCSession && webRTCService.isCallActive()) {
      webRTCService.toggleMute()
        .then(muted => {
          setIsMuted(muted);
          setCurrentSession(prev => prev ? { ...prev, isMuted: muted } : null);
        })
        .catch(error => {
          console.error('WebRTC mute failed, falling back to API:', error);
          // Fallback to API call
          api.toggleMute({ sessionId: currentSession.id, muted: newMutedState })
            .catch(apiError => {
              console.error('Error toggling mute:', apiError);
              toast({
                title: 'Error',
                description: 'Failed to toggle mute.',
                variant: 'destructive',
              });
            });
        });
    } else {
      // API call to mute/unmute
      api.toggleMute({ sessionId: currentSession.id, muted: newMutedState })
        .catch(error => {
          console.error('Error toggling mute:', error);
          toast({
            title: 'Error',
            description: 'Failed to toggle mute.',
            variant: 'destructive',
          });
        });
    }
  };

  const toggleRecording = () => {
    if (!currentSession) return;

    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);

    // API call to start/stop recording
    api.toggleRecording({ sessionId: currentSession.id, recording: newRecordingState })
      .then(result => {
        if (result.recordingUrl) {
          setCurrentSession(prev => prev ? { ...prev, recordingUrl: result.recordingUrl } : null);
        }
      })
      .catch(error => {
        console.error('Error toggling recording:', error);
        toast({
          title: 'Error',
          description: 'Failed to toggle recording.',
          variant: 'destructive',
        });
      });
  };

  const sendDTMF = (digit: string) => {
    if (!currentSession) return;

    setKeypadInput(prev => prev + digit);

    // Try WebRTC DTMF first, fallback to API
    if (webRTCSession && webRTCService.isCallActive()) {
      webRTCService.sendDTMF(digit)
        .catch(error => {
          console.error('WebRTC DTMF failed, falling back to API:', error);
          // Fallback to API call
          api.sendDTMF({ sessionId: currentSession.id, digit })
            .catch(apiError => {
              console.error('Error sending DTMF:', apiError);
              toast({
                title: 'Error',
                description: 'Failed to send DTMF tone.',
                variant: 'destructive',
              });
            });
        });
    } else {
      // API call to send DTMF tone
      api.sendDTMF({ sessionId: currentSession.id, digit })
        .catch(error => {
          console.error('Error sending DTMF:', error);
          toast({
            title: 'Error',
            description: 'Failed to send DTMF tone.',
            variant: 'destructive',
          });
        });
    }
  };

  const clearKeypad = () => {
    setKeypadInput('');
  };

  const copyPhoneNumber = () => {
    if (currentSession?.recipient.phone) {
      navigator.clipboard.writeText(currentSession.recipient.phone);
      toast({
        title: 'Copied',
        description: 'Phone number copied to clipboard.',
      });
    }
  };

  const downloadRecording = () => {
    if (currentSession?.recordingUrl) {
      const link = document.createElement('a');
      link.href = currentSession.recordingUrl;
      link.download = `call-recording-${currentSession.recipient.first_name}-${Date.now()}.wav`;
      link.click();
    } else {
      toast({
        title: 'No Recording',
        description: 'No recording available for this call.',
        variant: 'destructive',
      });
    }
  };

  const getScriptContent = () => {
    if (!currentScript || !currentSession) return '';

    return currentScript.content
      .replace(/\{\{firstName\}\}/g, currentSession.recipient.first_name)
      .replace(/\{\{lastName\}\}/g, currentSession.recipient.last_name)
      .replace(/\{\{company\}\}/g, currentSession.recipient.company || '')
      .replace(/\{\{title\}\}/g, currentSession.recipient.title || '');
  };

  const startEditingNotes = () => {
    setEditingNotes(callNotes);
    setIsEditingNotes(true);
  };

  const saveNotes = () => {
    setCallNotes(editingNotes);
    setIsEditingNotes(false);
  };

  const cancelEditingNotes = () => {
    setEditingNotes('');
    setIsEditingNotes(false);
  };

  if (!campaign && mode !== 'manual') {
    return null;
  }

  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
                { label: 'Campaigns', href: '/reach/outbound/calls/campaigns' },
                ...(campaign ? [
                  { label: campaign.name, href: `/reach/outbound/calls/campaigns/${campaign.id}` }
                ] : []),
                { label: 'Dialer' }
              ]}
            />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {mode === 'campaign' ? 'Campaign Dialer' : 'Dialer'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {campaign ? `Campaign: ${campaign.name} • ${remainingRecipients.length} remaining calls` :
                    selectedCampaignId ? `Campaign: ${campaigns.find(c => c.id === selectedCampaignId)?.name} • ${remainingRecipients.length} recipients available` :
                      'Manual dialing mode'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {mode !== 'manual' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactTable(!showContactTable)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {showContactTable ? 'Hide Contacts' : 'Show Contacts'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/reach/outbound/calls/campaigns')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Button>
              </div>
            </div>

            {/* Contact Table - Show when not in active call */}
            {showContactTable && !currentSession && remainingRecipients.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Campaign Contacts
                  </CardTitle>
                  <CardDescription>
                    Click the call button next to any contact to start calling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {remainingRecipients.map((recipient) => (
                          <TableRow key={recipient.id}>
                            <TableCell className="font-medium">
                              {recipient.first_name} {recipient.last_name}
                            </TableCell>
                            <TableCell>{recipient.phone}</TableCell>
                            <TableCell>{recipient.company || '-'}</TableCell>
                            <TableCell>{recipient.title || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Ready to Call
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleContactTableCall(recipient)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <PhoneCall className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Call Control Panel */}
              <div className="lg:col-span-2">
                <Card className="border-analytics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Call Control
                    </CardTitle>
                    <CardDescription>
                      {currentSession
                        ? `Calling ${currentSession.recipient.first_name} ${currentSession.recipient.last_name}`
                        : 'Ready to start calling'
                      }
                      {isWebRTCInitialized && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          WebRTC Ready
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Manual Input Fields */}
                    {mode === 'manual' && !currentSession && (
                      <div className="bg-muted border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-foreground">Manual Dial</h4>
                          {(selectedRecipientId || manualPhoneNumber) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={resetManualInput}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {/* Campaign Selector */}
                          {campaigns.length > 0 && (
                            <div>
                              <Label htmlFor="select-campaign">Select Campaign (Optional)</Label>
                              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                <SelectTrigger id="select-campaign" className="mt-1">
                                  <SelectValue placeholder="Choose a campaign..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">No campaign - manual entry</SelectItem>
                                  {campaigns.map((campaign) => (
                                    <SelectItem key={campaign.id} value={campaign.id}>
                                      {campaign.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Select from Campaign Recipients */}
                          {remainingRecipients.length > 0 && (
                            <div>
                              <Label htmlFor="select-recipient">Select from Campaign Recipients</Label>
                              <Select value={selectedRecipientId} onValueChange={handleRecipientSelection}>
                                <SelectTrigger id="select-recipient" className="mt-1">
                                  <SelectValue placeholder="Choose a recipient..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Enter manually</SelectItem>
                                  {remainingRecipients.map((recipient) => (
                                    <SelectItem key={recipient.id} value={recipient.id}>
                                      {recipient.first_name} {recipient.last_name} - {recipient.phone}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="manual-phone">Phone Number</Label>
                            <Input
                              id="manual-phone"
                              value={manualPhoneNumber}
                              onChange={(e) => setManualPhoneNumber(e.target.value)}
                              placeholder="Enter phone number"
                              className="mt-1"
                              disabled={selectedRecipientId !== ''}
                            />
                          </div>
                          <div>
                            <Label htmlFor="manual-name">Recipient Name (Optional)</Label>
                            <Input
                              id="manual-name"
                              value={manualRecipientName}
                              onChange={(e) => setManualRecipientName(e.target.value)}
                              placeholder="Enter recipient name"
                              className="mt-1"
                              disabled={selectedRecipientId !== ''}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Recipient Info */}
                    {currentSession && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-orange-900">
                              {currentSession.recipient.first_name} {currentSession.recipient.last_name}
                            </h3>
                            <p className="text-sm text-orange-700">
                              {currentSession.recipient.phone} • {currentSession.recipient.company}
                            </p>
                            {currentSession.recipient.title && (
                              <p className="text-sm text-orange-600">{currentSession.recipient.title}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-mono text-orange-900">
                              {formatCallDuration(callTimer)}
                            </div>
                            <Badge
                              variant={currentSession.status === 'connected' ? 'default' : 'secondary'}
                              className={currentSession.status === 'connected' ? 'bg-green-500' : ''}
                            >
                              {currentSession.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Call Actions */}
                    <div className="space-y-4">
                      {/* Main Call Controls */}
                      <div className="flex justify-center space-x-4">
                        {!currentSession ? (
                          <Button
                            size="lg"
                            onClick={startCall}
                            disabled={remainingRecipients.length === 0 && mode !== 'manual'}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PhoneCall className="h-5 w-5 mr-2" />
                            Start Call
                          </Button>
                        ) : (
                          <>
                            {currentSession.status === 'calling' && (
                              <Button
                                size="lg"
                                variant="outline"
                                onClick={endCall}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <PhoneOff className="h-5 w-5 mr-2" />
                                End Call
                              </Button>
                            )}
                            {currentSession.status === 'connected' && (
                              <>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  onClick={endCall}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <PhoneOff className="h-5 w-5 mr-2" />
                                  End Call
                                </Button>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  onClick={skipRecipient}
                                >
                                  <SkipForward className="h-5 w-5 mr-2" />
                                  Skip
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* Advanced Call Controls (Connected Only) */}
                      {currentSession?.status === 'connected' && (
                        <div className="space-y-3">
                          {/* Secondary Controls */}
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={toggleMute}
                              className={isMuted ? 'bg-red-100 text-red-800' : ''}
                            >
                              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={toggleRecording}
                              className={isRecording ? 'bg-red-100 text-red-800' : ''}
                            >
                              {isRecording ? <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /> : <div className="w-3 h-3 border-2 border-current rounded-full" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowKeypad(!showKeypad)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={copyPhoneNumber}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                            >
                              <Settings className="h-4 w-4" />
                              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvancedControls ? 'rotate-180' : ''}`} />
                            </Button>
                          </div>

                          {/* Keypad */}
                          {showKeypad && (
                            <div className="bg-muted border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm">Keypad</Label>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono bg-background px-2 py-1 rounded">{keypadInput}</span>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={clearKeypad}
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                                  <Button
                                    key={digit}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sendDTMF(digit)}
                                    className="font-mono"
                                  >
                                    {digit}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Advanced Controls */}
                          {showAdvancedControls && (
                            <div className="bg-muted border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Call Quality</Label>
                                <div className="flex items-center space-x-2">
                                  {(['excellent', 'good', 'fair', 'poor'] as const).map(quality => (
                                    <Button
                                      key={quality}
                                      size="xs"
                                      variant={callQuality === quality ? 'default' : 'outline'}
                                      onClick={() => setCallQuality(quality)}
                                      className="capitalize"
                                    >
                                      {quality}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              {currentSession.recordingUrl && (
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Recording</Label>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={downloadRecording}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Enhanced Call Notes with Edit Functionality */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="call-notes">Call Notes</Label>
                        {currentSession && !isEditingNotes && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={startEditingNotes}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>

                      {isEditingNotes ? (
                        <div className="space-y-2">
                          <Textarea
                            id="editing-notes"
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="Add notes about this call..."
                            rows={4}
                            className="mt-1"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingNotes}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveNotes}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Textarea
                          id="call-notes"
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          placeholder="Add notes about this call..."
                          rows={4}
                          className="mt-2"
                          disabled={!currentSession}
                        />
                      )}
                    </div>

                    {/* Enhanced Disposition with Icons */}
                    <div>
                      <Label htmlFor="disposition">Call Disposition</Label>
                      <Select
                        value={selectedDisposition}
                        onValueChange={setSelectedDisposition}
                      >
                        <SelectTrigger id="disposition" className="mt-2">
                          <SelectValue placeholder="Select call outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          {dispositions.map(disposition => (
                            <SelectItem key={disposition.id} value={disposition.id}>
                              <div className="flex items-center space-x-2">
                                <span className={getDispositionColor(disposition.category)}>
                                  {getDispositionIcon(disposition.category)}
                                </span>
                                <Badge
                                  variant={disposition.category === 'positive' ? 'default' :
                                    disposition.category === 'negative' ? 'destructive' : 'secondary'}
                                >
                                  {disposition.category}
                                </Badge>
                                <span>{disposition.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Enhanced Call History Preview */}
                    {sessionHistory.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Recent Calls</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCallHistory(!showCallHistory)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            {showCallHistory ? 'Hide' : 'Show'} All
                          </Button>
                        </div>
                        <ScrollArea className="h-[150px] mt-2 border rounded-md">
                          <div className="p-3 space-y-2">
                            {sessionHistory.slice(-5).reverse().map((session, index) => (
                              <div key={session.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded hover:bg-accent transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {session.status === 'completed' ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : session.status === 'failed' ? (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Clock3 className="h-4 w-4 text-yellow-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{session.recipient.first_name} {session.recipient.last_name}</div>
                                    <div className="text-muted-foreground">{session.recipient.phone}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono">{formatCallDuration(session.duration)}</div>
                                  {session.disposition && (
                                    <Badge variant="outline" className="text-xs">
                                      {session.disposition.name}
                                    </Badge>
                                  )}
                                  {session.recordingUrl && (
                                    <div className="mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                                        Recorded
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Script Panel */}
              <div>
                <Card className="border-analytics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5" />
                      Call Script
                    </CardTitle>
                    <CardDescription>
                      <Select
                        value={currentScript?.id || ''}
                        onValueChange={(value) => {
                          const script = scripts.find(s => s.id === value);
                          setCurrentScript(script || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a script" />
                        </SelectTrigger>
                        <SelectContent>
                          {scripts.map(script => (
                            <SelectItem key={script.id} value={script.id}>
                              {script.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentScript ? (
                      <div className="space-y-4">
                        <div className="bg-muted border rounded-lg p-4">
                          <h4 className="font-medium mb-2 text-foreground">Script Content</h4>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {getScriptContent()}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>Estimated duration: {currentScript.estimatedDuration}s</p>
                          <p>Difficulty: {currentScript.difficulty}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a script to view content</p>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced Progress Panel */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Progress & Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Main Stats */}
                      {mode !== 'manual' && (
                        <div className="flex justify-between text-sm">
                          <span>Remaining</span>
                          <span className="font-medium text-foreground">{remainingRecipients.length}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium text-foreground">{sessionHistory.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="font-medium text-foreground">
                          {sessionHistory.length > 0
                            ? Math.round((sessionHistory.filter(s => s.status === 'completed').length / sessionHistory.length) * 100)
                            : 0}%
                        </span>
                      </div>

                      {/* Detailed Stats */}
                      {sessionHistory.length > 0 && (
                        <div className="pt-2 border-t space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Positive Outcomes</span>
                            <span className="text-green-600">
                              {sessionHistory.filter(s => s.disposition?.category === 'positive').length}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Negative Outcomes</span>
                            <span className="text-red-600">
                              {sessionHistory.filter(s => s.disposition?.category === 'negative').length}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Neutral Outcomes</span>
                            <span className="text-yellow-600">
                              {sessionHistory.filter(s => s.disposition?.category === 'neutral').length}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Recorded Calls</span>
                            <span className="text-hunter-orange">
                              {sessionHistory.filter(s => s.recordingUrl).length}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {mode !== 'manual' && remainingRecipients.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${((sessionHistory.length) / (sessionHistory.length + remainingRecipients.length)) * 100}%`
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-center">
                            {sessionHistory.length} of {sessionHistory.length + remainingRecipients.length} completed
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Quick Actions</span>
                          <div className="flex space-x-1">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setShowCallHistory(true)}
                            >
                              <History className="h-3 w-3" />
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={loadCampaignRecipients}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call History Modal */}
      <Dialog open={showCallHistory} onOpenChange={setShowCallHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Call History</DialogTitle>
            <DialogDescription>
              Complete history of calls made during this session
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No calls made yet
                    </TableCell>
                  </TableRow>
                ) : (
                  callHistory.reverse().map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {session.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : session.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock3 className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="capitalize">{session.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.recipient.first_name} {session.recipient.last_name}</div>
                          {session.recipient.company && (
                            <div className="text-sm text-muted-foreground">{session.recipient.company}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{session.recipient.phone}</TableCell>
                      <TableCell>
                        <span className="font-mono">{formatCallDuration(session.duration)}</span>
                      </TableCell>
                      <TableCell>
                        {session.disposition && (
                          <Badge
                            variant={session.disposition.category === 'positive' ? 'default' :
                              session.disposition.category === 'negative' ? 'destructive' : 'secondary'}
                          >
                            {session.disposition.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.recordingUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = session.recordingUrl!;
                              link.download = `call-recording-${session.recipient.first_name}-${Date.now()}.wav`;
                              link.click();
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No recording</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm truncate">{session.notes || 'No notes'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {session.startTime ? new Date(session.startTime).toLocaleTimeString() : '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallDialer;

